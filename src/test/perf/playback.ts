import { RPCClient } from '~/network/rpc';
import { Message } from '~/types';
import { logger } from '~/utils/logger';
import { Factories } from '~/test/factories';
import { MockFCEvent, UserInfo } from '~/storage/engine/mock';
import { post, shuffleMessages, submitInBatches } from '~/test/perf/utils';

export enum PlaybackOrder {
  /** Playback messages in order */
  SEQ,
  /** Playback messages in a random order */
  RND,
}

export interface PlaybackConfig {
  /** The order in which the messages should be sent to the Hub */
  order: PlaybackOrder;
}

export const playback = async (client: RPCClient, messages: Message[], config: PlaybackConfig) => {
  logger.info(`Using RPC server: ${client.getServerMultiaddr()} for playback`);

  const start = performance.now();
  let counts;
  switch (config.order) {
    case PlaybackOrder.SEQ:
      counts = await submitInBatches(client, messages);
      break;
    case PlaybackOrder.RND:
      counts = await submitInBatches(client, shuffleMessages(messages));
      break;
    default:
      throw 'Unknown Message Playback Order';
  }
  const stop = performance.now();
  logger.info({ playback: counts, msg: 'Playback completed' });
  post(`Submitted ${messages.length} messages to ${client.getServerMultiaddr()}`, start, stop);
};

// TODO maybe refactor engine.mock to use this utility
export type ScenarioConfig = {
  Adds: number;
  Removes: number;
  RemovesWithoutAdds: number;
};

export const makeBasicScenario = async (
  userInfos: UserInfo[],
  config: ScenarioConfig = {
    Adds: 10,
    Removes: 2,
    RemovesWithoutAdds: 2,
  }
) => {
  let messages: Message[] = [];
  const casts = await makeMessages(userInfos, config, MockFCEvent.Cast);
  messages = messages.concat(casts);
  const follows = await makeMessages(userInfos, config, MockFCEvent.Follow);
  messages = messages.concat(follows);
  const reactions = await makeMessages(userInfos, config, MockFCEvent.Reaction);
  messages = messages.concat(reactions);
  const verifications = await makeMessages(userInfos, config, MockFCEvent.Verification);
  messages = messages.concat(verifications);

  logger.info(`Created ${messages.length} messages for Basic scenario`);
  return messages;
};

const makeMessages = async (userInfos: UserInfo[], config: ScenarioConfig, event: MockFCEvent) => {
  // eslint-disable-next-line security/detect-object-injection
  logger.info(`Generating ${MockFCEvent[event]}s for ${userInfos.length} users`);

  const messages: Message[] = [];
  for (const userInfo of userInfos) {
    const removeReference: string[] = [];
    const createParams = { data: { fid: userInfo.fid } };
    const createOptions = { transient: { signer: userInfo.delegateSigner } };

    for (let i = 0; i < config.Adds; i++) {
      let add;
      let reference;
      switch (event) {
        case MockFCEvent.Cast:
          add = await Factories.CastShort.create(createParams, createOptions);
          reference = add.hash;
          break;
        case MockFCEvent.Follow:
          add = await Factories.FollowAdd.create(createParams, createOptions);
          reference = add.data.body.targetUri;
          break;
        case MockFCEvent.Reaction:
          add = await Factories.ReactionAdd.create(createParams, createOptions);
          reference = add.data.body.targetUri;
          break;
        case MockFCEvent.Verification:
          // creating these a offset time
          add = await Factories.VerificationEthereumAddress.create(
            { ...createParams, data: { signedAt: Date.now() - 1000 } },
            createOptions
          );
          reference = add.data.body.claimHash;
          break;
        default:
          throw Error('Unknown message type');
      }
      if (removeReference.length < config.Removes) {
        // collect target hashes
        removeReference.push(reference);
      }
      messages.push(add);
    }
    for (let i = 0; i < config.Removes; i++) {
      // related removes
      const reference = removeReference.pop();
      if (!reference) throw Error('No more target hashes to remove');

      let remove;
      switch (event) {
        case MockFCEvent.Cast:
          remove = await Factories.CastRemove.create(
            { ...createParams, data: { body: { targetHash: reference } } },
            createOptions
          );
          break;
        case MockFCEvent.Follow:
          remove = await Factories.FollowRemove.create(
            { ...createParams, data: { body: { targetUri: reference } } },
            createOptions
          );
          break;
        case MockFCEvent.Reaction:
          remove = await Factories.ReactionRemove.create(
            { ...createParams, data: { body: { targetUri: reference } } },
            createOptions
          );
          break;
        case MockFCEvent.Verification:
          remove = await Factories.VerificationRemove.create(
            { ...createParams, data: { signedAt: Date.now(), body: { claimHash: reference } } },
            createOptions
          );
          break;
        default:
          throw Error('Unknown message type');
      }
      messages.push(remove);
    }
    for (let i = 0; i < config.RemovesWithoutAdds; i++) {
      // unrelated removes
      messages.push(await Factories.CastRemove.create(createParams, createOptions));

      switch (event) {
        case MockFCEvent.Cast:
          messages.push(await Factories.CastRemove.create(createParams, createOptions));
          break;
        case MockFCEvent.Follow:
          messages.push(await Factories.FollowRemove.create(createParams, createOptions));
          break;
        case MockFCEvent.Reaction:
          messages.push(await Factories.ReactionRemove.create(createParams, createOptions));
          break;
        case MockFCEvent.Verification:
          messages.push(await Factories.VerificationRemove.create(createParams, createOptions));
          break;
        default:
          throw Error('Unknown message type');
      }
    }
  }

  return messages;
};
