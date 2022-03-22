import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import { Cast, Root } from '~/types';
import { hashMessage, sign } from '~/utils';

/**
 * ProtocolFactories are used to construct valid Farcaster Protocol JSON objects.
 */
export const Factories = {
  /** Generate a valid Cast with randomized properties */
  Cast: Factory.define<Cast, any, Cast>(({ onCreate, transientParams }) => {
    const { privateKey = Faker.datatype.hexaDecimal(64).toLowerCase() } = transientParams;
    const wallet = new ethers.Wallet(privateKey);

    onCreate(async (castProps) => {
      const hash = hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await wallet.getAddress();

      const signature = sign(castProps.hash, wallet._signingKey());
      castProps.signature = signature;

      return castProps;
    });

    return {
      message: {
        body: {
          type: 'cast-add' as const,
          text: Faker.lorem.sentence(2),
        },
        prevHash: Faker.datatype.hexaDecimal(64),
        rootBlock: Faker.datatype.number(10_000),
        sequence: Faker.datatype.number(),
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      schema: 'farcaster.xyz/schemas/v1/cast',
      signature: '',
      signer: '',
    };
  }),

  /** Generate a valid Cast with randomized properties */
  Root: Factory.define<Root, any, Root>(({ onCreate, transientParams }) => {
    const { privateKey = Faker.datatype.hexaDecimal(64).toLowerCase() } = transientParams;
    const wallet = new ethers.Wallet(privateKey);

    onCreate(async (rootProps) => {
      const hash = hashMessage(rootProps);
      rootProps.hash = hash;

      rootProps.signer = await wallet.getAddress();

      const signature = sign(rootProps.hash, wallet._signingKey());
      rootProps.signature = signature;

      return rootProps;
    });

    return {
      message: {
        body: {
          type: 'root' as const,
          blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          prevRootBlockHash: '0x0',
          prevRootLastHash: '0x0',
        },
        prevHash: '0x0',
        rootBlock: Faker.datatype.number(10_000),
        sequence: 0,
        signedAt: Date.now(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      schema: '',
      signature: '',
      signer: '',
    };
  }),
};
