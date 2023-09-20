# HTTP API
Hubble serves a HTTP API on port 2281 by default. 

## Using the API
The API can be called from any programing language or browser by making a normal HTTP request. 

**Call the API using curl**
```bash
http://127.0.0.1:2281/v1/castsByFid?fid=2
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
      "bad_request.validation_failure"
    ]
  }
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

### castByFid
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
  ],
  "nextPageToken": ""
}
```

### castsByParent
Fetch all casts by parent cast's FID and Hash

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the parent cast | `fid=6833` |
| hash      | The parent cast's hash | `hash=0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9` |


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
