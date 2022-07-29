import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import {
  CastShort,
  Root,
  CastRecast,
  CastRemove,
  Reaction,
  VerificationAdd,
  VerificationRemove,
  VerificationClaim,
  VerificationRemoveFactoryTransientParams,
  VerificationAddFactoryTransientParams,
  SignerAdd,
  SignerRemove,
  SignerEdge,
  SignerRemoveFactoryTransientParams,
  SignerAddFactoryTransientParams,
  SignatureAlgorithm,
} from '~/types';
import { convertToHex, hashMessage, signEd25519, hashFCObject, generateEd25519Signer } from '~/utils';
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

      const signature = await signEd25519(castProps.hash, privateKey);
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

  /** Generate a valid CastRemove with randomized properties */
  CastRemove: Factory.define<CastRemove, any, CastRemove>(({ onCreate, transientParams }) => {
    const { privateKey = ed.utils.randomPrivateKey() } = transientParams;

    onCreate(async (castProps) => {
      const publicKey = await ed.getPublicKey(privateKey);
      const hash = await hashMessage(castProps);
      castProps.hash = hash;

      castProps.signer = await convertToHex(publicKey);

      const signature = await signEd25519(castProps.hash, privateKey);
      castProps.signature = signature;

      return castProps;
    });

    return {
      data: {
        body: {
          targetHash: Faker.datatype.hexaDecimal(40).toLowerCase(),
          schema: 'farcaster.xyz/schemas/v1/cast-remove',
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

      const signature = await signEd25519(castProps.hash, privateKey);
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

      const signature = await signEd25519(rootProps.hash, privateKey);
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

      const signature = await signEd25519(castProps.hash, privateKey);
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

  /** Generate a valid SignerAdd */
  SignerAdd: Factory.define<SignerAdd, SignerAddFactoryTransientParams, SignerAdd>(({ onCreate, transientParams }) => {
    onCreate(async (props) => {
      const signer = transientParams.signer || (await generateEd25519Signer());
      const childSigner = transientParams.childSigner || (await generateEd25519Signer());
      const parentKey = signer.signerKey;
      const childKey = childSigner.signerKey;

      /** Set childKey if missing */
      if (!props.data.body.childKey) {
        props.data.body.childKey = childKey;
      }

      /** Generate edgeHash if missing */
      if (!props.data.body.edgeHash) {
        const edge: SignerEdge = {
          parentKey: parentKey,
          childKey: props.data.body.childKey,
        };
        props.data.body.edgeHash = await hashFCObject(edge);
      }

      /** Generate childSignature if missing */
      if (!props.data.body.childSignature) {
        props.data.body.childSignature = await signEd25519(props.data.body.edgeHash, childSigner.privateKey);
      }

      props.hash = await hashMessage(props);
      props.signer = parentKey;

      if (signer.type === SignatureAlgorithm.EthereumPersonalSign) {
        props.signature = await signer.wallet.signMessage(props.hash);
      } else if (signer.type === SignatureAlgorithm.Ed25519) {
        props.signature = await signEd25519(props.hash, signer.privateKey);
      }

      return props;
    });

    return {
      data: {
        body: {
          childKey: '',
          edgeHash: '',
          childSignature: '',
          childSignatureType: SignatureAlgorithm.Ed25519,
          schema: 'farcaster.xyz/schemas/v1/signer-add',
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

  /** Generate a valid SignerRemove */
  SignerRemove: Factory.define<SignerRemove, SignerRemoveFactoryTransientParams, SignerRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        const signer = transientParams.signer || (await generateEd25519Signer());
        const parentKey = signer.signerKey;

        props.hash = await hashMessage(props);
        props.signer = parentKey;

        if (signer.type === SignatureAlgorithm.EthereumPersonalSign) {
          props.signature = await signer.wallet.signMessage(props.hash);
        } else if (signer.type === SignatureAlgorithm.Ed25519) {
          props.signature = await signEd25519(props.hash, signer.privateKey);
        }

        return props;
      });

      return {
        data: {
          body: {
            childKey: '',
            schema: 'farcaster.xyz/schemas/v1/signer-remove',
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        signature: '',
        signer: '',
      };
    }
  ),
  /** Generate a VerificationAdd message */
  VerificationAdd: Factory.define<VerificationAdd, VerificationAddFactoryTransientParams, VerificationAdd>(
    ({ onCreate, transientParams }) => {
      const { privateKey = ed.utils.randomPrivateKey(), ethWallet = ethers.Wallet.createRandom() } = transientParams;

      onCreate(async (castProps) => {
        /** Generate claimHash if missing */
        if (!castProps.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: castProps.data.username,
            externalUri: castProps.data.body.externalUri,
          };
          castProps.data.body.claimHash = await hashFCObject(verificationClaim);
        }

        /** Generate externalSignature if missing */
        if (!castProps.data.body.externalSignature) {
          castProps.data.body.externalSignature = await ethWallet.signMessage(castProps.data.body.claimHash);
        }

        /** Complete envelope */
        const publicKey = await ed.getPublicKey(privateKey);
        const hash = await hashMessage(castProps);
        castProps.hash = hash;

        castProps.signer = await convertToHex(publicKey);

        const signature = await signEd25519(castProps.hash, privateKey);
        castProps.signature = signature;

        return castProps;
      });

      return {
        data: {
          body: {
            externalUri: ethWallet.address,
            claimHash: '',
            externalSignature: '',
            externalSignatureType: 'eip-191-0x45',
            schema: 'farcaster.xyz/schemas/v1/verification-add' as const,
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        signature: '',
        signer: '',
      };
    }
  ),

  /** Generate a VerificationRemove message */
  VerificationRemove: Factory.define<VerificationRemove, VerificationRemoveFactoryTransientParams, VerificationRemove>(
    ({ onCreate, transientParams }) => {
      const { privateKey = ed.utils.randomPrivateKey(), externalUri = Faker.datatype.hexaDecimal(40).toLowerCase() } =
        transientParams;

      onCreate(async (castProps) => {
        /** Generate claimHash if missing */
        if (!castProps.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: castProps.data.username,
            externalUri,
          };
          castProps.data.body.claimHash = await hashFCObject(verificationClaim);
        }

        const publicKey = await ed.getPublicKey(privateKey);
        const hash = await hashMessage(castProps);
        castProps.hash = hash;

        castProps.signer = await convertToHex(publicKey);

        const signature = await signEd25519(castProps.hash, privateKey);
        castProps.signature = signature;

        return castProps;
      });

      return {
        data: {
          body: {
            claimHash: '',
            schema: 'farcaster.xyz/schemas/v1/verification-remove' as const,
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        signature: '',
        signer: '',
      };
    }
  ),
};

interface EthAddress {
  address: string;
  privateKey: string;
}
