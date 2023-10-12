

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

## Using with Rust, Go or other programing languages
Messages need to be signed with a ED25519 signer belonging to the FID. If you are using a different programming language than Typescript, you can manually construct the `MessageData` object and serialize it to the `data_bytes` field of the message. Then, use the `data_bytes` to compute the `hash` and `signature`. Please see the [`rust-submitmessage` example](https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-web/examples) for more details


```rust
use ed25519_dalek::{SecretKey, Signer, SigningKey};
use hex::FromHex;
use reqwest::Client;

use message::{CastAddBody, FarcasterNetwork, MessageData};
use protobuf::Message;


#[tokio::main]
async fn main() {
    let fid = 6833; // FID of the user submitting the message
    let network = FarcasterNetwork::FARCASTER_NETWORK_MAINNET;

    // Construct the cast add message
    let mut cast_add = CastAddBody::new();
    cast_add.set_text("Welcome to Rust!".to_string());

    // Construct the cast add message data object
    let mut msg_data = MessageData::new();
    msg_data.set_field_type(message::MessageType::MESSAGE_TYPE_CAST_ADD);
    msg_data.set_fid(fid);    
    msg_data.set_timestamp(
        (std::time::SystemTime::now()
            .duration_since(FARCASTER_EPOCH)
            .unwrap()
            .as_secs()) as u32,
    );
    msg_data.set_network(network);
    msg_data.set_cast_add_body(cast_add);

    let msg_data_bytes = msg_data.write_to_bytes().unwrap();
    
    // Calculate the blake3 hash, trucated to 20 bytes
    let hash = blake3::hash(&msg_data_bytes).as_bytes()[0..20].to_vec();

    // Construct the actual message
    let mut msg = message::Message::new();
    msg.set_hash_scheme(message::HashScheme::HASH_SCHEME_BLAKE3);
    msg.set_hash(hash);

    // Sign the message. You need to use a signing key that corresponds to the FID you are adding.
    // REPLACE THE PRIVATE KEY WITH YOUR OWN
    let private_key = SigningKey::from_bytes(
        &SecretKey::from_hex("0x...").expect("Please provide a valid private key"),
    );
    let signature = private_key.sign(&msg_data_bytes).to_bytes();

    msg.set_signature_scheme(message::SignatureScheme::SIGNATURE_SCHEME_ED25519);
    msg.set_signature(signature.to_vec());
    msg.set_signer(private_key.verifying_key().to_bytes().to_vec());

    // Serialize the message
    msg.set_data_bytes(msg_data_bytes.to_vec());
    let msg_bytes = msg.write_to_bytes().unwrap();

    // Finally, submit the message to the network

    // Create a reqwest Client
    let client = Client::new();

    // Define your endpoint URL
    let url = "http://127.0.0.1:2281/v1/submitMessage";

    // Make the POST request
    let res = client
        .post(url)
        .header("Content-Type", "application/octet-stream")
        .body(msg_bytes)
        .send()
        .await
        .unwrap();

    // Check if it's success
    if res.status().is_success() {
        println!("Successfully sent the message.");
    } else {
        println!("Failed to send the message. HTTP status: {}", res.status());
    }
}

```