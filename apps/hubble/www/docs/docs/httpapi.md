# HTTP API
Hubble serves a HTTP API on port 2281 by default. 

## Using the API
The API can be called from any programing language or browser by making a normal HTTP request. 

**View the API responses in a browser**

Simply open the URL in a browser 
```url
http://127.0.0.1:2281/v1/castsByFid?fid=2
```

**Call the API using curl**
```bash
curl http://127.0.0.1:2281/v1/castsByFid?fid=2
```

**Call the API via Javascript, using the axios library**
```Javascript
import axios from "axios";

const fid = 2;
const server = "http://127.0.0.1:2281";

try {
    const response = await axios.get(`${server}/v1/castsByFid?fid=${fid}`);

    console.log(`API Returned HTTP status ${response.status}`);    
    console.log(`First Cast's text is ${response.messages[0].data.castAddBody.text}`);
} catch (e) {
    // Handle errors
    console.log(response);
}
```

### Response encoding
Responses from the API are encoded as `application/json`, and can be parsed as normal JSON objects. 

1. Hashes, ETH addresses, signers etc... are all encoded as hex strings starting with `0x`
2. Signatures and other binary fields are encoded in base64
3. Constants are encoded as their string types. For example, the `hashScheme` is encoded as `HASH_SCHEME_BLAKE3` which is equivalent to the `HASH_SCHEME_BLAKE3 = 1` from the protobuf schema.

### Timestamps
Messages contain a timestamp, which is the _Farcaster Epoch Timestamp_ (and not the Unix Epoch). 

### Paging
Most endpoints support paging to get a large number of responses. 

**Pagination Query Parameters**

| Parameter | Description | Example |
| --------- | ----------- | ------- |
| pageSize | Maximum number of messages to return in a single response | `pageSize=100` |
| reverse | Reverse the sort order, returning latest messages first | `reverse=1` |
| pageToken | The page token returned by the previous query, to fetch the next page. If this parameters is empty, fetch the first page | `pageToken=AuzO1V0Dta...fStlynsGWT` |

The returned `nextPageToken` is empty if there are no more pages to return. 

Pagination query parameters can be combined with other query parameters supported by the endpoint. For example, `/v1/casts?fid=2&pageSize=3`.

**Example**

Fetch all casts by FID `2`, fetching upto 3 casts per Page

```bash
# Fetch first page
http://127.0.0.1:2281/v1/castsByFid?fid=2&pageSize=3 

# Fetch next page. The pageToken is from the previous response(`response.nextPageToken`)
http://127.0.0.1:2281/v1/castsByFid?fid=2&pageSize=3&pageToken=AuzO1V0DtaItCwwa10X6YsfStlynsGWT
```

**Javascript Example**
```Javascript
import axios from "axios";

const fid = 2;
const server = "http://127.0.0.1:2281";

let nextPageToken = "";
do {
    const response = await axios.get(`${server}/v1/castsByFid?fid=${fid}&pageSize=100&nextPageToken=${nextPageToken}`);
    // Process response....
    nextPageToken = response.nextPageToken;
} while (nextPageToken !== "")
```

### Handling Errors
If there's an API error, the HTTP status code is set to `400` or `500` as appropriate. The response is a JSON object with `detail`, `errCode` and `metadata` fields set to identify and debug the errors.

**Example**
```bash
$ curl "http://127.0.0.1:2281/v1/castById?fid=invalid"
{
  "errCode": "bad_request.validation_failure",
  "presentable": false,
  "name": "HubError",
  "code": 3,
  "details": "fid must be an integer",
  "metadata": {
    "errcode": [
      "bad_request.validation_failure",
    ],
  },
}
```

## Casts API

### castById
Get a cast by its FID and Hash. 

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the cast's creator | `fid=6833` |
| hash      | The cast's hash | `hash=0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/castById?id=2&hash=0xd2b1ddc6c88e865a33cb1a565e0058d757042974
```


**Response**
```json
{
  "data": {
    "type": "MESSAGE_TYPE_CAST_ADD",
    "fid": 2,
    "timestamp": 48994466,
    "network": "FARCASTER_NETWORK_MAINNET",
    "castAddBody": {
      "embedsDeprecated": [],
      "mentions": [],
      "parentCastId": {
        "fid": 226,
        "hash": "0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9"
      },
      "text": "Cast Text",
      "mentionsPositions": [],
      "embeds": []
    }
  },
  "hash": "0xd2b1ddc6c88e865a33cb1a565e0058d757042974",
  "hashScheme": "HASH_SCHEME_BLAKE3",
  "signature": "3msLXzxB4eEYe...dHrY1vkxcPAA==",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x78ff9a...58c"
}
```

### castsByFid
Fetch all casts for authored by an FID. 


**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the cast's creator | `fid=6833` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/castsByFid?fid=2
```

**Response**

```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_CAST_ADD",
        "fid": 2,
        "timestamp": 48994466,
        "network": "FARCASTER_NETWORK_MAINNET",
        "castAddBody": {... },
          "text": "Cast Text",
          "mentionsPositions": [],
          "embeds": []
        }
      },
      "hash": "0xd2b1ddc6c88e865a33cb1a565e0058d757042974",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "3msLXzxB4eEYeF0Le...dHrY1vkxcPAA==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x78ff9a768cf1...2eca647b6d62558c"
    }
  ]
  "nextPageToken": ""
}
```

### castsByParent
Fetch all casts by parent cast's FID and Hash OR by the parent's URL

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the parent cast | `fid=6833` |
| hash      | The parent cast's hash | `hash=0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9` |
| url       | The URL of the parent cast | `url=chain://eip155:1/erc721:0x39d89b649ffa044383333d297e325d42d31329b2` |

**Note**
You can use either `?fid=...&hash=...` OR `?url=...` to query this endpoint

**Example**
```bash
curl http://127.0.0.1:2281/v1/castsByParent?fid=226&hash=0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_CAST_ADD",
        "fid": 226,
        "timestamp": 48989255,
        "network": "FARCASTER_NETWORK_MAINNET",
        "castAddBody": {
          "embedsDeprecated": [],
          "mentions": [],
          "parentCastId": {
            "fid": 226,
            "hash": "0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9"
          },
          "text": "Cast's Text",
          "mentionsPositions": [],
          "embeds": []
        }
      },
      "hash": "0x0e501b359f88dcbcddac50a8f189260a9d02ad34",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "MjKnOQCTW42K8+A...tRbJfia2JJBg==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x6f1e8758...7f04a3b500ba"
    },
  ],
  "nextPageToken": ""
}
```


### castsByMention
Fetch all casts that mention an FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID that is mentioned in a cast | `fid=6833` |

**Note**
Use the `mentionsPositions` to extract the offset in the cast text where the FID was mentioned

**Example**
```bash
curl http://127.0.0.1:2281/v1/castsByMention?fid=6833
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_CAST_ADD",
        "fid": 2,
        "timestamp": 62298143,
        "network": "FARCASTER_NETWORK_MAINNET",
        "castAddBody": {
          "embedsDeprecated": [],
          "mentions": [15, 6833],
          "parentCastId": {
            "fid": 2,
            "hash": "0xd5540928cd3daf2758e501a61663427e41dcc09a"
          },
          "text": "cc  and ",
          "mentionsPositions": [3, 8],
          "embeds": []
        }
      },
      "hash": "0xc6d4607835197a8ee225e9218d41e38aafb12076",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "TOaWrSTmz+cyzPMFGvF...OeUznB0Ag==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x78ff9a768c...647b6d62558c"
    },
  ],
  "nextPageToken": ""
}
```

## Reactions API

The Reactions API will accept the following values (either the string representation or the numerical value) for the `reaction_type` field. 

| String | Numerical value | Description |
| ------ | --------------- | ----------- |
| REACTION_TYPE_LIKE | 1 | Like the target cast |
| REACTION_TYPE_RECAST | 2 |  Share target cast to the user's audience |

### reactionById
Get a reaction by its created FID and target Cast.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the reaction's creator | `fid=6833` |
| target_fid | The FID of the cast's creator | `target_fid=2` |
| target_hash      | The cast's hash | `target_hash=0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9` |
| reaction_type | The type of reaction, either as a numerical enum value or string representation | `reaction_type=1` OR `reaction_type=REACTION_TYPE_LIKE` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/reactionById?fid=2&reaction_type=1&target_fid=1795&target_hash=0x7363f449bfb0e7f01c5a1cc0054768ed5146abc0
```


**Response**
```json
{
  "data": {
    "type": "MESSAGE_TYPE_REACTION_ADD",
    "fid": 2,
    "timestamp": 72752656,
    "network": "FARCASTER_NETWORK_MAINNET",
    "reactionBody": {
      "type": "REACTION_TYPE_LIKE",
      "targetCastId": {
        "fid": 1795,
        "hash": "0x7363f449bfb0e7f01c5a1cc0054768ed5146abc0"
      }
    }
  },
  "hash": "0x9fc9c51f6ea3acb84184efa88ba4f02e7d161766",
  "hashScheme": "HASH_SCHEME_BLAKE3",
  "signature": "F2OzKsn6Wj...gtyORbyCQ==",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x78ff9a7...647b6d62558c"
}
```


### reactionsByFid
Get all reactions by an FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the reaction's creator | `fid=6833` |
| reaction_type | The type of reaction, either as a numerical enum value or string representation | `reaction_type=1` OR `reaction_type=REACTION_TYPE_LIKE` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/reactionsByFid?fid=2&reaction_type=1
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_REACTION_ADD",
        "fid": 2,
        "timestamp": 72752656,
        "network": "FARCASTER_NETWORK_MAINNET",
        "reactionBody": {
          "type": "REACTION_TYPE_LIKE",
          "targetCastId": {
            "fid": 1795,
            "hash": "0x7363f449bfb0e7f01c5a1cc0054768ed5146abc0"
          }
        }
      },
      "hash": "0x9fc9c51f6ea3acb84184efa88ba4f02e7d161766",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "F2OzKsn6WjP8MTw...hqUbrAvp6mggtyORbyCQ==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x78ff9a768...62558c"
    },
  ],
  "nextPageToken": ""
}
```


### reactionsByCast
Get all reactions to a cast

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| target_fid       | The FID of the cast's creator | `fid=6833` |
| target_hash | The hash of the cast | `target_hash=`0x7363f449bfb0e7f01c5a1cc0054768ed5146abc0` |
| reaction_type | The type of reaction, either as a numerical enum value or string representation | `reaction_type=1` OR `reaction_type=REACTION_TYPE_LIKE` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/reactionsByCast?fid=2&reaction_type=1
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_REACTION_ADD",
        "fid": 426,
        "timestamp": 72750141,
        "network": "FARCASTER_NETWORK_MAINNET",
        "reactionBody": {
          "type": "REACTION_TYPE_LIKE",
          "targetCastId": {
            "fid": 1795,
            "hash": "0x7363f449bfb0e7f01c5a1cc0054768ed5146abc0"
          }
        }
      },
      "hash": "0x7662fba1be3166fc75acc0914a7b0e53468d5e7a",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "tmAUEYlt/+...R7IO3CA==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x13dd2...204e57bc2a"
    },
  ],
  "nextPageToken": ""
}
```


### reactionsByTarget
Get all reactions to cast's target URL

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| url |	The URL of the parent cast	| url=chain://eip155:1/erc721:0x39d89b649ffa044383333d297e325d42d31329b2 |
| reaction_type | The type of reaction, either as a numerical enum value or string representation | `reaction_type=1` OR `reaction_type=REACTION_TYPE_LIKE` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/reactionsByTarget?url=chain://eip155:1/erc721:0x39d89b649ffa044383333d297e325d42d31329b2
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_REACTION_ADD",
        "fid": 1134,
        "timestamp": 79752856,
        "network": "FARCASTER_NETWORK_MAINNET",
        "reactionBody": {
          "type": "REACTION_TYPE_LIKE",
          "targetUrl": "chain://eip155:1/erc721:0x39d89b649ffa044383333d297e325d42d31329b2"
        }
      },
      "hash": "0x94a0309cf11a07b95ace71c62837a8e61f17adfd",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "+f/+M...0Uqzd0Ag==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0xf6...3769198d4c"
    },
  ],
  "nextPageToken": ""
}
```



## Links API

The Links API will accept the following values for the `link_type` field. 

| String |  Description |
| ------ |  ----------- |
| follow | Follow from FID to Target FID |

### linkById
Get a link by its FID and target FID.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the link's originator | `fid=6833` |
| target_fid | The FID of the target of the link | `target_fid=2` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linkById?fid=6833&target_fid=2&link_type=follow
```


**Response**
```json
{
  "data": {
    "type": "MESSAGE_TYPE_LINK_ADD",
    "fid": 6833,
    "timestamp": 61144470,
    "network": "FARCASTER_NETWORK_MAINNET",
    "linkBody": {
      "type": "follow",
      "targetFid": 2
    }
  },
  "hash": "0x58c23eaf4f6e597bf3af44303a041afe9732971b",
  "hashScheme": "HASH_SCHEME_BLAKE3",
  "signature": "sMypYEMqSyY...nfCA==",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x0852c07b56...06e999cdd"
}
```


### linksByFid
Get all links from a source FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the reaction's creator | `fid=6833` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linksByFid?fid=6833
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_LINK_ADD",
        "fid": 6833,
        "timestamp": 61144470,
        "network": "FARCASTER_NETWORK_MAINNET",
        "linkBody": {
          "type": "follow",
          "targetFid": 83
        }
      },
      "hash": "0x094e35891519c0e04791a6ba4d2eb63d17462f02",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "qYsfX08mS...McYq6IYMl+ECw==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x0852c0...a06e999cdd"
    },
  ],
  "nextPageToken": ""
}
```

### linksByTargetFid
Get all links to a target FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| target_fid       | The FID of the reaction's creator | `fid=6833` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linksByTargetFid?target_fid=6833
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_LINK_ADD",
        "fid": 302,
        "timestamp": 61144668,
        "network": "FARCASTER_NETWORK_MAINNET",
        "linkBody": {
          "type": "follow",
          "targetFid": 6833
        }
      },
      "hash": "0x78c62531d96088f640ffe7e62088b49749efe286",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "frIZJGIizv...qQd9QJyCg==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x59a04...6860ddfab"
    },
  ],
  "nextPageToken": ""
}
```



## UserData API

The UserData API will accept the following values for the `user_data_type` field. 

| String | Numerical value | Description |
| ------ | --------------- | ----------- |
| USER_DATA_TYPE_PFP | 1 |  Profile Picture for the user |
|  USER_DATA_TYPE_DISPLAY | 2 |  Display Name for the user |
|  USER_DATA_TYPE_BIO | 3 |  Bio for the user |
|  USER_DATA_TYPE_URL | 5 |  URL of the user |
|  USER_DATA_TYPE_USERNAME | 6 |  Preferred Name for the user |


### userdataByFid
Get UserData for a FID.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID that's being requested | `fid=6833` |
| user_data_type | The type of user data, either as a numerical value or type string. If this is ommited, all user data for the FID is returned| `user_data_type=1` OR `user_data_type=USER_DATA_TYPE_DISPLAY` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/userdataByFid?fid=6833&user_data_type=1
```


**Response**
```json
{
  "data": {
    "type": "MESSAGE_TYPE_USER_DATA_ADD",
    "fid": 6833,
    "timestamp": 83433831,
    "network": "FARCASTER_NETWORK_MAINNET",
    "userDataBody": {
      "type": "USER_DATA_TYPE_PFP",
      "value": "https://i.imgur.com/HG54Hq6.png"
    }
  },
  "hash": "0x327b8f47218c369ae01cc453cc23efc79f10181f",
  "hashScheme": "HASH_SCHEME_BLAKE3",
  "signature": "XITQZD7q...LdAlJ9Cg==",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x0852...6e999cdd"
}
```

## Storage Limits API


### storagelimitsByFid
Get an FID's storage limits.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID that's being requested | `fid=6833` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/storagelimitsByFid?fid=6833
```


**Response**
```json
{
  "limits": [
    {
      "storeType": "STORE_TYPE_CASTS",
      "limit": 10000
    },
    {
      "storeType": "STORE_TYPE_LINKS",
      "limit": 5000
    },
    {
      "storeType": "STORE_TYPE_REACTIONS",
      "limit": 5000
    },
    {
      "storeType": "STORE_TYPE_USER_DATA",
      "limit": 100
    },
    {
      "storeType": "STORE_TYPE_USERNAME_PROOFS",
      "limit": 10
    },
    {
      "storeType": "STORE_TYPE_VERIFICATIONS",
      "limit": 50
    }
  ]
}
```



## Username Proofs API


### usernameproofByName
Get an proof for a username by the Farcaster username

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| name       | The Farcaster username or ENS address  | `name=adityapk` OR `name=dwr.eth` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/usernameproofByName?name=adityapk
```


**Response**
```json
{
  "timestamp": 1670603245,
  "name": "YWRpdHlhcGs=",
  "owner": "Oi7uUaECifDm+larm+rzl3qQhcM=",
  "signature": "fo5OhBP/ud...3IoJdhs=",
  "fid": 6833,
  "type": "USERNAME_TYPE_FNAME"
}
```


### usernameproofsByFid
Get a list of proofs provided by an FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid | The FID being requested | fid=2 |


**Example**
```bash
curl http://127.0.0.1:2281/v1/usernameproofsByFid?fid=2
```


**Response**
```json
{
  "proofs": [
    {
      "timestamp": 1623910393,
      "name": "dg==",
      "owner": "0x4114e33eb831858649ea3702e1c9a2db3f626446",
      "signature": "bANBae+Ub...kr3Bik4xs=",
      "fid": 2,
      "type": "USERNAME_TYPE_FNAME"
    },
    {
      "timestamp": 1690329118,
      "name": "dmFydW5zcmluLmV0aA==",
      "owner": "0x182327170fc284caaa5b1bc3e3878233f529d741",
      "signature": "zCEszPt...zqxTiFqVBs=",
      "fid": 2,
      "type": "USERNAME_TYPE_ENS_L1"
    }
  ]
}
```


## Verifications API


### verificationsByFid
Get a list of verifications provided by an FID 

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid | The FID being requested | fid=2 |


**Example**
```bash
curl http://127.0.0.1:2281/v1/verificationsByFid?fid=2
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS",
        "fid": 2,
        "timestamp": 73244540,
        "network": "FARCASTER_NETWORK_MAINNET",
        "verificationAddEthAddressBody": {
          "address": "0x91031dcfdea024b4d51e775486111d2b2a715871",
          "ethSignature": "tyxj1...x1cYzhyxw=",
          "blockHash": "0xd74860c4bbf574d5ad60f03a478a30f990e05ac723e138a5c860cdb3095f4296"
        }
      },
      "hash": "0xa505331746ec8c5110a94bdb098cd964e43a8f2b",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "bln1zIZM.../4riB9IVBQ==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x78ff9...b6d62558c"
    },
  ],
  "nextPageToken": ""
}
```
