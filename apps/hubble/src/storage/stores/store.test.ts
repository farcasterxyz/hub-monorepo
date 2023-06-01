import { CastAddMessage, CastRemoveMessage, NobleEd25519Signer, makeCastAdd } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';
import { Store } from './store.js';
import { MessageType, HubAsyncResult } from '@farcaster/hub-nodejs';
import { UserMessagePostfix, UserPostfix } from 'storage/db/types.js';

// beforeEach(() => {
// });

class TestStore extends Store<CastAddMessage, CastRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.CastMessage;
  override _addType: CastAddMessage;
  override _removeType: any;
  override _addMessageType: MessageType;
  override _removeMessageType: MessageType | undefined;
  override validateAdd(_add: CastAddMessage): HubAsyncResult<void> {
    throw new Error('Method not implemented.');
  }
  override validateRemove(_remove: CastRemoveMessage): HubAsyncResult<void> {
    throw new Error('Method not implemented.');
  }
  override buildSecondaryIndices(_add: CastAddMessage): HubAsyncResult<void> {
    throw new Error('Method not implemented.');
  }
  override deleteSecondaryIndices(_add: CastAddMessage): HubAsyncResult<void> {
    throw new Error('Method not implemented.');
  }
}

describe('store', () => {
  test('creates keys following declared order', async () => {
    const privKey = ed.utils.randomPrivateKey();
    const ed25519Signer = new NobleEd25519Signer(privKey);
    const castAdd = await makeCastAdd(
      {
        text: '',
        embeds: [],
        embedsDeprecated: [],
        mentions: [],
        mentionsPositions: [],
      },
      { fid: 1, network: 2 },
      ed25519Signer
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await new TestStore(null!, null!, {
      pruneSizeLimit: 100,
      pruneTimeLimit: 100,
    }).getAdd(castAdd._unsafeUnwrap());
  });
});
