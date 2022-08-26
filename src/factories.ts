import { Factory } from 'fishery';
import Faker from 'faker';
import { ethers } from 'ethers';
import {
  CastShort,
  CastRecast,
  CastRemove,
  VerificationEthereumAddress,
  VerificationRemove,
  VerificationEthereumAddressClaim,
  VerificationEthereumAddressFactoryTransientParams,
  SignerAdd,
  SignerRemove,
  SignatureAlgorithm,
  Message,
  MessageFactoryTransientParams,
  MessageSigner,
  HashAlgorithm,
  IDRegistryEvent,
  SignerMessageFactoryTransientParams,
  MessageType,
  FarcasterNetwork,
  ReactionAdd,
  ReactionRemove,
  FollowAdd,
  FollowRemove,
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
  CastShort: Factory.define<CastShort, MessageFactoryTransientParams, CastShort>(({ onCreate, transientParams }) => {
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
        },
        signedAt: Faker.time.recent(),
        fid: Faker.datatype.number(),
        type: MessageType.CastShort,
        network: FarcasterNetwork.Testnet,
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
        },
        signedAt: Faker.time.recent(),
        fid: Faker.datatype.number(),
        type: MessageType.CastRemove,
        network: FarcasterNetwork.Testnet,
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
          targetCastUri: Faker.internet.url(),
        },
        signedAt: Faker.time.recent(),
        fid: Faker.datatype.number(),
        type: MessageType.CastRecast,
        network: FarcasterNetwork.Testnet,
      },
      hash: '',
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid ReactionAdd with randomized properties */
  ReactionAdd: Factory.define<ReactionAdd, MessageFactoryTransientParams, ReactionAdd>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as ReactionAdd;
      });

      return {
        data: {
          body: {
            targetUri: Faker.internet.url(),
            type: 'like',
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.ReactionAdd,
          network: FarcasterNetwork.Testnet,
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),

  /** Generate a valid ReactionRemove with randomized properties */
  ReactionRemove: Factory.define<ReactionRemove, MessageFactoryTransientParams, ReactionRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as ReactionRemove;
      });

      return {
        data: {
          body: {
            targetUri: Faker.internet.url(),
            type: 'like',
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.ReactionRemove,
          network: FarcasterNetwork.Testnet,
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),

  /** Generate a valid FollowAdd with randomized properties */
  FollowAdd: Factory.define<FollowAdd, MessageFactoryTransientParams, FollowAdd>(({ onCreate, transientParams }) => {
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as FollowAdd;
    });

    return {
      data: {
        body: {
          targetUri: Faker.internet.url(),
        },
        signedAt: Faker.time.recent(),
        fid: Faker.datatype.number(),
        type: MessageType.FollowAdd,
        network: FarcasterNetwork.Testnet,
      },
      hash: '',
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid FollowRemove with randomized properties */
  FollowRemove: Factory.define<FollowRemove, MessageFactoryTransientParams, FollowRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as FollowRemove;
      });

      return {
        data: {
          body: {
            targetUri: Faker.internet.url(),
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.FollowRemove,
          network: FarcasterNetwork.Testnet,
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),

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

  /** Generate a valid SignerAdd with randomized properties */
  SignerAdd: Factory.define<SignerAdd, SignerMessageFactoryTransientParams, SignerAdd>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        if (transientParams.delegateSigner && !props.data.body.delegate) {
          props.data.body.delegate = transientParams.delegateSigner.signerKey;
        }
        return (await addEnvelopeToMessage(props, { ...transientParams })) as SignerAdd;
      });

      return {
        data: {
          body: {
            delegate: '',
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.SignerAdd,
          network: FarcasterNetwork.Testnet,
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.EthereumPersonalSign,
        signer: '',
      };
    }
  ),

  /** Generate a valid SignerRemove with randomized properties */
  SignerRemove: Factory.define<SignerRemove, SignerMessageFactoryTransientParams, SignerRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        if (transientParams.delegateSigner && !props.data.body.delegate) {
          props.data.body.delegate = transientParams.delegateSigner.signerKey;
        }
        return (await addEnvelopeToMessage(props, transientParams)) as SignerRemove;
      });

      return {
        data: {
          body: {
            delegate: '',
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.SignerRemove,
          network: FarcasterNetwork.Testnet,
        },
        hash: '',
        hashType: HashAlgorithm.Blake2b,
        signature: '',
        signatureType: SignatureAlgorithm.EthereumPersonalSign,
        signer: '',
      };
    }
  ),

  /** Generate a VerificationEthereumAddress message with randomized properties */
  VerificationEthereumAddress: Factory.define<
    VerificationEthereumAddress,
    VerificationEthereumAddressFactoryTransientParams,
    VerificationEthereumAddress
  >(({ onCreate, transientParams }) => {
    const { ethWallet = ethers.Wallet.createRandom() } = transientParams;

    onCreate(async (props) => {
      /** Generate claimHash if missing */
      if (!props.data.body.claimHash) {
        const verificationClaim: VerificationEthereumAddressClaim = {
          fid: props.data.fid,
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
      return (await addEnvelopeToMessage(props, transientParams)) as VerificationEthereumAddress;
    });

    return {
      data: {
        body: {
          externalUri: ethWallet.address,
          claimHash: '',
          blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          externalSignature: '',
          externalSignatureType: SignatureAlgorithm.EthereumPersonalSign,
        },
        signedAt: Faker.time.recent(),
        fid: Faker.datatype.number(),
        type: MessageType.VerificationEthereumAddress,
        network: FarcasterNetwork.Testnet,
      },
      hash: '',
      hashType: HashAlgorithm.Blake2b,
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a VerificationRemove message with randomized properties */
  VerificationRemove: Factory.define<VerificationRemove, MessageFactoryTransientParams, VerificationRemove>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        return (await addEnvelopeToMessage(props, transientParams)) as VerificationRemove;
      });

      return {
        data: {
          body: {
            claimHash: '',
          },
          signedAt: Faker.time.recent(),
          fid: Faker.datatype.number(),
          type: MessageType.VerificationRemove,
          network: FarcasterNetwork.Testnet,
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
