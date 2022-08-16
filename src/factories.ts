import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import {
  CastShort,
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
  SignerAddFactoryTransientParams,
  SignatureAlgorithm,
  Message,
  MessageFactoryTransientParams,
  MessageSigner,
  CustodyRemoveAll,
  HashAlgorithm,
  IDRegistryEvent,
} from '~/types';
import { hashMessage, signEd25519, hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';

/**
 * getMessageSigner gets or generates a signer based on a message and transient params object
 */
const getMessageSigner = async (
  message: Message,
  transientParams: MessageFactoryTransientParams
): Promise<MessageSigner> => {
  /** Check if transientParams already has a signer */
  if (transientParams.signer) return transientParams.signer;

  /** Check if message has signatureType set  */
  if (message.signatureType === SignatureAlgorithm.EthereumPersonalSign) return await generateEthereumSigner();

  /** Otherwise generate default signer */
  return await generateEd25519Signer();
};

/**
 * addEnvelopeToMessage adds hash, signer, signature, and signatureType to a message
 * object using the signer in transientParams if one is present
 */
const addEnvelopeToMessage = async (
  message: Message,
  transientParams: MessageFactoryTransientParams
): Promise<Message> => {
  const signer = await getMessageSigner(message, transientParams);
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
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as CastShort;
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
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as CastRemove;
    });

    return {
      data: {
        body: {
          targetHash: Faker.datatype.hexaDecimal(40).toLowerCase(),
          schema: 'farcaster.xyz/schemas/v1/cast-remove',
        },
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
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as CastRecast;
    });

    return {
      data: {
        body: {
          targetCastUri: 'farcaster://alice/cast/1', // TODO: Find some way to generate this.
          schema: 'farcaster.xyz/schemas/v1/cast-recast' as const,
        },
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

  /** Generate a valid Reaction with randomized properties */
  Reaction: Factory.define<Reaction, MessageFactoryTransientParams, Reaction>(({ onCreate, transientParams }) => {
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as Reaction;
    });

    return {
      data: {
        body: {
          active: true,
          targetUri: Faker.internet.url(),
          type: 'like',
          schema: 'farcaster.xyz/schemas/v1/reaction' as const,
        },
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

  /** Generate a valid IDRegistryEvent with randomized properties */
  IDRegistryEvent: Factory.define<IDRegistryEvent, any, IDRegistryEvent>(({ onCreate }) => {
    onCreate(async (props) => {
      return props;
    });

    return {
      args: {
        to: Faker.datatype.hexaDecimal(32),
        id: Faker.datatype.number(),
      },
      blockNumber: Faker.datatype.number(10_000),
      blockHash: Faker.datatype.hexaDecimal(64),
      transactionHash: Faker.datatype.hexaDecimal(64),
      logIndex: Faker.datatype.number(),
      name: 'Register',
    };
  }),

  /** Generate a valid CustodyRemoveAll with randomized properties */
  CustodyRemoveAll: Factory.define<CustodyRemoveAll, MessageFactoryTransientParams, CustodyRemoveAll>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as CustodyRemoveAll;
      });

      return {
        data: {
          body: {
            schema: 'farcaster.xyz/schemas/v1/custody-remove-all' as const,
          },
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.EthereumPersonalSign,
        signer: '',
      };
    }
  ),

  /** Generate a valid SignerAdd with randomized properties */
  SignerAdd: Factory.define<SignerAdd, SignerAddFactoryTransientParams, SignerAdd>(({ onCreate, transientParams }) => {
    onCreate(async (props) => {
      const signer = await getMessageSigner(props, transientParams);
      const delegateSigner = transientParams.delegateSigner || (await generateEd25519Signer());
      const custodyAddress = signer.signerKey;
      const delegate = delegateSigner.signerKey;

      /** Set delegate if missing */
      if (!props.data.body.delegate) {
        props.data.body.delegate = delegate;
      }

      /** Generate edgeHash if missing */
      if (!props.data.body.edgeHash) {
        const edge: SignerEdge = {
          custody: custodyAddress,
          delegate: props.data.body.delegate,
        };
        props.data.body.edgeHash = await hashFCObject(edge);
      }

      /** Generate delegateSignature if missing */
      if (!props.data.body.delegateSignature) {
        props.data.body.delegateSignature = await signEd25519(props.data.body.edgeHash, delegateSigner.privateKey);
      }

      return (await addEnvelopeToMessage(props, { ...transientParams, signer })) as SignerAdd;
    });

    return {
      data: {
        body: {
          delegate: '',
          edgeHash: '',
          delegateSignature: '',
          delegateSignatureType: SignatureAlgorithm.Ed25519,
          schema: 'farcaster.xyz/schemas/v1/signer-add',
        },
        signedAt: Faker.time.recent(),
        username: Faker.name.firstName().toLowerCase(),
      },
      hash: '',
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: Faker.helpers.randomize([SignatureAlgorithm.Ed25519, SignatureAlgorithm.EthereumPersonalSign]),
      signer: '',
    };
  }),

  /** Generate a valid SignerRemove with randomized properties */
  SignerRemove: Factory.define<SignerRemove, MessageFactoryTransientParams, SignerRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as SignerRemove;
      });

      return {
        data: {
          body: {
            delegate: '',
            schema: 'farcaster.xyz/schemas/v1/signer-remove',
          },
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: Faker.helpers.randomize([SignatureAlgorithm.Ed25519, SignatureAlgorithm.EthereumPersonalSign]),
        signer: '',
      };
    }
  ),

  /** Generate a VerificationAdd message with randomized properties */
  VerificationAdd: Factory.define<VerificationAdd, VerificationAddFactoryTransientParams, VerificationAdd>(
    ({ onCreate, transientParams }) => {
      const { ethWallet = ethers.Wallet.createRandom() } = transientParams;

      onCreate(async (props) => {
        /** Generate claimHash if missing */
        if (!props.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: props.data.username,
            externalUri: props.data.body.externalUri,
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
            externalSignature: '',
            externalSignatureType: 'eip-191-0x45',
            schema: 'farcaster.xyz/schemas/v1/verification-add' as const,
          },
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

  /** Generate a VerificationRemove message with randomized properties */
  VerificationRemove: Factory.define<VerificationRemove, VerificationRemoveFactoryTransientParams, VerificationRemove>(
    ({ onCreate, transientParams }) => {
      const { externalUri = Faker.datatype.hexaDecimal(40).toLowerCase() } = transientParams;

      onCreate(async (props) => {
        /** Generate claimHash if missing */
        if (!props.data.body.claimHash) {
          const verificationClaim: VerificationClaim = {
            username: props.data.username,
            externalUri,
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
