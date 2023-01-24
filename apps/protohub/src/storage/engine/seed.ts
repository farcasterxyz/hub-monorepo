/** Util to seed engine with all the data needed to make a signer valid for an fid */
// export const seedSigner = async (engine: Engine, fid: Uint8Array, signer: Uint8Array) => {
//   const ethSigner = Factories.Eip712Signer.build();

//   /** Generate and merge ID Registry event linking the fid to the eth wallet */
//   const idRegistryEvent = new IdRegistryEventModel(
//     await Factories.IdRegistryEvent.create({
//       fid: Array.from(fid),
//       to: Array.from(ethSigner.signerKey),
//     })
//   );

//   await engine.mergeIdRegistryEvent(idRegistryEvent);

//   /** Generate and merge SignerAdd linking the signer to the fid and signed by the eth wallet */
//   const signerAddData = await Factories.SignerAddData.create({
//     fid: Array.from(fid),
//     body: Factories.SignerBody.build({ signer: Array.from(signer) }),
//   });
//   const signerAdd = new MessageModel(
//     await Factories.Message.create(
//       { data: Array.from(signerAddData.bb?.bytes() ?? new Uint8Array()) },
//       { transient: { ethSigner } }
//     )
//   ) as SignerAddModel;

//   await engine.mergeMessage(signerAdd);
// };
