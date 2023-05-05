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

type StoreMessageOperation = 'merge' | 'delete' | 'prune' | 'revoke';

export class HubReplicator {
  private client: HubRpcClient;
  private subscriber: HubSubscriber;

  constructor(private hubAddress: string, private ssl: boolean, private db: Kysely<Database>, private log: Logger) {
    this.client = this.ssl ? getSSLHubRpcClient(hubAddress) : getInsecureHubRpcClient(hubAddress);
    this.subscriber = new HubSubscriber(this.client, log);

    this.subscriber.on('event', async (hubEvent) => {
      if (isMergeMessageHubEvent(hubEvent)) {
        await this.onMergeMessage(hubEvent.mergeMessageBody.message);

        for (const deletedMessage of hubEvent.mergeMessageBody.deletedMessages) {
          await this.storeMessage(deletedMessage, 'delete');
        }
      } else if (isPruneMessageHubEvent(hubEvent)) {
        await this.onPruneMessage(hubEvent.pruneMessageBody.message);
      } else if (isRevokeMessageHubEvent(hubEvent)) {
        await this.onRevokeMessage(hubEvent.revokeMessageBody.message);
      } else if (isMergeIdRegistryEventHubEvent(hubEvent)) {
        await this.onIdRegistryEvent(hubEvent.mergeIdRegistryEventBody.idRegistryEvent);
      } else if (isMergeNameRegistryEventHubEvent(hubEvent)) {
        await this.onNameRegistryEvent(hubEvent.mergeNameRegistryEventBody.nameRegistryEvent);
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
    const infoResult = await this.client.getInfo({ syncStats: true });

    if (infoResult.isErr() || infoResult.value.syncStats === undefined) {
      throw new Error(`Unable to get information about hub ${this.hubAddress}`);
    }

    const { numMessages } = infoResult.value.syncStats;

    this.log.info(`Syncing ${numMessages} messages from ${this.hubAddress}`);

    // Start backfilling all historical data in the background
    this.backfill();

    // Process live events going forward, starting from the last event we
    // processed (if there was one).
    const subscription = await this.db
      .selectFrom('hubSubscriptions')
      .where('host', '=', this.hubAddress)
      .select('lastEventId')
      .executeTakeFirst();
    this.subscriber.start(subscription?.lastEventId);
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

    for (let fid = 1; fid <= maxFid; fid++) {
      this.log.info(`Starting backfill for FID ${fid}`);
      await this.processAllMessagesForFid(fid);
      this.log.info(`Completed backfill for FID ${fid}`);
    }
  }

  private async processAllMessagesForFid(fid: number) {
    await this.client
      .getIdRegistryEvent({ fid })
      .then((result) => result.map((event) => this.onIdRegistryEvent(event)));

    await this.client
      .getCastsByFid({ fid })
      .then((result) => result.map((response) => response.messages.map((message) => this.onMergeMessage(message))));

    await this.client
      .getReactionsByFid({ fid })
      .then((result) => result.map((response) => response.messages.map((message) => this.onMergeMessage(message))));

    await this.client
      .getSignersByFid({ fid })
      .then((result) => result.map((response) => response.messages.map((message) => this.onMergeMessage(message))));

    await this.client
      .getVerificationsByFid({ fid })
      .then((result) => result.map((response) => response.messages.map((message) => this.onMergeMessage(message))));

    await this.client
      .getUserDataByFid({ fid })
      .then((result) => result.map((response) => response.messages.map((message) => this.onMergeMessage(message))));
  }

  private async storeMessage(message: Message, operation: StoreMessageOperation) {
    if (!message.data) {
      throw new Error('Message data is missing');
    }

    const now = new Date();

    const messageRow = await this.db
      .insertInto('messages')
      .values({
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
      })
      .onConflict((oc) =>
        oc
          .columns(['hash'])
          .doUpdateSet({
            updatedAt: now,
            // Only the signer or message state could have changed
            signature: message.signature,
            signatureScheme: message.signatureScheme,
            signer: message.signer,
            deletedAt: operation === 'delete' ? now : null,
            prunedAt: operation === 'prune' ? now : null,
            revokedAt: operation === 'revoke' ? now : null,
          })
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
      .returning(['updatedAt', 'createdAt'])
      .executeTakeFirst();

    // Return boolean indicating whether this is a new message
    return !!(messageRow && messageRow.updatedAt === messageRow.createdAt);
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

  private async onMergeMessage(message: Message) {
    this.log.debug(`Merging message ${bytesToHex(message.hash)} (type ${message.data?.type})`);

    const isInitialCreation = await this.storeMessage(message, 'merge');

    if (isCastAddMessage(message)) {
      await this.onCastAdd(message, isInitialCreation);
    } else if (isCastRemoveMessage(message)) {
      await this.onCastRemove(message);
    } else if (isReactionAddMessage(message)) {
      await this.onReactionAdd(message, isInitialCreation);
    } else if (isReactionRemoveMessage(message)) {
      await this.onReactionRemove(message);
    } else if (isVerificationAddEthAddressMessage(message)) {
      await this.onVerificationAddEthAddress(message, isInitialCreation);
    } else if (isVerificationRemoveMessage(message)) {
      await this.onVerificationRemove(message);
    } else if (isSignerAddMessage(message)) {
      await this.onSignerAdd(message, isInitialCreation);
    } else if (isSignerRemoveMessage(message)) {
      await this.onSignerRemove(message);
    } else if (isUserDataAddMessage(message)) {
      await this.onUserDataAdd(message, isInitialCreation);
    } else {
      this.log.warn(`Ignoring unknown message type ${message.data?.type}`);
    }
  }

  private async onPruneMessage(message: Message) {
    this.log.debug(`Pruning message ${bytesToHex(message.hash)} (type ${message.data?.type})`);
    this.storeMessage(message, 'prune');
  }

  private async onRevokeMessage(message: Message) {
    this.log.debug(`Revoking message ${bytesToHex(message.hash)} (type ${message.data?.type})`);
    this.storeMessage(message, 'revoke');
  }

  private async onCastAdd(message: CastAddMessage, isInitialCreation: boolean) {
    await this.db
      .insertInto('casts')
      .values({
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
      })
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    if (isInitialCreation) {
      // TODO: Execute any one-time side effects, e.g. sending push
      // notifications to user whose cast was replied to, etc.
    }
  }

  private async onCastRemove(message: CastRemoveMessage) {
    await this.db
      .updateTable('casts')
      .where('fid', '=', message.data.fid)
      .where('hash', '=', message.data.castRemoveBody.targetHash)
      .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
      .execute();

    // TODO: Execute any cleanup side effects to remove the cast
  }

  private async onReactionAdd(message: ReactionAddMessage, isInitialCreation: boolean) {
    await this.db
      .insertInto('reactions')
      .values({
        fid: message.data.fid,
        timestamp: farcasterTimeToDate(message.data.timestamp),
        hash: message.hash,
        reactionType: message.data.reactionBody.type,
        targetHash: message.data.reactionBody.targetCastId?.hash,
        targetFid: message.data.reactionBody.targetCastId?.fid,
        targetUrl: message.data.reactionBody.targetUrl,
      })
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    if (isInitialCreation) {
      // TODO: Execute any one-time side effects, e.g. sending push
      // notifications to user whose cast was liked, etc.
    }
  }

  private async onReactionRemove(message: ReactionRemoveMessage) {
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

  private async onVerificationAddEthAddress(message: VerificationAddEthAddressMessage, isInitialCreation: boolean) {
    await this.db
      .insertInto('verifications')
      .values({
        fid: message.data.fid,
        timestamp: farcasterTimeToDate(message.data.timestamp),
        hash: message.hash,
        claim: {
          address: bytesToHex(message.data.verificationAddEthAddressBody.address),
          ethSignature: bytesToHex(message.data.verificationAddEthAddressBody.ethSignature),
          blockHash: bytesToHex(message.data.verificationAddEthAddressBody.blockHash),
        },
      })
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    if (isInitialCreation) {
      // TODO: Execute any one-time side effects
    }

    // TODO: Execute any side effects that should happen any time the user
    // connects the wallet (even if they are reconnecting a previously
    // disconnected wallet), e.g. fetching token balances and NFTs for their
    // wallet address.
  }

  private async onVerificationRemove(message: VerificationRemoveMessage) {
    await this.db
      .updateTable('verifications')
      .where('fid', '=', message.data.fid)
      .where(sql`claim ->> 'address'`, '=', bytesToHex(message.data.verificationRemoveBody.address))
      .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
      .execute();

    // TODO: Execute any cleanup side effects, e.g. updating NFT ownership
  }

  private async onSignerAdd(message: SignerAddMessage, isInitialCreation: boolean) {
    const signerName = message.data.signerAddBody.name;

    await this.db
      .insertInto('signers')
      .values({
        fid: message.data.fid,
        timestamp: farcasterTimeToDate(message.data.timestamp),
        hash: message.hash,
        custodyAddress: message.signer,
        signer: message.data.signerAddBody.signer,
        name: signerName?.length ? signerName : null, // Treat empty string signer names as not specified
      })
      // Do nothing on conflict since nothing should have changed if hash is the same.
      .onConflict((oc) => oc.columns(['hash']).doNothing())
      .execute();

    if (isInitialCreation) {
      // TODO: Execute any one-time side effects
    }
  }

  private async onSignerRemove(message: SignerRemoveMessage) {
    await this.db
      .updateTable('signers')
      .where('fid', '=', message.data.fid)
      .where('signer', '=', message.data.signerRemoveBody.signer)
      .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) })
      .execute();

    // TODO: Execute any cleanup side effects
  }

  private async onUserDataAdd(message: UserDataAddMessage, isInitialCreation: boolean) {
    await this.db
      .insertInto('userData')
      .values({
        timestamp: farcasterTimeToDate(message.data.timestamp),
        fid: message.data.fid,
        hash: message.hash,
        type: message.data.userDataBody.type,
        value: message.data.userDataBody.value,
      })
      .onConflict((oc) =>
        oc
          .columns(['fid', 'type'])
          .doUpdateSet({
            hash: message.hash,
            timestamp: farcasterTimeToDate(message.data.timestamp),
            value: message.data.userDataBody.value,
            updatedAt: new Date(),
          })
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

    if (isInitialCreation) {
      // TODO: Execute any one-time side effects
    }
  }
}
