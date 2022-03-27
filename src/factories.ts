import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import { CastNew, CastDeleteMessageBody, Root, SignedMessage, CastRecast, CastDelete } from '~/types';
import { hashMessage, hashFCObject, hashString, sign } from '~/utils';

/**
 * ProtocolFactories are used to construct valid Farcaster Protocol JSON objects.
 */
export const Factories = {
  /** Generate a valid Cast with randomized properties */
  Cast: Factory.define<CastNew, any, CastNew>(({ onCreate, transientParams }) => {
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

    const text = Faker.lorem.sentence(2);
    const attachments = { items: [] };

    return {
      message: {
        body: {
          _attachments: attachments,
          _text: text,
          attachmentsHash: hashFCObject(attachments),
          schema: 'farcaster.xyz/schemas/v1/cast-new' as const,
          textHash: hashString(text),
        },
        index: Faker.datatype.number(),
        prevHash: Faker.datatype.hexaDecimal(64),
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
          targetCastUri: 'farcaster://alice/cast/1', // TODO: Find some way to generate this.
          schema: 'farcaster.xyz/schemas/v1/cast-delete' as const,
        },
        index: Faker.datatype.number(),
        prevHash: Faker.datatype.hexaDecimal(64),
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
          targetCastUri: 'farcaster://alice/cast/1', // TODO: Find some way to generate this.
          schema: 'farcaster.xyz/schemas/v1/cast-recast' as const,
        },
        index: Faker.datatype.number(),
        prevHash: Faker.datatype.hexaDecimal(64),
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
          blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          chainType: 'cast' as const,
          prevRootBlockHash: '0x0',
          prevRootLastHash: '0x0',
          schema: 'farcaster.xyz/schemas/v1/root' as const,
        },
        index: 0,
        prevHash: '0x0',
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
};

interface EthAddress {
  address: string;
  privateKey: string;
}
