export const IdRegistry = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_forwarder',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'Escrow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'HasId',
      type: 'error',
    },
    {
      inputs: [],
      name: 'HasNoId',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Invitable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NoRecovery',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Registrable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Unauthorized',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'by',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'CancelRecovery',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'url',
          type: 'string',
        },
      ],
      name: 'ChangeHome',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'ChangeRecoveryAddress',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'trustedCaller',
          type: 'address',
        },
      ],
      name: 'ChangeTrustedCaller',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [],
      name: 'DisableTrustedOnly',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'url',
          type: 'string',
        },
      ],
      name: 'Register',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'RequestRecovery',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'Transfer',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
      ],
      name: 'cancelRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'url',
          type: 'string',
        },
      ],
      name: 'changeHome',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'changeRecoveryAddress',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_trustedCaller',
          type: 'address',
        },
      ],
      name: 'changeTrustedCaller',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
      ],
      name: 'completeRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'completeTransferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'disableTrustedOnly',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'idOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'forwarder',
          type: 'address',
        },
      ],
      name: 'isTrustedForwarder',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
        {
          internalType: 'string',
          name: 'url',
          type: 'string',
        },
      ],
      name: 'register',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
      ],
      name: 'requestRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'requestTransferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
      ],
      name: 'transfer',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
        {
          internalType: 'string',
          name: 'url',
          type: 'string',
        },
      ],
      name: 'trustedRegister',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  bytecode:
    '0x60a060405260016004553480156200001657600080fd5b506040516200139738038062001397833981016040819052620000399162000109565b6001600160a01b0381166080526200005a6200005462000061565b6200007d565b506200013b565b600062000078620000cd60201b62000cac1760201c565b905090565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6080516000906001600160a01b03163303620000f0575060131936013560601c90565b620000786200010560201b62000d201760201c565b3390565b6000602082840312156200011c57600080fd5b81516001600160a01b03811681146200013457600080fd5b9392505050565b6080516112396200015e600039600081816101730152610cb001526112396000f3fe608060405234801561001057600080fd5b506004361061011b5760003560e01c80638da5cb5b116100b2578063d94fe83211610081578063f1f0b22411610066578063f1f0b2241461028a578063f2fde38b1461029d578063f480dd7e146102b057600080fd5b8063d94fe83214610249578063ede497391461027757600080fd5b80638da5cb5b146101e85780639d6fa61814610210578063aa217f2514610223578063c90db4471461023657600080fd5b8063572b6c05116100ee578063572b6c05146101635780636e9bde49146101c5578063715018a6146101cd578063881b1956146101d557600080fd5b8063052a30a3146101205780631a6952301461013557806336bacd731461014857806353f0447e1461015b575b600080fd5b61013361012e36600461106d565b6102c3565b005b6101336101433660046110ce565b6103b5565b6101336101563660046110f0565b61048e565b6101336105aa565b6101b06101713660046110ce565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff90811691161490565b60405190151581526020015b60405180910390f35b61013361062e565b610133610666565b6101336101e33660046110ce565b61067a565b60005460405173ffffffffffffffffffffffffffffffffffffffff90911681526020016101bc565b61013361021e3660046110ce565b6106f1565b610133610231366004611123565b610740565b6101336102443660046110ce565b610804565b6102696102573660046110ce565b60056020526000908152604090205481565b6040519081526020016101bc565b61013361028536600461106d565b61096c565b6101336102983660046110ce565b6109a8565b6101336102ab3660046110ce565b610ae0565b6101336102be3660046110ce565b610b1a565b6004546000036102ff576040517f7cb40a3900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60025473ffffffffffffffffffffffffffffffffffffffff163314610350576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61035a8484610d24565b6001548473ffffffffffffffffffffffffffffffffffffffff167f3cd6a0ffcc37406d9958e09bba79ff19d8237819eb2e1911f9edbce656499c878585856040516103a7939291906111ae565b60405180910390a350505050565b60006103bf610dec565b73ffffffffffffffffffffffffffffffffffffffff8116600090815260056020526040812054919250819003610421576040517f210b4b2600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff83166000908152600560205260409020541561047e576040517ff90230a900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610489818385610df6565b505050565b73ffffffffffffffffffffffffffffffffffffffff8083166000908152600560209081526040808320548084526006909252909120549091166104cf610dec565b73ffffffffffffffffffffffffffffffffffffffff161461051c576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000818152600760209081526040808320429055600890915280822080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff86811691821790925591518493918716917ffab80e8bf242ed27bf595552dfdddbdd794f201d6dfcd8df7347f82f8e1f1f9b91a4505050565b60035473ffffffffffffffffffffffffffffffffffffffff1633146105fb576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61060433610ec8565b600380547fffffffffffffffffffffffff0000000000000000000000000000000000000000169055565b610636610f3d565b600060048190556040517f03732e5295a5bd18e6ef95b03b41aa8bcadae292a7ef40468144c7a727dfa8b59190a1565b61066e610f3d565b6106786000610ec8565b565b610682610f3d565b600280547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff83169081179091556040517f255ba3357fefe42b361c216b6e0bc5541f1e6ea4c6178d4a45ad8dd7ec28139d90600090a250565b6106f9610f3d565b600380547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b60006005600061074e610dec565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050806000036107c5576040517f210b4b2600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b807f5d926244a310a9e23d7caac05945165ecf7ef6f4a47fae87eb5e8a005629fdb084846040516107f79291906111e7565b60405180910390a2505050565b73ffffffffffffffffffffffffffffffffffffffff811660009081526005602052604081205490610833610dec565b90508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614158015610898575060008281526006602052604090205473ffffffffffffffffffffffffffffffffffffffff828116911614155b156108cf576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000828152600760205260408120549003610916576040517fc993b99300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008281526007602052604080822082905551839173ffffffffffffffffffffffffffffffffffffffff8416917f6181d4215ebc71e962cc193554c17f05a825da06230fdf9ece45081f09cb206f9190a3505050565b600454600103610350576040517f40adbefd00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000600560006109b6610dec565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905080600003610a2d576040517f210b4b2600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600081815260066020908152604080832080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8716179055600790915290205415610a99576000818152600760205260408120555b60405173ffffffffffffffffffffffffffffffffffffffff83169082907f8e700b803af43e14651431cd73c9fe7d11b131ad797576a70b893ce5766f65c390600090a35050565b610ae8610f3d565b6040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff808216600090815260056020908152604080832054808452600690925290912054909116610b5b610dec565b73ffffffffffffffffffffffffffffffffffffffff1614610ba8576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008181526007602052604081205490819003610bf1576040517fc993b99300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6203f4808101421015610c30576040517f22f607f600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008281526008602090815260408083205473ffffffffffffffffffffffffffffffffffffffff1680845260059092529091205415610c9b576040517ff90230a900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610ca6838583610df6565b50505050565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163303610d1657507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec36013560601c90565b503390565b905090565b3390565b73ffffffffffffffffffffffffffffffffffffffff821660009081526005602052604090205415610d81576040517ff90230a900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6001805481019081905573ffffffffffffffffffffffffffffffffffffffff9283166000908152600560209081526040808320849055928252600690522080547fffffffffffffffffffffffff00000000000000000000000000000000000000001691909216179055565b6000610d1b610cac565b73ffffffffffffffffffffffffffffffffffffffff8082166000908152600560209081526040808320879055928516825282822082905585825260079052205415610e4b576000838152600760205260408120555b60008381526006602052604080822080547fffffffffffffffffffffffff000000000000000000000000000000000000000016905551849173ffffffffffffffffffffffffffffffffffffffff84811692908616917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b6000805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b610f45610dec565b73ffffffffffffffffffffffffffffffffffffffff16610f7a60005473ffffffffffffffffffffffffffffffffffffffff1690565b73ffffffffffffffffffffffffffffffffffffffff1614610678576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640160405180910390fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461101f57600080fd5b919050565b60008083601f84011261103657600080fd5b50813567ffffffffffffffff81111561104e57600080fd5b60208301915083602082850101111561106657600080fd5b9250929050565b6000806000806060858703121561108357600080fd5b61108c85610ffb565b935061109a60208601610ffb565b9250604085013567ffffffffffffffff8111156110b657600080fd5b6110c287828801611024565b95989497509550505050565b6000602082840312156110e057600080fd5b6110e982610ffb565b9392505050565b6000806040838503121561110357600080fd5b61110c83610ffb565b915061111a60208401610ffb565b90509250929050565b6000806020838503121561113657600080fd5b823567ffffffffffffffff81111561114d57600080fd5b61115985828601611024565b90969095509350505050565b8183528181602085013750600060208284010152600060207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f840116840101905092915050565b73ffffffffffffffffffffffffffffffffffffffff841681526040602082015260006111de604083018486611165565b95945050505050565b6020815260006111fb602083018486611165565b94935050505056fea26469706673582212207d9385ab4c4d1fa6a6159e0543a8f938e3e37cbf73970869a882e93a99f82fb064736f6c634300081000330000000000000000000000007a95fa73250dc53556d264522150a940d4c50238',
} as const;

export const NameRegistry = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_forwarder',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'CallFailed',
      type: 'error',
    },
    {
      inputs: [],
      name: 'CommitReplay',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Escrow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Expired',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InsufficientFunds',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidCommit',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidName',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidRecovery',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Invitable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NoRecovery',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotAdmin',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotBiddable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotInvitable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotModerator',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotOperator',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotRenewable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotTreasurer',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Registered',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Registrable',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Unauthorized',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'previousAdmin',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'newAdmin',
          type: 'address',
        },
      ],
      name: 'AdminChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'approved',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'operator',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'approved',
          type: 'bool',
        },
      ],
      name: 'ApprovalForAll',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'beacon',
          type: 'address',
        },
      ],
      name: 'BeaconUpgraded',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'by',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'CancelRecovery',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'fee',
          type: 'uint256',
        },
      ],
      name: 'ChangeFee',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'pool',
          type: 'address',
        },
      ],
      name: 'ChangePool',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'ChangeRecoveryAddress',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'trustedCaller',
          type: 'address',
        },
      ],
      name: 'ChangeTrustedCaller',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'vault',
          type: 'address',
        },
      ],
      name: 'ChangeVault',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [],
      name: 'DisableTrustedOnly',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint8',
          name: 'version',
          type: 'uint8',
        },
      ],
      name: 'Initialized',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'inviterId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'inviteeId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'bytes16',
          name: 'fname',
          type: 'bytes16',
        },
      ],
      name: 'Invite',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Paused',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'expiry',
          type: 'uint256',
        },
      ],
      name: 'Renew',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'RequestRecovery',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'previousAdminRole',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'newAdminRole',
          type: 'bytes32',
        },
      ],
      name: 'RoleAdminChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleGranted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleRevoked',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'Transfer',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Unpaused',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'Upgraded',
      type: 'event',
    },
    {
      inputs: [],
      name: 'DEFAULT_ADMIN_ROLE',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'approve',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'balanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'bid',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'cancelRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_fee',
          type: 'uint256',
        },
      ],
      name: 'changeFee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_pool',
          type: 'address',
        },
      ],
      name: 'changePool',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'changeRecoveryAddress',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_trustedCaller',
          type: 'address',
        },
      ],
      name: 'changeTrustedCaller',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_vault',
          type: 'address',
        },
      ],
      name: 'changeVault',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'completeRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'disableTrustedOnly',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'expiryOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'fee',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes16',
          name: 'fname',
          type: 'bytes16',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: 'secret',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'generateCommit',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'commit',
          type: 'bytes32',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'getApproved',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
      ],
      name: 'getRoleAdmin',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'grantRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'hasRole',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: '_tokenName',
          type: 'string',
        },
        {
          internalType: 'string',
          name: '_tokenSymbol',
          type: 'string',
        },
        {
          internalType: 'address',
          name: '_vault',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_pool',
          type: 'address',
        },
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'operator',
          type: 'address',
        },
      ],
      name: 'isApprovedForAll',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'forwarder',
          type: 'address',
        },
      ],
      name: 'isTrustedForwarder',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'commit',
          type: 'bytes32',
        },
      ],
      name: 'makeCommit',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'ownerOf',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'paused',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pool',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'proxiableUUID',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'reclaim',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'recoveryClockOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'recoveryDestinationOf',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'recoveryOf',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes16',
          name: 'fname',
          type: 'bytes16',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: 'secret',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
      ],
      name: 'register',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'renew',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'renounceRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
      ],
      name: 'requestRecovery',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'revokeRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes',
        },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'operator',
          type: 'address',
        },
        {
          internalType: 'bool',
          name: 'approved',
          type: 'bool',
        },
      ],
      name: 'setApprovalForAll',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes4',
          name: 'interfaceId',
          type: 'bytes4',
        },
      ],
      name: 'supportsInterface',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'timestampOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'tokenURI',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'transferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'trustedCaller',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'trustedOnly',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes16',
          name: 'fname',
          type: 'bytes16',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'recovery',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'inviter',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'invitee',
          type: 'uint256',
        },
      ],
      name: 'trustedRegister',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newImplementation',
          type: 'address',
        },
      ],
      name: 'upgradeTo',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newImplementation',
          type: 'address',
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes',
        },
      ],
      name: 'upgradeToAndCall',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'vault',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'withdraw',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  bytecode:
    '0x60c06040523060a0523480156200001557600080fd5b506040516200555f3803806200555f833981016040819052620000389162000118565b6001600160a01b0381166080526200004f62000056565b506200014a565b600054610100900460ff1615620000c35760405162461bcd60e51b815260206004820152602760248201527f496e697469616c697a61626c653a20636f6e747261637420697320696e697469604482015266616c697a696e6760c81b606482015260840160405180910390fd5b60005460ff908116101562000116576000805460ff191660ff9081179091556040519081527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b565b6000602082840312156200012b57600080fd5b81516001600160a01b03811681146200014357600080fd5b9392505050565b60805160a0516153cc62000193600039600081816111d101528181611267015281816118050152818161189b015261199201526000818161063e0152613a6901526153cc6000f3fe6080604052600436106103555760003560e01c80636352211e116101bb5780639950e7ee116100f7578063c87b56dd11610095578063ddca3f431161006f578063ddca3f43146109de578063e985e9c5146109f5578063fa1a1b2514610a3e578063fbfa77cf14610a7557600080fd5b8063c87b56dd14610967578063cb17e04a14610987578063d547741f146109be57600080fd5b8063a22cb465116100d1578063a22cb465146108cb578063ac817ccc146108eb578063b88d4fde14610919578063baef73e91461093957600080fd5b80639950e7ee146108765780639fc999e414610896578063a217fddf146108b657600080fd5b806376fa0b8a11610164578063881b19561161013e578063881b1956146107db5780638f15b414146107fb57806391d148541461081b57806395d89b411461086157600080fd5b806376fa0b8a146107785780638456cb59146107a657806385fb8449146107bb57600080fd5b80636b2ddd4e116101955780636b2ddd4e1461072c5780636e9bde491461074357806370a082311461075857600080fd5b80636352211e146106cc5780636473b35e146106ec5780636a1db1bf1461070c57600080fd5b806336568abe116102955780634f1ef286116102335780635baa75091161020d5780635baa75091461066e5780635c975abb146106815780635e7510001461069957806360e232a9146106ac57600080fd5b80634f1ef286146105f957806352d1902d1461060c578063572b6c051461062157600080fd5b80633f4ba83a1161026f5780633f4ba83a1461059157806342842e0e146105a65780634339bc30146105c6578063464ac22c146105e657600080fd5b806336568abe1461053e5780633659cfe61461055e5780633f09a95a1461057e57600080fd5b806316f0115b11610302578063268f0760116102dc578063268f0760146104ca5780632dabbeed146104eb5780632e1a7d4d146104fe5780632f2ff15d1461051e57600080fd5b806316f0115b1461044b57806323b872dd1461046c578063248a9ca31461048c57600080fd5b8063095ea7b311610333578063095ea7b3146103e95780630c97fc361461040b57806310de26761461042b57600080fd5b806301ffc9a71461035a57806306fdde031461038f578063081812fc146103b1575b600080fd5b34801561036657600080fd5b5061037a6103753660046149a0565b610a96565b60405190151581526020015b60405180910390f35b34801561039b57600080fd5b506103a4610aa7565b6040516103869190614a0d565b3480156103bd57600080fd5b506103d16103cc366004614a20565b610b39565b6040516001600160a01b039091168152602001610386565b3480156103f557600080fd5b50610409610404366004614a55565b610b60565b005b34801561041757600080fd5b50610409610426366004614a20565b610ca8565b34801561043757600080fd5b50610409610446366004614a20565b610d45565b34801561045757600080fd5b50610197546103d1906001600160a01b031681565b34801561047857600080fd5b50610409610487366004614a7f565b610e5e565b34801561049857600080fd5b506104bc6104a7366004614a20565b600090815260c9602052604090206001015490565b604051908152602001610386565b3480156104d657600080fd5b50610192546103d1906001600160a01b031681565b6104096104f9366004614a20565b610ed4565b34801561050a57600080fd5b50610409610519366004614a20565b610fda565b34801561052a57600080fd5b50610409610539366004614abb565b61110a565b34801561054a57600080fd5b50610409610559366004614abb565b61112f565b34801561056a57600080fd5b50610409610579366004614ae7565b6111c7565b61040961058c366004614b32565b611364565b34801561059d57600080fd5b506104096114ba565b3480156105b257600080fd5b506104096105c1366004614a7f565b61152c565b3480156105d257600080fd5b506104096105e1366004614ae7565b611547565b6104096105f4366004614b87565b611607565b610409610607366004614c90565b6117fb565b34801561061857600080fd5b506104bc611985565b34801561062d57600080fd5b5061037a61063c366004614ae7565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0390811691161490565b61040961067c366004614a20565b611a4a565b34801561068d57600080fd5b5060fb5460ff1661037a565b6104096106a7366004614cde565b611c41565b3480156106b857600080fd5b506104096106c7366004614ae7565b611e36565b3480156106d857600080fd5b506103d16106e7366004614a20565b611ef6565b3480156106f857600080fd5b50610409610707366004614abb565b611f5c565b34801561071857600080fd5b50610409610727366004614a20565b61208f565b34801561073857600080fd5b506104bc6101935481565b34801561074f57600080fd5b50610409612133565b34801561076457600080fd5b506104bc610773366004614ae7565b6121cc565b34801561078457600080fd5b506104bc610793366004614a20565b6101946020526000908152604090205481565b3480156107b257600080fd5b50610409612266565b3480156107c757600080fd5b506104096107d6366004614a20565b6122d6565b3480156107e757600080fd5b506104096107f6366004614ae7565b612433565b34801561080757600080fd5b50610409610816366004614d63565b6124f3565b34801561082757600080fd5b5061037a610836366004614abb565b600091825260c9602090815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561086d57600080fd5b506103a46127d8565b34801561088257600080fd5b50610409610891366004614abb565b6127e7565b3480156108a257600080fd5b506104bc6108b1366004614b87565b6128da565b3480156108c257600080fd5b506104bc600081565b3480156108d757600080fd5b506104096108e6366004614df3565b612955565b3480156108f757600080fd5b506104bc610906366004614a20565b6101996020526000908152604090205481565b34801561092557600080fd5b50610409610934366004614e2f565b612967565b34801561094557600080fd5b506104bc610954366004614a20565b6101956020526000908152604090205481565b34801561097357600080fd5b506103a4610982366004614a20565b6129d8565b34801561099357600080fd5b506103d16109a2366004614a20565b61019a602052600090815260409020546001600160a01b031681565b3480156109ca57600080fd5b506104096109d9366004614abb565b612b30565b3480156109ea57600080fd5b506104bc6101915481565b348015610a0157600080fd5b5061037a610a10366004614e97565b6001600160a01b039182166000908152606a6020908152604080832093909416825291909152205460ff1690565b348015610a4a57600080fd5b506103d1610a59366004614a20565b610198602052600090815260409020546001600160a01b031681565b348015610a8157600080fd5b50610196546103d1906001600160a01b031681565b6000610aa182612b55565b92915050565b606060658054610ab690614ec1565b80601f0160208091040260200160405190810160405280929190818152602001828054610ae290614ec1565b8015610b2f5780601f10610b0457610100808354040283529160200191610b2f565b820191906000526020600020905b815481529060010190602001808311610b1257829003601f168201915b5050505050905090565b6000610b4482612c38565b506000908152606960205260409020546001600160a01b031690565b6000610b6b82612c9c565b9050806001600160a01b0316836001600160a01b031603610bf95760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e6560448201527f720000000000000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b806001600160a01b0316610c0b612d01565b6001600160a01b03161480610c275750610c2781610a10612d01565b610c995760405162461bcd60e51b815260206004820152603e60248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f7420746f60448201527f6b656e206f776e6572206e6f7220617070726f76656420666f7220616c6c00006064820152608401610bf0565b610ca38383612d10565b505050565b61019354600103610ce5576040517f40adbefd00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008181526101946020526040902054610258014211610d31576040517f4002db2900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600090815261019460205260409020429055565b6000610d4f612d01565b9050610d5a82612c9c565b6001600160a01b0316816001600160a01b031614158015610d965750600082815261019860205260409020546001600160a01b03828116911614155b15610dcd576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082815261019960205260408120549003610e15576040517fc993b99300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082815261019960205260408082208290555183916001600160a01b038416917f6181d4215ebc71e962cc193554c17f05a825da06230fdf9ece45081f09cb206f9190a35050565b600081815261019560205260409020548015801590610e8c5750600082815261019560205260409020544210155b15610ec3576040517f203d82d800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610ece848484612d8b565b50505050565b3360009081527f3092a9721ab951abc46661db103a5d03d04480b09446fa131eb59820635cf144602052604090205460ff16610f3c576040517feaa45d6a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000818152610195602052604081205490819003610f86576040517f7cb40a3900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610fa5610f9283612c9c565b610197546001600160a01b031684612e15565b610fb262278d0082614f43565b4210610fd657610fc562278d0042614f56565b600083815261019560205260409020555b5050565b3360009081527f75522faebd8252265a4c98687d4b5f5b6c3a71858d7f8312047425dcd4725046602052604090205460ff16611042576040517f5647892800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8047101561107c576040517f356680b700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610196546040516000916001600160a01b03169083908381818185875af1925050503d80600081146110ca576040519150601f19603f3d011682016040523d82523d6000602084013e6110cf565b606091505b5050905080610fd6576040517f3204506f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082815260c9602052604090206001015461112581613000565b610ca38383613011565b611137612d01565b6001600160a01b0316816001600160a01b0316146111bd5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610bf0565b610fd682826130b4565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036112655760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f64656c656761746563616c6c00000000000000000000000000000000000000006064820152608401610bf0565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166112c07f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b6001600160a01b03161461133c5760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f6163746976652070726f787900000000000000000000000000000000000000006064820152608401610bf0565b61134581613155565b60408051600080825260208201909252611361918391906131b7565b50565b610193546000036113a1576040517f516a601900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610192546001600160a01b031633146113e6576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6113ef85613357565b7fffffffffffffffffffffffffffffffff00000000000000000000000000000000851661141c85826134e3565b6000818152610195602090815260408083206301e1338042019055610198909152808220805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b038816179055517fffffffffffffffffffffffffffffffff00000000000000000000000000000000881691849186917fed994b8dfbd359de8b535931832fe533e23820fbb73ce69d8dde9bd677989f3991a4505050505050565b3360009081527fc99cfc74cbb51adc7ca8731c432a51a31a086a1789003f0b773be6e802362bf4602052604090205460ff16611522576040517f7c214f0400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61152a613646565b565b610ca383838360405180602001604052806000815250612967565b3360009081527f56eafcfe4e056e5ee1febf92b17728968883505f0e8dc799e4f43119d826ca85602052604090205460ff166115af576040517f7bfa4b9f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610197805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383169081179091556040517f79025dab199855650264c602de305dcf5c292b8e5b4470ef271724a79d0343f490600090a250565b6000611615858585856128da565b6101915490915034811115611656576040517f356680b700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008281526101946020526040812054908190036116a0576040517fb7b3378700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b603c81014210156116dd576040517fb7b3378700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7fffffffffffffffffffffffffffffffff00000000000000000000000000000000871661170a87826134e3565b60008481526101946020908152604080832083905583835261019582528083206301e13380420190556101989091529020805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b038716179055348381039084146117f057604051600090339083908381818185875af1925050503d80600081146117ae576040519150601f19603f3d011682016040523d82523d6000602084013e6117b3565b606091505b50509050806117ee576040517f3204506f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b505b505050505050505050565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036118995760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f64656c656761746563616c6c00000000000000000000000000000000000000006064820152608401610bf0565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166118f47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b6001600160a01b0316146119705760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f6163746976652070726f787900000000000000000000000000000000000000006064820152608401610bf0565b61197982613155565b610fd6828260016131b7565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614611a255760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610bf0565b507f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc90565b611a5261369e565b6101915434811115611a90576040517f356680b700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000828152610195602052604081205490819003611ada576040517f7cb40a3900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b62278d0081014210611b18576040517f566e239b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b80421015611b52576040517f28d4030000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b611b606301e1338042614f56565b60008481526101956020526040908190208290555184917fbf5b84fa6df1868d005e90d05ee12a6c49025be6f38d2807f183743676744c1691611ba591815260200190565b60405180910390a234828103908314610ece57604051600090339083908381818185875af1925050503d8060008114611bfa576040519150601f19603f3d011682016040523d82523d6000602084013e611bff565b606091505b5050905080611c3a576040517f3204506f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5050505050565b6000828152610195602052604081205490819003611c8b576040517f7cb40a3900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b62278d00810142811115611ccb576040517f2720243f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600080651f9465b8ab8e83420302905061019154611d04611cf4670c7d713b49da0000846136f1565b683635c9adc5dea0000090613722565b0191505080341015611d42576040517f356680b700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b611d55611d4e86612c9c565b8787612e15565b6000858152610195602090815260408083206301e13380420190556101989091529020805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b03861617905534818103908214611e2d57604051600090339083908381818185875af1925050503d8060008114611deb576040519150601f19603f3d011682016040523d82523d6000602084013e611df0565b606091505b5050905080611e2b576040517f3204506f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b505b50505050505050565b3360009081527f56eafcfe4e056e5ee1febf92b17728968883505f0e8dc799e4f43119d826ca85602052604090205460ff16611e9e576040517f7bfa4b9f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610196805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383169081179091556040517f646d70535c6b451b92021874a72abd441f122ba1c0b8f24d074352bd169fad3f90600090a250565b600081815261019560205260408120548015801590611f155750804210155b15611f4c576040517f203d82d800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b611f5583612c9c565b9392505050565b611f6461369e565b6001600160a01b038116611fa4576040517ff7eb744d00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082815261019860205260409020546001600160a01b0316611fc5612d01565b6001600160a01b031614612005576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008281526101996020908152604080832042905561019a9091529020805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b038316908117909155829061205682611ef6565b6001600160a01b03167ffab80e8bf242ed27bf595552dfdddbdd794f201d6dfcd8df7347f82f8e1f1f9b60405160405180910390a45050565b3360009081527f75522faebd8252265a4c98687d4b5f5b6c3a71858d7f8312047425dcd4725046602052604090205460ff166120f7576040517f5647892800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6101918190556040518181527ffba1d84f2e30311f1380f2355f294fbedd53264c2504378e2c4b2133dea166709060200160405180910390a150565b3360009081527f56eafcfe4e056e5ee1febf92b17728968883505f0e8dc799e4f43119d826ca85602052604090205460ff1661219b576040517f7bfa4b9f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006101938190556040517f03732e5295a5bd18e6ef95b03b41aa8bcadae292a7ef40468144c7a727dfa8b59190a1565b60006001600160a01b03821661224a5760405162461bcd60e51b815260206004820152602960248201527f4552433732313a2061646472657373207a65726f206973206e6f74206120766160448201527f6c6964206f776e657200000000000000000000000000000000000000000000006064820152608401610bf0565b506001600160a01b031660009081526068602052604090205490565b3360009081527fc99cfc74cbb51adc7ca8731c432a51a31a086a1789003f0b773be6e802362bf4602052604090205460ff166122ce576040517f7c214f0400000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61152a613737565b60008181526101956020526040902054421061231e576040517f203d82d800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600081815261019860205260409020546001600160a01b031661233f612d01565b6001600160a01b03161461237f576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008181526101996020526040812054908190036123c9576040517fc993b99300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6203f4808101421015612408576040517f22f607f600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610fd661241483611ef6565b600084815261019a60205260409020546001600160a01b031684612e15565b3360009081527f56eafcfe4e056e5ee1febf92b17728968883505f0e8dc799e4f43119d826ca85602052604090205460ff1661249b576040517f7bfa4b9f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610192805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383169081179091556040517f255ba3357fefe42b361c216b6e0bc5541f1e6ea4c6178d4a45ad8dd7ec28139d90600090a250565b600054610100900460ff16158080156125135750600054600160ff909116105b8061252d5750303b15801561252d575060005460ff166001145b61259f5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a65640000000000000000000000000000000000006064820152608401610bf0565b6000805460ff1916600117905580156125df57600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff166101001790555b61265287878080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525050604080516020601f8b01819004810282018101909252898152925089915088908190840183828082843760009201919091525061377592505050565b61265a6137fc565b612662613881565b61266a613881565b61267c6000612677612d01565b6138fe565b610196805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0385169081179091556040517f646d70535c6b451b92021874a72abd441f122ba1c0b8f24d074352bd169fad3f90600090a2610197805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0384169081179091556040517f79025dab199855650264c602de305dcf5c292b8e5b4470ef271724a79d0343f490600090a2662386f26fc100006101918190556040519081527ffba1d84f2e30311f1380f2355f294fbedd53264c2504378e2c4b2133dea166709060200160405180910390a16001610193558015611e2d57600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a150505050505050565b606060668054610ab690614ec1565b6127ef61369e565b6127f7612d01565b6001600160a01b031661280983611ef6565b6001600160a01b031614612849576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082815261019860209081526040808320805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b038616179055610199909152902054156128a057600082815261019960205260408120555b6040516001600160a01b0382169083907f8e700b803af43e14651431cd73c9fe7d11b131ad797576a70b893ce5766f65c390600090a35050565b60006128e585613357565b604080517fffffffffffffffffffffffffffffffff00000000000000000000000000000000871660208201526001600160a01b038087169282019290925290831660608201526080810184905260a001604051602081830303815290604052805190602001209050949350505050565b610fd6612960612d01565b8383613908565b6000828152610195602052604090205480158015906129955750600083815261019560205260409020544210155b156129cc576040517f203d82d800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b611c3a858585856139d6565b60606000826129e681613357565b600f5b8181601081106129fb576129fb614f69565b1a15612a0957809250612a12565b600019016129e9565b506000612a20836001614f56565b67ffffffffffffffff811115612a3857612a38614bd4565b6040519080825280601f01601f191660200182016040528015612a62576020820181803683370190505b50905060005b838111612ace57828160108110612a8157612a81614f69565b1a60f81b828281518110612a9757612a97614f69565b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600101612a68565b506040518060400160405280601b81526020017f687474703a2f2f7777772e6661726361737465722e78797a2f752f000000000081525081604051602001612b17929190614f98565b6040516020818303038152906040529350505050919050565b600082815260c96020526040902060010154612b4b81613000565b610ca383836130b4565b60007fffffffff0000000000000000000000000000000000000000000000000000000082167f80ac58cd000000000000000000000000000000000000000000000000000000001480612be857507fffffffff0000000000000000000000000000000000000000000000000000000082167f5b5e139f00000000000000000000000000000000000000000000000000000000145b80610aa157507f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff00000000000000000000000000000000000000000000000000000000831614610aa1565b6000818152606760205260409020546001600160a01b03166113615760405162461bcd60e51b815260206004820152601860248201527f4552433732313a20696e76616c696420746f6b656e20494400000000000000006044820152606401610bf0565b6000818152606760205260408120546001600160a01b031680610aa15760405162461bcd60e51b815260206004820152601860248201527f4552433732313a20696e76616c696420746f6b656e20494400000000000000006044820152606401610bf0565b6000612d0b613a65565b905090565b6000818152606960205260409020805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0384169081179091558190612d5282612c9c565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b612d9c612d96612d01565b82613ac7565b612e0e5760405162461bcd60e51b815260206004820152602e60248201527f4552433732313a2063616c6c6572206973206e6f7420746f6b656e206f776e6560448201527f72206e6f7220617070726f7665640000000000000000000000000000000000006064820152608401610bf0565b610ca38383835b826001600160a01b0316612e2882612c9c565b6001600160a01b031614612ea45760405162461bcd60e51b815260206004820152602560248201527f4552433732313a207472616e736665722066726f6d20696e636f72726563742060448201527f6f776e65720000000000000000000000000000000000000000000000000000006064820152608401610bf0565b6001600160a01b038216612f1f5760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f2061646460448201527f72657373000000000000000000000000000000000000000000000000000000006064820152608401610bf0565b612f2a838383613b46565b612f35600082612d10565b6001600160a01b0383166000908152606860205260408120805460019290612f5e908490614f43565b90915550506001600160a01b0382166000908152606860205260408120805460019290612f8c908490614f56565b9091555050600081815260676020526040808220805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0386811691821790925591518493918716917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4610ca3838383613b4e565b6113618161300c612d01565b613ba2565b600082815260c9602090815260408083206001600160a01b038516845290915290205460ff16610fd657600082815260c9602090815260408083206001600160a01b03851684529091529020805460ff19166001179055613070612d01565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b600082815260c9602090815260408083206001600160a01b038516845290915290205460ff1615610fd657600082815260c9602090815260408083206001600160a01b03851684529091529020805460ff19169055613111612d01565b6001600160a01b0316816001600160a01b0316837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45050565b6131817fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775610836612d01565b611361576040517f7bfa4b9f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff16156131ea57610ca383613c22565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015613244575060408051601f3d908101601f1916820190925261324191810190614fef565b60015b6132b65760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201527f6f6e206973206e6f7420555550530000000000000000000000000000000000006064820152608401610bf0565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc811461334b5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f7860448201527f6961626c655555494400000000000000000000000000000000000000000000006064820152608401610bf0565b50610ca3838383613ced565b6010600082811a602d03613397576040517f430f13b300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60005b82811015610ece5760008482601081106133b6576133b6614f69565b6001909301921a905082156134055760ff811615613400576040517f430f13b300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6134dd565b60618160ff161015801561341d5750607a8160ff1611155b15613428575061339a565b60308160ff1610158015613440575060398160ff1611155b1561344b575061339a565b8060ff16602d0361345c575061339a565b8060ff166000036134ab57816001036134a1576040517f430f13b300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600192505061339a565b6040517f430f13b300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5061339a565b6001600160a01b0382166135395760405162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f20616464726573736044820152606401610bf0565b6000818152606760205260409020546001600160a01b03161561359e5760405162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e746564000000006044820152606401610bf0565b6135aa60008383613b46565b6001600160a01b03821660009081526068602052604081208054600192906135d3908490614f56565b9091555050600081815260676020526040808220805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b03861690811790915590518392907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a4610fd660008383613b4e565b61364e613d12565b60fb805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa613681612d01565b6040516001600160a01b03909116815260200160405180910390a1565b60fb5460ff161561152a5760405162461bcd60e51b815260206004820152601060248201527f5061757361626c653a20706175736564000000000000000000000000000000006044820152606401610bf0565b6000611f55670de0b6b3a76400008361370986613d64565b6137139190615008565b61371d91906150c4565b613f8e565b6000611f558383670de0b6b3a76400006141b3565b61373f61369e565b60fb805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258613681612d01565b600054610100900460ff166137f25760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610bf0565b610fd682826141d2565b600054610100900460ff166138795760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610bf0565b61152a614268565b600054610100900460ff1661152a5760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610bf0565b610fd68282613011565b816001600160a01b0316836001600160a01b0316036139695760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c6572000000000000006044820152606401610bf0565b6001600160a01b038381166000818152606a6020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6139e76139e1612d01565b83613ac7565b613a595760405162461bcd60e51b815260206004820152602e60248201527f4552433732313a2063616c6c6572206973206e6f7420746f6b656e206f776e6560448201527f72206e6f7220617070726f7665640000000000000000000000000000000000006064820152608401610bf0565b610ece848484846142f1565b60007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03163303613ac257507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec36013560601c90565b503390565b600080613ad383612c9c565b9050806001600160a01b0316846001600160a01b03161480613b1a57506001600160a01b038082166000908152606a602090815260408083209388168352929052205460ff165b80613b3e5750836001600160a01b0316613b3384610b39565b6001600160a01b0316145b949350505050565b610ca361369e565b6000818152610199602052604090205415613b7457600081815261019960205260408120555b600090815261019860205260409020805473ffffffffffffffffffffffffffffffffffffffff191690555050565b600082815260c9602090815260408083206001600160a01b038516845290915290205460ff16610fd657613be0816001600160a01b0316601461437a565b613beb83602061437a565b604051602001613bfc929190615135565b60408051601f198184030181529082905262461bcd60e51b8252610bf091600401614a0d565b6001600160a01b0381163b613c9f5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e7472616374000000000000000000000000000000000000006064820152608401610bf0565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b613cf6836145a3565b600082511180613d035750805b15610ca357610ece83836145e3565b60fb5460ff1661152a5760405162461bcd60e51b815260206004820152601460248201527f5061757361626c653a206e6f74207061757365640000000000000000000000006044820152606401610bf0565b6000808213613db55760405162461bcd60e51b815260206004820152600960248201527f554e444546494e454400000000000000000000000000000000000000000000006044820152606401610bf0565b60006060613dc2846146ee565b03609f8181039490941b90931c6c465772b2bbbb5f824b15207a3081018102606090811d6d0388eaa27412d5aca026815d636e018202811d6d0df99ac502031bf953eff472fdcc018202811d6d13cdffb29d51d99322bdff5f2211018202811d6d0a0f742023def783a307a986912e018202811d6d01920d8043ca89b5239253284e42018202811d6c0b7a86d7375468fac667a0a527016c29508e458543d8aa4df2abee7883018302821d6d0139601a2efabe717e604cbb4894018302821d6d02247f7a7b6594320649aa03aba1018302821d7fffffffffffffffffffffffffffffffffffffff73c0c716a594e00d54e3c4cbc9018302821d7ffffffffffffffffffffffffffffffffffffffdc7b88c420e53a9890533129f6f01830290911d7fffffffffffffffffffffffffffffffffffffff465fda27eb4d63ded474e5f832019091027ffffffffffffffff5f6af8f7b3396644f18e157960000000000000000000000000105711340daa0d5f769dba1915cef59f0815a5506027d0267a36c0c95b3975ab3ee5b203a7614a3f75373f047d803ae7b6687f2b393909302929092017d57115e47018c7177eebf7cd370a3356a1b7863008a5ae8028c72b88642840160ae1d92915050565b60007ffffffffffffffffffffffffffffffffffffffffffffffffdb731c958f34d94c18213613fbf57506000919050565b680755bf798b4a1bf1e582126140175760405162461bcd60e51b815260206004820152600c60248201527f4558505f4f564552464c4f5700000000000000000000000000000000000000006044820152606401610bf0565b6503782dace9d9604e83901b059150600060606bb17217f7d1cf79abc9e3b39884821b056b80000000000000000000000001901d6bb17217f7d1cf79abc9e3b39881029093037fffffffffffffffffffffffffffffffffffffffdbf3ccf1604d263450f02a550481018102606090811d6d0277594991cfc85f6e2461837cd9018202811d7fffffffffffffffffffffffffffffffffffffe5adedaa1cb095af9e4da10e363c018202811d6db1bbb201f443cf962f1a1d3db4a5018202811d7ffffffffffffffffffffffffffffffffffffd38dc772608b0ae56cce01296c0eb018202811d6e05180bb14799ab47a8a8cb2a527d57016d02d16720577bd19bf614176fe9ea6c10fe68e7fd37d0007b713f765084018402831d9081019084017ffffffffffffffffffffffffffffffffffffffe2c69812cf03b0763fd454a8f7e010290911d6e0587f503bb6ea29d25fcb7401964500190910279d835ebba824c98fb31b83b2ca45c000000000000000000000000010574029d9dc38563c32e5c2f6dc192ee70ef65f9978af30260c3939093039290921c92915050565b8282028115158415858304851417166141cb57600080fd5b0492915050565b600054610100900460ff1661424f5760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610bf0565b606561425b8382615204565b506066610ca38282615204565b600054610100900460ff166142e55760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610bf0565b60fb805460ff19169055565b6142fc848484612e15565b614308848484846147aa565b610ece5760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610bf0565b606060006143898360026152c4565b614394906002614f56565b67ffffffffffffffff8111156143ac576143ac614bd4565b6040519080825280601f01601f1916602001820160405280156143d6576020820181803683370190505b5090507f30000000000000000000000000000000000000000000000000000000000000008160008151811061440d5761440d614f69565b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053507f78000000000000000000000000000000000000000000000000000000000000008160018151811061447057614470614f69565b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a90535060006144ac8460026152c4565b6144b7906001614f56565b90505b6001811115614554577f303132333435363738396162636465660000000000000000000000000000000085600f16601081106144f8576144f8614f69565b1a60f81b82828151811061450e5761450e614f69565b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a90535060049490941c9361454d816152e3565b90506144ba565b508315611f555760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610bf0565b6145ac81613c22565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b6146625760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610bf0565b600080846001600160a01b03168460405161467d91906152fa565b600060405180830381855af49150503d80600081146146b8576040519150601f19603f3d011682016040523d82523d6000602084013e6146bd565b606091505b50915091506146e5828260405180606001604052806027815260200161537060279139614939565b95945050505050565b600080821161473f5760405162461bcd60e51b815260206004820152600960248201527f554e444546494e454400000000000000000000000000000000000000000000006044820152606401610bf0565b5060016fffffffffffffffffffffffffffffffff821160071b82811c67ffffffffffffffff1060061b1782811c63ffffffff1060051b1782811c61ffff1060041b1782811c60ff10600390811b90911783811c600f1060021b1783811c909110821b1791821c111790565b60006001600160a01b0384163b1561492e57836001600160a01b031663150b7a026147d3612d01565b8786866040518563ffffffff1660e01b81526004016147f59493929190615316565b6020604051808303816000875af1925050508015614830575060408051601f3d908101601f1916820190925261482d91810190615352565b60015b6148e3573d80801561485e576040519150601f19603f3d011682016040523d82523d6000602084013e614863565b606091505b5080516000036148db5760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610bf0565b805181602001fd5b7fffffffff00000000000000000000000000000000000000000000000000000000167f150b7a0200000000000000000000000000000000000000000000000000000000149050613b3e565b506001949350505050565b60608315614948575081611f55565b8251156149585782518084602001fd5b8160405162461bcd60e51b8152600401610bf09190614a0d565b7fffffffff000000000000000000000000000000000000000000000000000000008116811461136157600080fd5b6000602082840312156149b257600080fd5b8135611f5581614972565b60005b838110156149d85781810151838201526020016149c0565b50506000910152565b600081518084526149f98160208601602086016149bd565b601f01601f19169290920160200192915050565b602081526000611f5560208301846149e1565b600060208284031215614a3257600080fd5b5035919050565b80356001600160a01b0381168114614a5057600080fd5b919050565b60008060408385031215614a6857600080fd5b614a7183614a39565b946020939093013593505050565b600080600060608486031215614a9457600080fd5b614a9d84614a39565b9250614aab60208501614a39565b9150604084013590509250925092565b60008060408385031215614ace57600080fd5b82359150614ade60208401614a39565b90509250929050565b600060208284031215614af957600080fd5b611f5582614a39565b80357fffffffffffffffffffffffffffffffff0000000000000000000000000000000081168114614a5057600080fd5b600080600080600060a08688031215614b4a57600080fd5b614b5386614b02565b9450614b6160208701614a39565b9350614b6f60408701614a39565b94979396509394606081013594506080013592915050565b60008060008060808587031215614b9d57600080fd5b614ba685614b02565b9350614bb460208601614a39565b925060408501359150614bc960608601614a39565b905092959194509250565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f830112614c1457600080fd5b813567ffffffffffffffff80821115614c2f57614c2f614bd4565b604051601f8301601f19908116603f01168101908282118183101715614c5757614c57614bd4565b81604052838152866020858801011115614c7057600080fd5b836020870160208301376000602085830101528094505050505092915050565b60008060408385031215614ca357600080fd5b614cac83614a39565b9150602083013567ffffffffffffffff811115614cc857600080fd5b614cd485828601614c03565b9150509250929050565b600080600060608486031215614cf357600080fd5b614cfc84614a39565b925060208401359150614d1160408501614a39565b90509250925092565b60008083601f840112614d2c57600080fd5b50813567ffffffffffffffff811115614d4457600080fd5b602083019150836020828501011115614d5c57600080fd5b9250929050565b60008060008060008060808789031215614d7c57600080fd5b863567ffffffffffffffff80821115614d9457600080fd5b614da08a838b01614d1a565b90985096506020890135915080821115614db957600080fd5b50614dc689828a01614d1a565b9095509350614dd9905060408801614a39565b9150614de760608801614a39565b90509295509295509295565b60008060408385031215614e0657600080fd5b614e0f83614a39565b915060208301358015158114614e2457600080fd5b809150509250929050565b60008060008060808587031215614e4557600080fd5b614e4e85614a39565b9350614e5c60208601614a39565b925060408501359150606085013567ffffffffffffffff811115614e7f57600080fd5b614e8b87828801614c03565b91505092959194509250565b60008060408385031215614eaa57600080fd5b614eb383614a39565b9150614ade60208401614a39565b600181811c90821680614ed557607f821691505b602082108103614f0e577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b81810381811115610aa157610aa1614f14565b80820180821115610aa157610aa1614f14565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60008351614faa8184602088016149bd565b835190830190614fbe8183602088016149bd565b7f2e6a736f6e0000000000000000000000000000000000000000000000000000009101908152600501949350505050565b60006020828403121561500157600080fd5b5051919050565b60007f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff60008413600084138583048511828216161561504957615049614f14565b7f8000000000000000000000000000000000000000000000000000000000000000600087128682058812818416161561508457615084614f14565b600087129250878205871284841616156150a0576150a0614f14565b878505871281841616156150b6576150b6614f14565b505050929093029392505050565b6000826150fa577f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b60001983147f80000000000000000000000000000000000000000000000000000000000000008314161561513057615130614f14565b500590565b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081526000835161516d8160178501602088016149bd565b7f206973206d697373696e6720726f6c652000000000000000000000000000000060179184019182015283516151aa8160288401602088016149bd565b01602801949350505050565b601f821115610ca357600081815260208120601f850160051c810160208610156151dd5750805b601f850160051c820191505b818110156151fc578281556001016151e9565b505050505050565b815167ffffffffffffffff81111561521e5761521e614bd4565b6152328161522c8454614ec1565b846151b6565b602080601f831160018114615267576000841561524f5750858301515b600019600386901b1c1916600185901b1785556151fc565b600085815260208120601f198616915b8281101561529657888601518255948401946001909101908401615277565b50858210156152b45787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b60008160001904831182151516156152de576152de614f14565b500290565b6000816152f2576152f2614f14565b506000190190565b6000825161530c8184602087016149bd565b9190910192915050565b60006001600160a01b0380871683528086166020840152508360408301526080606083015261534860808301846149e1565b9695505050505050565b60006020828403121561536457600080fd5b8151611f558161497256fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201bc50654aaa9327b0743f4153b73854ff6461884d1531dac408b1bf6f5f44c7164736f6c634300081000330000000000000000000000007a95fa73250dc53556d264522150a940d4c50238',
} as const;
