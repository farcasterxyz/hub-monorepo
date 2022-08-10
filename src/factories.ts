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
  SignerAddFactoryTransientParams,
  SignatureAlgorithm,
  Message,
  MessageFactoryTransientParams,
  CustodyAddEvent,
  EthereumSigner,
  CustodyRemoveAll,
} from '~/types';
import { hashMessage, signEd25519, hashFCObject, generateEd25519Signer, generateEthereumSigner } from '~/utils';

const getMessageSigner = async (props: Message, transientParams: MessageFactoryTransientParams) => {
  /** Check if transientParams already has a signer */
  if (transientParams.signer) return transientParams.signer;

  /** Check if props has signatureType set  */
  if (props.signatureType === SignatureAlgorithm.EthereumPersonalSign) return await generateEthereumSigner();

  /** Otherwise generate default signer */
  return await generateEd25519Signer();
};

/**
 * addEnvelopeToMessage adds hash, signer, signature, and signatureType to a message
 * object using the signer in transientParams if one is present
 */
const addEnvelopeToMessage = async (
  props: Message,
  transientParams: MessageFactoryTransientParams
): Promise<Message> => {
  const signer = await getMessageSigner(props, transientParams);
  props.hash = await hashMessage(props);
  props.signer = signer.signerKey;
  if (signer.type === SignatureAlgorithm.EthereumPersonalSign) {
    props.signature = await signer.wallet.signMessage(props.hash);
  } else if (signer.type === SignatureAlgorithm.Ed25519) {
    props.signature = await signEd25519(props.hash, signer.privateKey);
  }
  props.signatureType = signer.type;
  return props;
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
      signature: '',
      signatureType: SignatureAlgorithm.Ed25519,
      signer: '',
    };
  }),

  /** Generate a valid CustodyAddEvent with randomized properties */
  CustodyAddEvent: Factory.define<CustodyAddEvent, { signer?: EthereumSigner }, CustodyAddEvent>(
    ({ onCreate, transientParams }) => {
      onCreate(async (props) => {
        const signer = transientParams.signer || (await generateEthereumSigner());
        if (!props.custodyAddress) {
          props.custodyAddress = signer.signerKey;
        }
        return props;
      });

      return {
        custodyAddress: '',
        blockNumber: Faker.datatype.number(10_000),
      };
    }
  ),

  /** Generate a valid CustodyRemoveAll with randomized properties */
  CustodyRemoveAll: Factory.define<CustodyRemoveAll, MessageFactoryTransientParams, CustodyRemoveAll>(
    ({ onCreate, transientParams }) => {
      onCreate(async (castProps) => {
        return (await addEnvelopeToMessage(castProps, transientParams)) as CustodyRemoveAll;
      });

      return {
        data: {
          body: {
            schema: 'farcaster.xyz/schemas/v1/custody-remove-all' as const,
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
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

      return (await addEnvelopeToMessage(props, { ...transientParams, signer })) as SignerAdd;
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
            childKey: '',
            schema: 'farcaster.xyz/schemas/v1/signer-remove',
          },
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
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
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
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
          rootBlock: Faker.datatype.number(10_000),
          signedAt: Faker.time.recent(),
          username: Faker.name.firstName().toLowerCase(),
        },
        hash: '',
        signature: '',
        signatureType: SignatureAlgorithm.Ed25519,
        signer: '',
      };
    }
  ),
};
