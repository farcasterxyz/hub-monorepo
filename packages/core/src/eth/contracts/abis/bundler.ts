export const bundlerABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_idGateway",
        type: "address",
      },
      {
        internalType: "address",
        name: "_keyGateway",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "CallFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "Unauthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [],
    name: "SignatureExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPayment",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidState",
    type: "error",
  },
  {
    inputs: [],
    name: "ExceedsMaximum",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMetadata",
    type: "error",
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
    name: "idGateway",
    outputs: [
      {
        internalType: "contract IIdGateway",
        name: "",
        type: "address",
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
        internalType: "contract IKeyGateway",
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
        name: "extraStorage",
        type: "uint256",
      },
    ],
    name: "price",
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
        components: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "address",
            name: "recovery",
            type: "address",
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
        internalType: "struct IBundler.RegistrationParams",
        name: "registerParams",
        type: "tuple",
      },
      {
        components: [
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
        internalType: "struct IBundler.SignerParams[]",
        name: "signerParams",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "extraStorage",
        type: "uint256",
      },
    ],
    name: "register",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;
