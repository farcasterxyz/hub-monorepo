import { TypedEmitter } from 'tiny-typed-emitter';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import MessageModel from '~/storage/flatbuffers/messageModel';

export type StoreEvents = {
  mergeMessage: (message: MessageModel) => void;
  pruneMessage: (message: MessageModel) => void;
  revokeMessage: (message: MessageModel) => void;
  mergeContractEvent: (event: ContractEventModel) => void;
};

class StoreEventHandler extends TypedEmitter<StoreEvents> {
  constructor() {
    super();
  }
}

export default StoreEventHandler;
