import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import { CastShort, Root, CastRecast, CastDelete, Reaction } from '~/types';
import { convertToHex, hashMessage, sign } from '~/utils';
import * as ed from '@noble/ed25519';

/**
 * ProtocolFactories are used to construct valid Farcaster Protocol JSON objects.
 */
export const Factories = {
  /** Generate a valid Cast with randomized properties */
  Cast: Factory.define<CastShort, any, CastShort>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;

    onCreate(async (castProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await convertToHex(publicKey);

      const signature = await sign(castProps.hash, privateKey);
      castProps.signature = signature;

      return castProps;
    });

    const embed = { items: [] };
    const text = Faker.lorem.sentence(2);

    return {
      data: {
        body: {
          embed,
          text,
          schema: 'farcaster.xyz/schemas/v1/cast-short' as const,
        },
        rootBlock: Faker.datatype.number(10_000),
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      signature: '',
      signer: '',
    };
  }),

  /** Generate a valid Cast-Delete with randomized properties */
  CastDelete: Factory.define<CastDelete, any, CastDelete>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;

    onCreate(async (castProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await convertToHex(publicKey);

      const signature = await sign(castProps.hash, privateKey);
      castProps.signature = signature;

      return castProps;
    });

    return {
      data: {
        body: {
          targetHash: Faker.datatype.hexaDecimal(40).toLowerCase(),
          schema: 'farcaster.xyz/schemas/v1/cast-delete' as const,
        },
        rootBlock: Faker.datatype.number(10_000),
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      signature: '',
      signer: '',
    };
  }),

  /** Generate a valid Cast with randomized properties */
  CastRecast: Factory.define<CastRecast, any, CastRecast>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;

    onCreate(async (castProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await convertToHex(publicKey);

      const signature = await sign(castProps.hash, privateKey);
      castProps.signature = signature;

      return castProps;
    });

    return {
      data: {
        body: {
          targetCastUri: 'farcaster://alice/cast/1', // TODO: Find some way to generate this.
          schema: 'farcaster.xyz/schemas/v1/cast-recast' as const,
        },
        rootBlock: Faker.datatype.number(10_000),
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      signature: '',
      signer: '',
    };
  }),

  /** Generate a valid Root with randomized properties */
  Root: Factory.define<Root, any, Root>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;
    onCreate(async (rootProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(rootProps);
      rootProps.hash = hash;

      rootProps.signer = await convertToHex(publicKey);

      const signature = await sign(rootProps.hash, privateKey);
      rootProps.signature = signature;

      return rootProps;
    });

    return {
      data: {
        body: {
          blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          schema: 'farcaster.xyz/schemas/v1/root' as const,
        },
        rootBlock: Faker.datatype.number(10_000),
        signedAt: Date.now(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      signature: '',
      signer: '',
    };
  }),

  /** Generate a new ETH Address with its corresponding private key */
  EthAddress: Factory.define<EthAddress, any, EthAddress>(({ onCreate }) => {
    onCreate(async (addressProps) => {
      const wallet = new ethers.Wallet(addressProps.privateKey);
      addressProps.address = await wallet.getAddress();
      return addressProps;
    });

    const privateKey = Faker.datatype.hexaDecimal(64).toLowerCase();

    return {
      address: '',
      privateKey,
    };
  }),

  /** Generate a valid Reaction with randomized properties */
  Reaction: Factory.define<Reaction, any, Reaction>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;

    onCreate(async (castProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await convertToHex(publicKey);

      const signature = await sign(castProps.hash, privateKey);
      castProps.signature = signature;

      return castProps;
    });

    return {
      data: {
        body: {
          active: true,
          targetUri: Faker.internet.url(),
          type: 'like',
          schema: 'farcaster.xyz/schemas/v1/reaction' as const,
        },
        rootBlock: Faker.datatype.number(10_000),
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      signature: '',
      signer: '',
    };
  }),
};

interface EthAddress {
  address: string;
  privateKey: string;
}
