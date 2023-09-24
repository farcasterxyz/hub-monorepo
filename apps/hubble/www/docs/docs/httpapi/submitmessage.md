

# SubmitMessage API
The SubmitMessage API lets you submit signed Farcaster protocol messages to the Hub. Note that the message has to be sent as the encoded bytestream of the protobuf (`Message.enocde(msg).finish()` in typescript), as POST data to the endpoint. 

The encoding of the POST data has to be set to `application/octet-stream`. The endpoint returns the Message object as JSON if it was successfully submitted

## submitMessage
Submit a signed protobuf-serialized message to the Hub

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
|  | This endpoint accepts no parameters |  |


**Example**
```bash
curl -X POST "http://127.0.0.1:2281/v1/submitMessage" \
     -H "Content-Type: application/octet-stream" \
     --data-binary "@message.encoded.protobuf"

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

### Auth
If the rpc auth has been enabled on the server (using `--rpc-auth username:password`), you will need to also pass in the username and password while calling `submitMessage` using HTTP Basic Auth. 


**Example**
```bash
curl -X POST "http://127.0.0.1:2281/v1/submitMessage" \
     -u "username:password" \
     -H "Content-Type: application/octet-stream" \
     --data-binary "@message.encoded.protobuf"
```

**JS Example**
```Javascript
import axios from "axios";

const url = `http://127.0.0.1:2281/v1/submitMessage`;

const postConfig = {
    headers: { "Content-Type": "application/octet-stream" },
    auth: { username: "username", password: "password" },
};

// Encode the message into a Buffer (of bytes)
const messageBytes = Buffer.from(Message.encode(castAdd).finish());

try {
    const response = await axios.post(url, messageBytes, postConfig);
} catch (e) {
    // handle errors...
}
```