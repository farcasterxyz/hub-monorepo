import { Eip712Signer, Factories } from '@farcaster/hub-nodejs';
import Engine from '~/storage/engine';

/** Util to seed engine with all the data needed to make a signer valid for an fid */
export const seedSigner = async (
  engine: Engine,
  fid: number,
  signer: Uint8Array,
  ethSigner?: Eip712Signer
): Promise<Eip712Signer> => {
  if (!ethSigner) {
    ethSigner = Factories.Eip712Signer.build();
    const ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();

    /** Generate and merge ID Registry event linking the fid to the eth wallet */
    const idRegistryEvent = Factories.IdRegistryEvent.build({
      fid,
      to: ethSignerKey,
    });

    const r = await engine.mergeIdRegistryEvent(idRegistryEvent);
    expect(r.isOk()).toBeTruthy();
  }

  /** Generate and merge SignerAdd linking the signer to the fid and signed by the eth wallet */
  const signerAdd = await Factories.SignerAddMessage.create(
    {
      data: { fid, signerAddBody: { signer } },
    },
    { transient: { signer: ethSigner } }
  );

  const r = await engine.mergeMessage(signerAdd);
  expect(r.isOk()).toBeTruthy();

  return ethSigner;
};
