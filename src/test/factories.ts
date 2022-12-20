import { faker } from '@faker-js/faker';
import { AccountId } from 'caip';
import { ethers } from 'ethers';
import { Factory } from 'fishery';
import { HASH_LENGTH, SyncId } from '~/network/sync/syncId';
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
  IdRegistryEvent,
  EthAddressUrlFactoryTransientParams,
  SignerMessageFactoryTransientParams,
  MessageType,
  FarcasterNetwork,
  ReactionAdd,
  ReactionRemove,
  FollowAdd,
  FollowRemove,
  Cast,
  CastShortBody,
} from '~/types';
import { CastURL, CastId, ChainAccountURL, UserId, UserURL } from '~/urls';
import { hashMessage, signEd25519, hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';

const generateTimestamp = (minDate: Date | undefined, maxDate: Date | undefined): number => {
  minDate = minDate || new Date(2020, 0, 1);
  if (minDate && maxDate) {
    return faker.date.between(minDate, maxDate).getTime();
  } else {
    return faker.date.recent().getTime();
  }
};

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
  /** Generate message hash */
  message.hash = await hashMessage(message);

  /** Get or generate message signer and signatureType */
  const signer = await getMessageSigner(message, transientParams);
  message.signer = signer.signerKey;
  message.signatureType = signer.type;

  /** Generate message signature */
  if (signer.type === SignatureAlgorithm.EthereumPersonalSign) {
    message.signature = await signer.wallet.signMessage(message.hash);
  } else if (signer.type === SignatureAlgorithm.Ed25519) {
    message.signature = await signEd25519(message.hash, signer.privateKey);
  }

  return message;
};

const UserURLFactory = Factory.define<UserURL, { fid: number }, UserURL>(({ transientParams, sequence }) => {
  return new UserURL(new UserId(`fid:${transientParams.fid || sequence}`));
});

const EthereumAddressURLFactory = Factory.define<ChainAccountURL, EthAddressUrlFactoryTransientParams, ChainAccountURL>(
  ({ transientParams }) => {
    const address = transientParams.address || faker.datatype.hexadecimal({ length: 32 }).toLowerCase();
    return new ChainAccountURL(new AccountId(`eip155:1:${address}`));
  }
);

const CastURLFactory = Factory.define<CastURL, { cast: Cast }, CastURL>(({ transientParams }) => {
  const { cast } = transientParams;
  const fid = cast ? cast.data.fid : faker.datatype.number();
  const hash = cast ? cast.hash : faker.datatype.hexadecimal({ length: 128 }).toLowerCase();
  return new CastURL(new CastId(`fid:${fid}/cast:${hash}`));
});

const SyncIdFactory = Factory.define<SyncId, { date: Date; hash: string }, SyncId>(({ transientParams }) => {
  const { date, hash } = transientParams;
  const dummyMessage: Message<MessageType.CastShort, CastShortBody> = {
    data: {
      signedAt: (date || faker.date.recent()).getTime(),
      body: { text: '' },
      fid: 1,
      type: MessageType.CastShort,
      network: FarcasterNetwork.Mainnet,
    },
    hash: hash || faker.datatype.hexadecimal({ length: HASH_LENGTH }).toLowerCase(),
    hashType: HashAlgorithm.Blake2b,
    signature: '',
    signatureType: SignatureAlgorithm.Ed25519,
    signer: '',
  };
  return new SyncId(dummyMessage);
});

/**
 * ProtocolFactories are used to construct valid Farcaster Protocol JSON objects.
 */
export const Factories = {
  EthereumAddressURL: EthereumAddressURLFactory,
  CastUrl: CastURLFactory,
  UserURL: UserURLFactory,
  SyncId: SyncIdFactory,

  /** Generate a valid Cast with randomized properties */
  CastShort: Factory.define<CastShort, MessageFactoryTransientParams, CastShort>(({ onCreate, transientParams }) => {
    onCreate(async (props) => {
      return (await addEnvelopeToMessage(props, transientParams)) as CastShort;
    });

    return {
      data: {
        body: {
          embeds: [faker.internet.url(), faker.internet.url()],
          text: faker.lorem.sentence(2),
          mentions: [faker.datatype.number()],
        },
        signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
        fid: faker.datatype.number(),
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
          targetHash: faker.datatype.hexadecimal({ length: 128 }).toLowerCase(),
        },
        signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
        fid: faker.datatype.number(),
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
          targetCastUri: CastURLFactory.build().toString(),
        },
        signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
        fid: faker.datatype.number(),
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
            targetUri: faker.internet.url(),
            type: 'like',
          },
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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
            targetUri: faker.internet.url(),
            type: 'like',
          },
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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
          targetUri: UserURLFactory.build().toString(),
        },
        signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
        fid: faker.datatype.number(),
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
            targetUri: UserURLFactory.build().toString(),
          },
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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

  /** Generate a valid IdRegistryEvent with randomized properties */
  IdRegistryEvent: Factory.define<IdRegistryEvent, any, IdRegistryEvent>(({ onCreate }) => {
    onCreate(async (props) => {
      return props;
    });

    return {
      args: {
        to: faker.datatype.hexadecimal({ length: 32 }).toLowerCase(),
        id: faker.datatype.number(),
      },
      blockNumber: faker.datatype.number(10_000),
      blockHash: faker.datatype.hexadecimal({ length: 64 }).toLowerCase(),
      transactionHash: faker.datatype.hexadecimal({ length: 64 }).toLowerCase(),
      logIndex: faker.datatype.number(),
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
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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
    const { ethWallet = new ethers.Wallet(ethers.utils.randomBytes(32)) } = transientParams;

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
          externalUri: EthereumAddressURLFactory.build(undefined, {
            transient: { address: ethWallet.address },
          }).toString(),
          claimHash: '',
          blockHash: faker.datatype.hexadecimal({ length: 64 }).toLowerCase(),
          externalSignature: '',
          externalSignatureType: SignatureAlgorithm.EthereumPersonalSign,
        },
        signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
        fid: faker.datatype.number(),
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
            claimHash: faker.datatype.hexadecimal({ length: 128 }).toLowerCase(),
          },
          signedAt: generateTimestamp(transientParams.minDate, transientParams.maxDate),
          fid: faker.datatype.number(),
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
