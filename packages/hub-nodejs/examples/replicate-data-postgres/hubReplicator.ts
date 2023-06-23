import {
  CastAddMessage,
  CastRemoveMessage,
  HubRpcClient,
  IdRegistryEvent,
  Message,
  NameRegistryEvent,
  ReactionAddMessage,
  ReactionRemoveMessage,
  SignerAddMessage,
  SignerRemoveMessage,
  LinkAddMessage,
  LinkRemoveMessage,
  UserDataAddMessage,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
  isCastAddMessage,
  isCastRemoveMessage,
  isMergeIdRegistryEventHubEvent,
  isMergeMessageHubEvent,
  isMergeNameRegistryEventHubEvent,
  isPruneMessageHubEvent,
  isReactionAddMessage,
  isReactionRemoveMessage,
  isRevokeMessageHubEvent,
  isSignerAddMessage,
  isSignerRemoveMessage,
  isUserDataAddMessage,
  isLinkAddMessage,
  isLinkRemoveMessage,
  isVerificationAddEthAddressMessage,
  isVerificationRemoveMessage,
  getSSLHubRpcClient,
  getInsecureHubRpcClient,
} from '@farcaster/hub-nodejs';
import { HubSubscriber } from './hubSubscriber';
import { Logger } from 'pino';
import { Database } from './db';
import { Kysely, sql } from 'kysely';
import { bytesToHex, farcasterTimeToDate } from './util';
import * as fastq from 'fastq';
import type { queueAsPromised } from 'fastq';
import prettyMilliseconds from 'pretty-ms';
import os from 'node:os';

type StoreMessageOperation = 'merge' | 'delete' | 'prune' | 'revoke';

// If you're hitting out-of-memory errors, try decreasing this to reduce overall
// memory usage.
const MAX_PAGE_SIZE = 3_000;

// Max FIDs to fetch in parallel
const MAX_JOB_CONCURRENCY = Number(process.env['MAX_CONCURRENCY']) || os.cpus().length;

export class HubReplicator {
  private client: HubRpcClient;
  private subscriber: HubSubscriber;

  constructor(private hubAddress: string, private ssl: boolean, private db: Kysely<Database>, private log: Logger) {
    this.client = this.ssl ? getSSLHubRpcClient(hubAddress) : getInsecureHubRpcClient(hubAddress);
    this.subscriber = new HubSubscriber(this.client, log);

    this.subscriber.on('event', async (hubEvent) => {
      if (isMergeMessageHubEvent(hubEvent)) {
        this.log.info(`[Sync] Processing merge event ${hubEvent.id} from stream`);
        await this.onMergeMessages([hubEvent.mergeMessageBody.message]);
        await this.storeMessages(hubEvent.mergeMessageBody.deletedMessages, 'delete');
      } else if (isPruneMessageHubEvent(hubEvent)) {
        this.log.info(`[Sync] Processing prune event ${hubEvent.id}`);
        await this.onPruneMessages([hubEvent.pruneMessageBody.message]);
      } else if (isRevokeMessageHubEvent(hubEvent)) {
        this.log.info(`[Sync] Processing revoke event ${hubEvent.id}`);
        await this.onRevokeMessages([hubEvent.revokeMessageBody.message]);
      } else if (isMergeIdRegistryEventHubEvent(hubEvent)) {
        this.log.info(`[Sync] Processing ID registry event ${hubEvent.id}`);
        await this.onIdRegistryEvent(hubEvent.mergeIdRegistryEventBody.idRegistryEvent);
      } else if (isMergeNameRegistryEventHubEvent(hubEvent)) {
        this.log.info(`[Sync] Processing name registry event ${hubEvent.id}`);
        await this.onNameRegistryEvent(hubEvent.mergeNameRegistryEventBody.nameRegistryEvent);
      } else {
        this.log.warn(`[Sync] Unknown type ${hubEvent.type} of event ${hubEvent.id}. Ignoring`);
      }

      // Keep track of how many events we've processed.
      await this.db
        .insertInto('hubSubscriptions')
        .values({ host: this.hubAddress, lastEventId: hubEvent.id })
        .onConflict((oc) =>
          oc.columns(['host']).doUpdateSet({
            lastEventId: hubEvent.id,
          })
        )
        .execute();
    });
  }

  public async start() {
    const infoResult = await this.client.getInfo({ dbStats: true });

    if (infoResult.isErr() || infoResult.value.dbStats === undefined) {
      throw new Error(`Unable to get information about hub ${this.hubAddress}`);
    }

    const { numMessages } = infoResult.value.dbStats;

    // Not technically true, since hubs don't return CastRemove/etc. messages,
    // but at least gives a rough ballpark of order of magnitude.
    this.log.info(`[Backfill] Fetching messages from hub ${this.hubAddress} (~${numMessages} messages)`);

    // Process live events going forward, starting from the last event we
    // processed (if there was one).
    const subscription = await this.db
      .selectFrom('hubSubscriptions')
      .where('host', '=', this.hubAddress)
      .select('lastEventId')
      .executeTakeFirst();
    this.subscriber.start(subscription?.lastEventId);

    // Start backfilling all historical data in the background
    this.backfill();
  }

  public stop() {
    this.subscriber.stop();
  }

  public destroy() {
    this.subscriber.destroy();
  }

  private async backfill() {
    const maxFidResult = await this.client.getFids({ pageSize: 1, reverse: true });
    if (maxFidResult.isErr()) throw new Error('Unable to backfill', { cause: maxFidResult.error });

    const maxFid = maxFidResult.value.fids[0];
    let totalProcessed = 0;
    const startTime = Date.now();
    const queue: queueAsPromised<{ fid: number }> = fastq.promise(async ({ fid }) => {
      await this.processAllMessagesForFid(fid);

      totalProcessed += 1;
      const elapsedMs = Date.now() - startTime;
      const millisRemaining = Math.ceil((elapsedMs / totalProcessed) * (maxFid - totalProcessed));
      this.log.info(
        `[Backfill] Completed FID ${fid}/${maxFid}. Estimated time remaining: ${prettyMilliseconds(millisRemaining)}`
      );
    }, MAX_JOB_CONCURRENCY);

    for (let fid = 1; fid <= maxFid; fid++) {
      queue.push({ fid });
    }

    await queue.drained();
    this.log.info(`[Backfill] Completed in ${prettyMilliseconds(Date.now() - startTime)}`);
  }

  private async processAllMessagesForFid(fid: number) {
    await this.client
      .getIdRegistryEvent({ fid })
      .then((result) => result.map((event) => this.onIdRegistryEvent(event)));

    // Fetch all messages serially in batches to reduce memory consumption.
    // Your implementation can likely do more in parallel, but we wanted an
    // example that works on resource constrained hardware.
    for (const fn of [
      this.getCastsByFidInBatchesOf,
      this.getReactionsByFidInBatchesOf,
      this.getLinksByFidInBatchesOf,
      this.getSignersByFidInBatchesOf,
      this.getVerificationsByFidInBatchesOf,
      this.getUserDataByFidInBatchesOf,
    ]) {
      for await (const messages of fn.call(this, fid, MAX_PAGE_SIZE)) {
        await this.onMergeMessages(messages);
      }
    }
  }

  private async *getCastsByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getCastsByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getCastsByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getReactionsByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getReactionsByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getReactionsByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getLinksByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getLinksByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getLinksByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getSignersByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getSignersByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getSignersByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getVerificationsByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getVerificationsByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getVerificationsByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getUserDataByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getUserDataByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error('Unable to backfill', { cause: result.error });
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getUserDataByFid({ pageSize, pageToken, fid });
    }
  }

  private async storeMessages(messages: Message[], operation: StoreMessageOperation) {
    if (!messages?.length) return {};

    const now = new Date();

    const messageRows = await this.db
      .insertInto('messages')
      .values(
        messages.map((message) => {
          if (!message.data) throw new Error('Message missing data!'); // Shouldn't happen
          return {
            createdAt: now,
            updatedAt: now,
            fid: message.data.fid,
            messageType: message.data.type,
            timestamp: farcasterTimeToDate(message.data.timestamp),
            hash: message.hash,
            hashScheme: message.hashScheme,
            signature: message.signature,
            signatureScheme: message.signatureScheme,
            signer: message.signer,
            raw: Message.encode(message).finish(),
            deletedAt: operation === 'delete' ? now : null,
            prunedAt: operation === 'prune' ? now : null,
            revokedAt: operation === 'revoke' ? now : null,
          };
        })
      )
      .onConflict((oc) =>
        oc
          .columns(['hash'])
          .doUpdateSet(({ ref }) => ({
            updatedAt: now,
            // Only the signer or message state could have changed
            signature: ref('excluded.signature'),
            signatureScheme: ref('excluded.signatureScheme'),
            signer: ref('excluded.signer'),
            deletedAt: operation === 'delete' ? now : null,
            prunedAt: operation === 'prune' ? now : null,
            revokedAt: operation === 'revoke' ? now : null,
          }))
          .where(({ or, cmpr, ref }) =>
            // Only update if a value has actually changed
            or([
              cmpr('excluded.signature', '!=', ref('messages.signature')),
              cmpr('excluded.signatureScheme', '!=', ref('messages.signatureScheme')),
              cmpr('excluded.signer', '!=', ref('messages.signer')),
              cmpr('excluded.deletedAt', 'is', sql`distinct from ${ref('messages.deletedAt')}`),
              cmpr('excluded.prunedAt', 'is', sql`distinct from ${ref('messages.prunedAt')}`),
              cmpr('excluded.revokedAt', 'is', sql`distinct from ${ref('messages.revokedAt')}`),
            ])
          )
      )
      .returning(['hash', 'updatedAt', 'createdAt'])
      .execute();

    // Return map indicating whether a given hash is a new message.
    // No entry means it wasn't a new message.
    return Object.fromEntries(messageRows.map((row) => [bytesToHex(row.hash), row.updatedAt === row.createdAt]));
  }

  private async onIdRegistryEvent(event: IdRegistryEvent) {
    await this.db
      .insertInto('fids')
      .values({ fid: event.fid, custodyAddress: event.to })
      .onConflict((oc) => oc.columns(['fid']).doUpdateSet({ custodyAddress: event.to, updatedAt: new Date() }))
      .execute();
  }

  private async onNameRegistryEvent(event: NameRegistryEvent) {
    const custodyAddress = event.to;
    const expiresAt = farcasterTimeToDate(event.expiry);

    await this.db
      .insertInto('fnames')
      .values({
        fname: Buffer.from(event.fname).toString('utf8'),
        custodyAddress,
        expiresAt,
      })
      .onConflict((oc) => oc.columns(['fname']).doUpdateSet({ custodyAddress, expiresAt, updatedAt: new Date() }))
      .execute();
  }

  private async onMergeMessages(messages: Message[]) {
    if (!messages?.length) return;

    const firstMessage = messages[0]; // All messages will have the same type as the first
    const isInitialCreation = await this.storeMessages(messages, 'merge');

    if (isCastAddMessage(firstMessage)) {
      await this.onCastAdd(messages as CastAddMessage[], isInitialCreation);
    } else if (isCastRemoveMessage(firstMessage)) {
      await this.onCastRemove(messages as CastRemoveMessage[]);
    } else if (isReactionAddMessage(firstMessage)) {
      await this.onReactionAdd(messages as ReactionAddMessage[], isInitialCreation);
    } else if (isReactionRemoveMessage(firstMessage)) {
      await this.onReactionRemove(messages as ReactionRemoveMessage[]);
    } else if (isVerificationAddEthAddressMessage(firstMessage)) {
      await this.onVerificationAddEthAddress(messages as VerificationAddEthAddressMessage[], isInitialCreation);
    } else if (isVerificationRemoveMessage(firstMessage)) {
      await this.onVerificationRemove(messages as VerificationRemoveMessage[]);
    } else if (isSignerAddMessage(firstMessage)) {
      await this.onSignerAdd(messages as SignerAddMessage[], isInitialCreation);
    } else if (isSignerRemoveMessage(firstMessage)) {
      await this.onSignerRemove(messages as SignerRemoveMessage[]);
    } else if (isUserDataAddMessage(firstMessage)) {
      await this.onUserDataAdd(messages as UserDataAddMessage[], isInitialCreation);
    } else if (isLinkAddMessage(firstMessage)) {
      await this.onLinkAdd(messages as LinkAddMessage[], isInitialCreation);
    } else if (isLinkRemoveMessage(firstMessage)) {
      await this.onLinkRemove(messages as LinkRemoveMessage[]);
    }
  }

  private async onPruneMessages(messages: Message[]) {
    this.storeMessages(messages, 'prune');
  }

  private async onRevokeMessages(messages: Message[]) {
    this.storeMessages(messages, 'revoke');
  }

  private async onCastAdd(messages: CastAddMessage[], isInitialCreation: Record<string, boolean>) {
    await this.db
      .insertInto('casts')
      .values(
        messages.map((message) => ({
          timestamp: farcasterTimeToDate(message.data.timestamp),
          fid: message.data.fid,
          text: message.data.castAddBody.text,
          hash: message.hash,
          parentHash: message.data.castAddBody.parentCastId?.hash,
          parentFid: message.data.castAddBody.parentCastId?.fid,
          parentUrl: message.data.castAddBody.parentUrl,
          embeds: message.data.castAddBody.embedsDeprecated,
          mentions: message.data.castAddBody.mentions,
          mentionsPositions: message.data.castAddBody.mentionsPositions,
        }))
      )
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects, e.g. sending push
        // notifications to user whose cast was replied to, etc.
      }
    }
  }

  private async onCastRemove(messages: CastRemoveMessage[]) {
    for (const message of messages) {
      await this.db
        .updateTable('casts')
        .where('fid', '=', message.data.fid)
        .where('hash', '=', message.data.castRemoveBody.targetHash)
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
        .execute();

      // TODO: Execute any cleanup side effects to remove the cast
    }
  }

  private async onReactionAdd(messages: ReactionAddMessage[], isInitialCreation: Record<string, boolean>) {
    await this.db
      .insertInto('reactions')
      .values(
        messages.map((message) => ({
          fid: message.data.fid,
          timestamp: farcasterTimeToDate(message.data.timestamp),
          hash: message.hash,
          reactionType: message.data.reactionBody.type,
          targetHash: message.data.reactionBody.targetCastId?.hash,
          targetFid: message.data.reactionBody.targetCastId?.fid,
          targetUrl: message.data.reactionBody.targetUrl,
        }))
      )
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects, e.g. sending push
        // notifications to user whose cast was liked, etc.
      }
    }
  }

  private async onReactionRemove(messages: ReactionRemoveMessage[]) {
    for (const message of messages) {
      await this.db
        .updateTable('reactions')
        .where('fid', '=', message.data.fid)
        .where((eb) => {
          // Search based on the type of reaction
          if (message.data.reactionBody.targetUrl) {
            return eb.where('targetUrl', '=', message.data.reactionBody.targetUrl);
          } else if (message.data.reactionBody.targetCastId) {
            return eb
              .where('targetFid', '=', message.data.reactionBody.targetCastId.fid)
              .where('targetHash', '=', message.data.reactionBody.targetCastId.hash);
          } else {
            throw new Error('Reaction had neither targetUrl nor targetCastId');
          }
        })
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
        .execute();

      // TODO: Execute any cleanup side effects to remove the cast
    }
  }

  private async onVerificationAddEthAddress(
    messages: VerificationAddEthAddressMessage[],
    isInitialCreation: Record<string, boolean>
  ) {
    await this.db
      .insertInto('verifications')
      .values(
        messages.map((message) => ({
          fid: message.data.fid,
          timestamp: farcasterTimeToDate(message.data.timestamp),
          hash: message.hash,
          claim: {
            address: bytesToHex(message.data.verificationAddEthAddressBody.address),
            ethSignature: bytesToHex(message.data.verificationAddEthAddressBody.ethSignature),
            blockHash: bytesToHex(message.data.verificationAddEthAddressBody.blockHash),
          },
        }))
      )
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects
      }

      // TODO: Execute any side effects that should happen any time the user
      // connects the wallet (even if they are reconnecting a previously
      // disconnected wallet), e.g. fetching token balances and NFTs for their
      // wallet address.
    }
  }

  private async onVerificationRemove(messages: VerificationRemoveMessage[]) {
    for (const message of messages) {
      await this.db
        .updateTable('verifications')
        .where('fid', '=', message.data.fid)
        .where(sql`claim ->> 'address'`, '=', bytesToHex(message.data.verificationRemoveBody.address))
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
        .execute();

      // TODO: Execute any cleanup side effects, e.g. updating NFT ownership
    }
  }

  private async onSignerAdd(messages: SignerAddMessage[], isInitialCreation: Record<string, boolean>) {
    await this.db
      .insertInto('signers')
      .values(
        messages.map((message) => {
          const signerName = message.data.signerAddBody.name;
          return {
            fid: message.data.fid,
            timestamp: farcasterTimeToDate(message.data.timestamp),
            hash: message.hash,
            custodyAddress: message.signer,
            signer: message.data.signerAddBody.signer,
            name: signerName?.length ? signerName : null, // Treat empty string signer names as not specified
          };
        })
      )
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects
      }
    }
  }

  private async onSignerRemove(messages: SignerRemoveMessage[]) {
    for (const message of messages) {
      await this.db
        .updateTable('signers')
        .where('fid', '=', message.data.fid)
        .where('signer', '=', message.data.signerRemoveBody.signer)
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
        .execute();

      // TODO: Execute any cleanup side effects
    }
  }

  private async onUserDataAdd(messages: UserDataAddMessage[], isInitialCreation: Record<string, boolean>) {
    const now = new Date();

    await this.db
      .insertInto('userData')
      .values(
        messages.map((message) => ({
          timestamp: farcasterTimeToDate(message.data.timestamp),
          fid: message.data.fid,
          hash: message.hash,
          type: message.data.userDataBody.type,
          value: message.data.userDataBody.value,
        }))
      )
      .onConflict((oc) =>
        oc
          .columns(['fid', 'type'])
          .doUpdateSet(({ ref }) => ({
            hash: ref('excluded.hash'),
            timestamp: ref('excluded.timestamp'),
            value: ref('excluded.value'),
            updatedAt: now,
          }))
          .where(({ or, cmpr, ref }) =>
            // Only update if a value has actually changed
            or([
              cmpr('excluded.hash', '!=', ref('userData.hash')),
              cmpr('excluded.timestamp', '!=', ref('userData.timestamp')),
              cmpr('excluded.value', '!=', ref('userData.value')),
              cmpr('excluded.updatedAt', '!=', ref('userData.updatedAt')),
            ])
          )
      )
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects
      }
    }
  }

  private async onLinkAdd(messages: LinkAddMessage[], isInitialCreation: Record<string, boolean>) {
    await this.db
      .insertInto('links')
      .values(
        messages.map((message) => ({
          timestamp: farcasterTimeToDate(message.data.timestamp),
          // type assertion due to a problem with the type definitions. This field is infact required and present in all valid messages
          targetFid: message.data.linkBody.targetFid!,
          type: message.data.linkBody.type,
          fid: message.data.fid,
          displayTimestamp: farcasterTimeToDate(message.data.linkBody.displayTimestamp),
        }))
      )
      .execute();

    for (const message of messages) {
      if (isInitialCreation[bytesToHex(message.hash)]) {
        // TODO: Execute any one-time side effects
      }
    }
  }

  private async onLinkRemove(messages: LinkRemoveMessage[]) {
    for (const message of messages) {
      await this.db
        .updateTable('links')
        .where('fid', '=', message.data.fid)
        // type assertion due to a problem with the type definitions. This field is infact required and present in all valid messages
        .where('targetFid', '=', message.data.linkBody.targetFid!)
        .where('type', '=', message.data.linkBody.type)
        .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
        .execute();

      // TODO: Execute any cleanup side effects to remove the cast
    }
  }
}
