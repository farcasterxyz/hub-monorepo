import { Eip712Signer, Factories } from "@farcaster/hub-nodejs";
import Engine from "../engine/index.js";
import { Ok } from "neverthrow";

/** Util to seed engine with all the data needed to make a signer valid for an fid */
export const seedSigner = async (
  engine: Engine,
  fid: number,
  signer: Uint8Array,
  ethSigner?: Eip712Signer,
): Promise<Eip712Signer> => {
  if (!ethSigner) {
    // biome-ignore lint/style/noParameterAssign: legacy code, avoid using ignore for new code
    ethSigner = Factories.Eip712Signer.build();
    const ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();

    /** Generate and merge ID Registry event linking the fid to the eth wallet */
    const custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: ethSignerKey } });
    await expect(engine.mergeOnChainEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
  }

  /** Generate and merge Signer and storage events linking the signer to the fid and allocating storage for messages */

  const signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signer } });
  const storageEvent = Factories.StorageRentOnChainEvent.build({ fid }, { transient: { units: 1 } });
  await expect(engine.mergeOnChainEvent(signerEvent)).resolves.toBeInstanceOf(Ok);
  await expect(engine.mergeOnChainEvent(storageEvent)).resolves.toBeInstanceOf(Ok);

  return ethSigner;
};
