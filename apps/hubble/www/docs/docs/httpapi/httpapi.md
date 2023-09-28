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

## Response encoding
Responses from the API are encoded as `application/json`, and can be parsed as normal JSON objects. 

1. Hashes, ETH addresses, signers etc... are all encoded as hex strings starting with `0x`
2. Signatures and other binary fields are encoded in base64
3. Constants are encoded as their string types. For example, the `hashScheme` is encoded as `HASH_SCHEME_BLAKE3` which is equivalent to the `HASH_SCHEME_BLAKE3 = 1` from the protobuf schema.

## Timestamps
Messages contain a timestamp, which is the _Farcaster Epoch Timestamp_ (and not the Unix Epoch). 

## Paging
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

## Handling Errors
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
## CORS
You can set a custom CORS header in the HTTP server by using the `--http-cors-origin` parameter when running your Hubble instance. Setting this to `*` will allow requests from any origin.

## Limitations
The HTTP API currently does not support any of the Sync APIs that are available in the gRPC vesion. When Hubs sync with each other, they will use the gRPC APIs instead of the HTTP APIs. 