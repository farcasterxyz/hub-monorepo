import { TypedEmitter } from 'tiny-typed-emitter';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import MessageModel from '~/storage/flatbuffers/messageModel';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';

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
