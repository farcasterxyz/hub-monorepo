import * as flatbuffers from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import { Factory } from 'fishery';
import { Builder, ByteBuffer } from 'flatbuffers';

const RevokeSignerJobPayloadFactory = Factory.define<
  flatbuffers.RevokeSignerJobPayloadT,
  any,
  flatbuffers.RevokeSignerJobPayload
>(({ onCreate }) => {
  onCreate((params) => {
    const builder = new Builder(1);
    builder.finish(params.pack(builder));
    return flatbuffers.RevokeSignerJobPayload.getRootAsRevokeSignerJobPayload(new ByteBuffer(builder.asUint8Array()));
  });

  return new flatbuffers.RevokeSignerJobPayloadT(
    Array.from(Factories.FID.build()),
    Array.from(Factories.Ed25519PrivateKey.build())
  );
});

export const JobFactories = {
  RevokeSignerJobPayload: RevokeSignerJobPayloadFactory,
};
