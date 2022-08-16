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
  MessageFactoryTransientParams,
  Message,
  SignatureAlgorithm,
  MessageSigner,
  HashAlgorithm,
} from '~/types';
import { hashMessage, signEd25519, hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';

/**
 * addEnvelopeToMessage adds hash, signer, signature, and signatureType to a message
 * object using the signer in transientParams if one is present
 */
const addEnvelopeToMessage = async (
  message: Message,
  transientParams: MessageFactoryTransientParams
): Promise<Message> => {
  let signer: MessageSigner;
  if (transientParams.signer) {
    signer = transientParams.signer;
  } else if (message.signatureType === SignatureAlgorithm.EthereumPersonalSign) {
    signer = await generateEthereumSigner();
  } else {
    signer = await generateEd25519Signer();
  }
  message.hash = await hashMessage(message);
  message.signer = signer.signerKey;
  if (signer.type === SignatureAlgorithm.EthereumPersonalSign) {
    message.signature = await signer.wallet.signMessage(message.hash);
  } else if (signer.type === SignatureAlgorithm.Ed25519) {
    message.signature = await signEd25519(message.hash, signer.privateKey);
  }
  message.signatureType = signer.type;
  return message;
};

/**
 * ProtocolFactories are used to construct valid Farcaster Protocol JSON objects.
 */
export const Factories = {
  /** Generate a valid Cast with randomized properties */
  Cast: Factory.define<CastShort, MessageFactoryTransientParams, CastShort>(({ onCreate, transientParams }) => {
    onCreate(async (castProps) => {
      return (await addEnvelopeToMessage(castProps, transientParams)) as CastShort;
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
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid CastRemove with randomized properties */
  CastRemove: Factory.define<CastRemove, MessageFactoryTransientParams, CastRemove>(({ onCreate, transientParams }) => {
    onCreate(async (castProps) => {
      return (await addEnvelopeToMessage(castProps, transientParams)) as CastRemove;
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
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid Cast with randomized properties */
  CastRecast: Factory.define<CastRecast, MessageFactoryTransientParams, CastRecast>(({ onCreate, transientParams }) => {
    onCreate(async (castProps) => {
      return (await addEnvelopeToMessage(castProps, transientParams)) as CastRecast;
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
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid Root with randomized properties */
  Root: Factory.define<Root, MessageFactoryTransientParams, Root>(({ onCreate, transientParams }) => {
    onCreate(async (rootProps) => {
      return (await addEnvelopeToMessage(rootProps, transientParams)) as Root;
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
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid Reaction with randomized properties */
  Reaction: Factory.define<Reaction, MessageFactoryTransientParams, Reaction>(({ onCreate, transientParams }) => {
    onCreate(async (castProps) => {
      return (await addEnvelopeToMessage(castProps, transientParams)) as Reaction;
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
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a VerificationAdd message */
  VerificationAdd: Factory.define<VerificationAdd, VerificationAddFactoryTransientParams, VerificationAdd>(
    ({ onCreate, transientParams }) => {
      const { ethWallet = ethers.Wallet.createRandom() } = transientParams;

      onCreate(async (props) => {
        /** Generate claimHash if missing */
        if (!props.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: props.data.username,
            externalUri: props.data.body.externalUri,
            blockHash: props.data.body.blockHash,
          };
          props.data.body.claimHash = await hashFCObject(verificationClaim);
        }

        /** Generate externalSignature if missing */
        if (!props.data.body.externalSignature) {
          props.data.body.externalSignature = await ethWallet.signMessage(props.data.body.claimHash);
        }

        /** Complete envelope */
        return (await addEnvelopeToMessage(props, transientParams)) as VerificationAdd;
      });

      return {
        data: {
          body: {
            externalUri: ethWallet.address,
            claimHash: '',
            blockHash: '',
            externalSignature: '',
            externalSignatureType: 'eip-191-0x45',
            schema: 'farcaster.xyz/schemas/v1/verification-add' as const,
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),

  /** Generate a VerificationRemove message */
  VerificationRemove: Factory.define<VerificationRemove, VerificationRemoveFactoryTransientParams, VerificationRemove>(
    ({ onCreate, transientParams }) => {
      const { externalUri = Faker.datatype.hexaDecimal(40).toLowerCase() } = transientParams;

      onCreate(async (props) => {
        /** Generate claimHash is missing */
        if (!props.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: props.data.username,
            externalUri,
            blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          };
          props.data.body.claimHash = await hashFCObject(verificationClaim);
        }

        /** Complete envelope */
        return (await addEnvelopeToMessage(props, transientParams)) as VerificationRemove;
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
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),
};
