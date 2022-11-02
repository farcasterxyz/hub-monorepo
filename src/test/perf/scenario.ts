import { MockFCEvent, UserInfo } from '~/storage/engine/mock';
import { Message } from '~/types';
import { Factories } from '~/test/factories';
import { RPCClient } from '~/network/rpc';
import { logger } from '~/utils/logger';
import ProgressBar from 'progress';

/** Describes a list of tasks */
export interface Scenario {
  tasks: Task[];
  name: string;
  config: ScenarioConfig;
}

/** Describes a list of messages that must be sent to a Hub via an RPCClient */
interface Task {
  // TODO add Hub metadata to tasks
  rpcClient: RPCClient;
  messages: Message[];
}

// TODO refactor engine.mock to use this utility
//** Describes the messages to add to a scenario */
export type ScenarioConfig = {
  // Number of Add messages for each Message type (Cast, Reaction, Follow, etc)
  Adds: number;
  // Number of Adds to remove for each Message type
  Removes: number;
  // Number of new Removes (without Adds) for each Message type
  RemovesWithoutAdds: number;
};

/** creates a Basic scennario with the specified configuration */
export const makeBasicScenario = async (
  rpcClient: RPCClient,
  userInfos: UserInfo[],
  config: ScenarioConfig = {
    Adds: 10,
    Removes: 2,
    RemovesWithoutAdds: 1,
  }
): Promise<Scenario> => {
  let messages: Message[] = [];
  const casts = await makeMessages(userInfos, config, MockFCEvent.Cast);
  messages = messages.concat(casts);
  const follows = await makeMessages(userInfos, config, MockFCEvent.Follow);
  messages = messages.concat(follows);
  const reactions = await makeMessages(userInfos, config, MockFCEvent.Reaction);
  messages = messages.concat(reactions);
  // Only make 1% as many verification requests since they're very slow
  const verifications = await makeMessages(
    userInfos,
    {
      Adds: Math.ceil(config.Adds * 0.01),
      Removes: Math.ceil(config.Removes * 0.01),
      RemovesWithoutAdds: Math.ceil(config.RemovesWithoutAdds * 0.01),
    },
    MockFCEvent.Verification
  );
  messages = messages.concat(verifications);
  logger.info(`Created ${messages.length} messages for Basic scenario`);

  const task = {
    rpcClient,
    messages,
  };
  return {
    name: 'Basic Scenario',
    tasks: [task],
    config,
  };
};

const makeMessages = async (userInfos: UserInfo[], config: ScenarioConfig, event: MockFCEvent) => {
  if (event > MockFCEvent.Verification) throw 'Invalid event type for messages';

  const total = userInfos.length * (config.Adds + config.Removes + config.RemovesWithoutAdds);
  // safe to disable here since `event` is validated above
  // eslint-disable-next-line security/detect-object-injection
  const progress = new ProgressBar(
    `Generating ${total} ${MockFCEvent[event]}s [:bar] :elapseds :ratemsgs/s :percent :etas`,
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    }
  );

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
          // creating these at an offset time
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
      progress.tick();
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
      progress.tick();
      messages.push(remove);
    }
    for (let i = 0; i < config.RemovesWithoutAdds; i++) {
      // unrelated removes
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
      progress.tick();
    }
  }

  return messages;
};
