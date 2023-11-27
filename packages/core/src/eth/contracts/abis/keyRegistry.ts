export const keyRegistryABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_idRegistry",
        type: "address",
      },
      {
        internalType: "address",
        name: "_migrator",
        type: "address",
      },
      {
        internalType: "address",
        name: "_initialOwner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_maxKeysPerFid",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyMigrated",
    type: "error",
  },
  {
    inputs: [],
    name: "ExceedsMaximum",
    type: "error",
  },
  {
    inputs: [],
    name: "GatewayFrozen",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "currentNonce",
        type: "uint256",
      },
    ],
    name: "InvalidAccountNonce",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidKeyType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMaxKeys",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMetadata",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMetadataType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidState",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyGuardian",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyMigrator",
    type: "error",
  },
  {
    inputs: [],
    name: "PermissionRevoked",
    type: "error",
  },
  {
    inputs: [],
    name: "SignatureExpired",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "StringTooLong",
    type: "error",
  },
  {
    inputs: [],
    name: "Unauthorized",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
    ],
    name: "ValidatorNotFound",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "keyBytes",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
      },
    ],
    name: "Add",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "Add",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "keyBytes",
        type: "bytes",
      },
    ],
    name: "AdminReset",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "keyGateway",
        type: "address",
      },
    ],
    name: "FreezeKeyGateway",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "migratedAt",
        type: "uint256",
      },
    ],
    name: "Migrated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "keyBytes",
        type: "bytes",
      },
    ],
    name: "Remove",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "Remove",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldIdRegistry",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newIdRegistry",
        type: "address",
      },
    ],
    name: "SetIdRegistry",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldKeyGateway",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newKeyGateway",
        type: "address",
      },
    ],
    name: "SetKeyGateway",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldMax",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newMax",
        type: "uint256",
      },
    ],
    name: "SetMaxKeysPerFid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldMigrator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newMigrator",
        type: "address",
      },
    ],
    name: "SetMigrator",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oldValidator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newValidator",
        type: "address",
      },
    ],
    name: "SetValidator",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "REMOVE_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "VERSION",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "fidOwner",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
      {
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
      {
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
      },
    ],
    name: "add",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "addGuardian",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "fid",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "bytes",
                name: "key",
                type: "bytes",
              },
              {
                internalType: "bytes",
                name: "metadata",
                type: "bytes",
              },
            ],
            internalType: "struct IKeyRegistry.BulkAddKey[]",
            name: "keys",
            type: "tuple[]",
          },
        ],
        internalType: "struct IKeyRegistry.BulkAddData[]",
        name: "items",
        type: "tuple[]",
      },
    ],
    name: "bulkAddKeysForMigration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "fid",
            type: "uint256",
          },
          {
            internalType: "bytes[]",
            name: "keys",
            type: "bytes[]",
          },
        ],
        internalType: "struct IKeyRegistry.BulkResetData[]",
        name: "items",
        type: "tuple[]",
      },
    ],
    name: "bulkResetKeysForMigration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "domainSeparatorV4",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "freezeKeyGateway",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "gatewayFrozen",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "gracePeriod",
    outputs: [
      {
        internalType: "uint24",
        name: "",
        type: "uint24",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "guardians",
    outputs: [
      {
        internalType: "bool",
        name: "isGuardian",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "structHash",
        type: "bytes32",
      },
    ],
    name: "hashTypedDataV4",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "idRegistry",
    outputs: [
      {
        internalType: "contract IdRegistryLike",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isMigrated",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "enum IKeyRegistry.KeyState",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "keyAt",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
    ],
    name: "keyDataOf",
    outputs: [
      {
        components: [
          {
            internalType: "enum IKeyRegistry.KeyState",
            name: "state",
            type: "uint8",
          },
          {
            internalType: "uint32",
            name: "keyType",
            type: "uint32",
          },
        ],
        internalType: "struct IKeyRegistry.KeyData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "keyGateway",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
    ],
    name: "keys",
    outputs: [
      {
        internalType: "enum IKeyRegistry.KeyState",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "enum IKeyRegistry.KeyState",
        name: "state",
        type: "uint8",
      },
    ],
    name: "keysOf",
    outputs: [
      {
        internalType: "bytes[]",
        name: "",
        type: "bytes[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "enum IKeyRegistry.KeyState",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "startIdx",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "batchSize",
        type: "uint256",
      },
    ],
    name: "keysOf",
    outputs: [
      {
        internalType: "bytes[]",
        name: "page",
        type: "bytes[]",
      },
      {
        internalType: "uint256",
        name: "nextIdx",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxKeysPerFid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "migrate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "migratedAt",
    outputs: [
      {
        internalType: "uint40",
        name: "",
        type: "uint40",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "migrator",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
    ],
    name: "remove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "fidOwner",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "sig",
        type: "bytes",
      },
    ],
    name: "removeFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "removeGuardian",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_idRegistry",
        type: "address",
      },
    ],
    name: "setIdRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_keyGateway",
        type: "address",
      },
    ],
    name: "setKeyGateway",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maxKeysPerFid",
        type: "uint256",
      },
    ],
    name: "setMaxKeysPerFid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_migrator",
        type: "address",
      },
    ],
    name: "setMigrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
      {
        internalType: "contract IMetadataValidator",
        name: "validator",
        type: "address",
      },
    ],
    name: "setValidator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fid",
        type: "uint256",
      },
      {
        internalType: "enum IKeyRegistry.KeyState",
        name: "state",
        type: "uint8",
      },
    ],
    name: "totalKeys",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "useNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "keyType",
        type: "uint32",
      },
      {
        internalType: "uint8",
        name: "metadataType",
        type: "uint8",
      },
    ],
    name: "validators",
    outputs: [
      {
        internalType: "contract IMetadataValidator",
        name: "validator",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
