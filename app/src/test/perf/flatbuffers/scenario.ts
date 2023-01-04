import { MessageData } from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import ProgressBar from 'progress';
import MessageModel from '~/flatbuffers/models/messageModel';
import { AmpAddModel, CastAddModel } from '~/flatbuffers/models/types';
import HubRpcClient from '~/rpc/client';
import { MockFCEvent } from '~/storage/engine/mock';
import { UserInfo } from '~/test/perf/flatbuffers/setup';
import { logger } from '~/utils/logger';

/** Describes a list of tasks */
export interface Scenario {
  tasks: Task[];
  name: string;
  config: ScenarioConfig;
}

/** Describes a list of messages that must be sent to a Hub via an RPCClient */
interface Task {
  // TODO add Hub metadata to tasks
  rpcClient: HubRpcClient;
  messages: MessageModel[];
}

// TODO refactor engine.mock to use this utility
//** Describes the messages to add to a scenario */
export type ScenarioConfig = {
  // Number of Add messages for each Message type (Cast, Reaction, Amp, etc)
  Adds: number;
  // Number of Adds to remove for each Message type
  Removes: number;
  // Number of new Removes (without Adds) for each Message type
  RemovesWithoutAdds: number;
};

/** creates a Basic scennario with the specified configuration */
export const makeBasicScenario = async (
  rpcClient: HubRpcClient,
  userInfos: UserInfo[],
  config: ScenarioConfig = {
    Adds: 10,
    Removes: 2,
    RemovesWithoutAdds: 1,
  }
): Promise<Scenario> => {
  let messages: MessageModel[] = [];
  const casts = await makeMessages(userInfos, config, MockFCEvent.Cast);
  messages = messages.concat(casts);
  const amps = await makeMessages(userInfos, config, MockFCEvent.Amp);
  messages = messages.concat(amps);
  const reactions = await makeMessages(userInfos, config, MockFCEvent.Reaction);
  messages = messages.concat(reactions);
  // Todo verify verifications speed
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
  const progress = new ProgressBar(
    // safe to disable here since `event` is validated above
    // eslint-disable-next-line security/detect-object-injection
    `    Generating ${total} ${MockFCEvent[event]}s [:bar] :elapseds :rate msgs/s :percent :etas`,
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    }
  );

  const messages: MessageModel[] = [];
  for (const userInfo of userInfos) {
    // const removeReference: number[][] = [];
    const createOptions = { transient: { signer: userInfo.signer } };

    for (let i = 0; i < config.Adds; i++) {
      let add;
      let messageData: MessageData;
      // let reference: number[];
      switch (event) {
        case MockFCEvent.Cast:
          messageData = await Factories.CastAddData.create({
            fid: Array.from(userInfo.fid),
          });
          add = new MessageModel(
            await Factories.Message.create({ data: Array.from(messageData.bb?.bytes() ?? []) }, createOptions)
          ) as CastAddModel;
          // reference = Array.from(add.tsHash());
          break;
        case MockFCEvent.Amp:
          messageData = await Factories.AmpAddData.create({
            fid: Array.from(userInfo.fid),
          });
          add = new MessageModel(
            await Factories.Message.create({ data: Array.from(messageData.bb?.bytes() ?? []) }, createOptions)
          ) as AmpAddModel;

          // reference = add.data.body(add.data.bodyType()).user?.fid ?? [];
          break;
        case MockFCEvent.Reaction:
          messageData = await Factories.ReactionAddData.create({
            fid: Array.from(userInfo.fid),
          });
          add = new MessageModel(
            await Factories.Message.create({ data: Array.from(messageData.bb?.bytes() ?? []) }, createOptions)
          ) as AmpAddModel;

          // reference = add.data.body(add.data.bodyType()).cast?.tsHash ?? [];
          break;
        case MockFCEvent.Verification:
          messageData = await Factories.VerificationAddEthAddressData.create({
            fid: Array.from(userInfo.fid),
          });
          add = new MessageModel(
            await Factories.Message.create({ data: Array.from(messageData.bb?.bytes() ?? []) }, createOptions)
          ) as AmpAddModel;

          // reference = add.data.body(add.data.bodyType()).address;
          break;
        default:
          throw Error('Unknown message type');
      }
      // if (removeReference.length < config.Removes) {
      //   // collect target hashes
      //   removeReference.push(reference);
      // }
      progress.tick();
      messages.push(add);
    }
    // for (let i = 0; i < config.Removes; i++) {
    // related removes
    // const reference = removeReference.pop();
    // if (!reference) throw Error('No more target hashes to remove');
    //TODO support removes
    // let remove;
    // switch (event) {
    //   case MockFCEvent.Cast:
    //     remove = await Factories.CastRemove.create(
    //       { ...createParams, data: { body: { targetHash: reference } } },
    //       createOptions
    //     );
    //     break;
    //   case MockFCEvent.Amp:
    //     remove = await Factories.AmpRemove.create(
    //       { ...createParams, data: { body: { targetUri: reference } } },
    //       createOptions
    //     );
    //     break;
    //   case MockFCEvent.Reaction:
    //     remove = await Factories.ReactionRemove.create(
    //       { ...createParams, data: { body: { targetUri: reference } } },
    //       createOptions
    //     );
    //     break;
    //   case MockFCEvent.Verification:
    //     remove = await Factories.VerificationRemove.create(
    //       { ...createParams, data: { signedAt: Date.now(), body: { claimHash: reference } } },
    //       createOptions
    //     );
    //     break;
    //   default:
    //     throw Error('Unknown message type');
    // }
    // progress.tick();
    // messages.push(remove);
    // }
    // for (let i = 0; i < config.RemovesWithoutAdds; i++) {
    // TODO support unrelated removes
    // switch (event) {
    //   case MockFCEvent.Cast:
    //     messages.push(await Factories.CastRemove.create(createParams, createOptions));
    //     break;
    //   case MockFCEvent.Amp:
    //     messages.push(await Factories.AmpRemove.create(createParams, createOptions));
    //     break;
    //   case MockFCEvent.Reaction:
    //     messages.push(await Factories.ReactionRemove.create(createParams, createOptions));
    //     break;
    //   case MockFCEvent.Verification:
    //     messages.push(await Factories.VerificationRemove.create(createParams, createOptions));
    //     break;
    //   default:
    //     throw Error('Unknown message type');
    // }
    // progress.tick();
    // }
  }

  return messages;
};
