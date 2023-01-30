import { Factories } from '@farcaster/utils';
import Engine from '~/storage/engine';

/** Util to seed engine with all the data needed to make a signer valid for an fid */
export const seedSigner = async (engine: Engine, fid: number, signer: Uint8Array) => {
  const ethSigner = Factories.Eip712Signer.build();

  /** Generate and merge ID Registry event linking the fid to the eth wallet */
  const idRegistryEvent = Factories.IdRegistryEvent.build({
    fid,
    to: ethSigner.signerKey,
  });

  await engine.mergeIdRegistryEvent(idRegistryEvent);

  /** Generate and merge SignerAdd linking the signer to the fid and signed by the eth wallet */
  const signerAdd = await Factories.SignerAddMessage.create(
    {
      data: { fid, signerBody: { signer } },
    },
    { transient: { signer: ethSigner } }
  );

  await engine.mergeMessage(signerAdd);
};
