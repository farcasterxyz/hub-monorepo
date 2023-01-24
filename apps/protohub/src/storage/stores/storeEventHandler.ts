import { Message } from '@farcaster/protobufs';
import { TypedEmitter } from 'tiny-typed-emitter';

export type StoreEvents = {
  /**
   * mergeMessage is emitted when a message is merged into one of the stores. If
   * messages are deleted as part of the merge transaction (i.e. due to conflicts between
   * messages), they are emitted as part of the deletedMessages argument.
   */
  mergeMessage: (message: Message, deletedMessages?: Message[]) => void;

  /**
   * pruneMessage is emitted when a message is pruned from a store due to size
   * or time-based limits.
   */
  pruneMessage: (message: Message) => void;

  /**
   * revokeMessage is emitted when a message is deleted because its signer has been
   * removed. Signers are removed when SignerRemove messages are merged or an fid changes
   * custody address.
   */
  revokeMessage: (message: Message) => void;

  /**
   * mergeIdRegistryEvent is emitted when an event from the ID Registry contract is
   * merged into the SignerStore.
   */
  // TODO
  // mergeIdRegistryEvent: (event: IdRegistryEventModel) => void;

  /**
   * mergeNameRegistryEvent is emitted when an event from the Name Registry contract
   * is merged into the UserDataStore.
   */
  // TODO
  // mergeNameRegistryEvent: (event: NameRegistryEventModel) => void;
};

class StoreEventHandler extends TypedEmitter<StoreEvents> {
  constructor() {
    super();
  }
}

export default StoreEventHandler;
