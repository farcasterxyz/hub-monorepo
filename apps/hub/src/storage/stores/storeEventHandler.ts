import { TypedEmitter } from 'tiny-typed-emitter';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';

export type StoreEvents = {
  mergeMessage: (message: MessageModel) => void;
  pruneMessage: (message: MessageModel) => void;
  revokeMessage: (message: MessageModel) => void;
  mergeIdRegistryEvent: (event: IdRegistryEventModel) => void;
  mergeNameRegistryEvent: (event: NameRegistryEventModel) => void;
};

class StoreEventHandler extends TypedEmitter<StoreEvents> {
  constructor() {
    super();
  }
}

export default StoreEventHandler;
