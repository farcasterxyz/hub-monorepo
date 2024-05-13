import { Factories, FarcasterNetwork, Message } from "@farcaster/core";
import axios from "axios";

async function submitMessage() {
  const server = "https://nemes.farcaster.xyz:2281";
  const url = `${server}/v1/submitMessage`;

  // If you're using a username and password, you can use the following:
  const auth = { username: "username", password: "password" };

  // The FID of the user who is submitting the message
  const fid = 2;

  // The signer of the message. This is used to sign the message, and can be obtained by creating
  // an on-chain signer on behalf of the user.
  // TODO: Replace with your own signer
  const signer = Factories.Ed25519Signer.build();

  const postConfig = {
    headers: { "Content-Type": "application/octet-stream" },
    auth,
  };

  // Create a castAdd message
  const castAdd = await Factories.CastAddMessage.create(
    {
      data: { fid, network: FarcasterNetwork.MAINNET, castAddBody: { text: "Hello, world!" } },
    },
    { transient: { signer } },
  );

  // Encode the message into a Buffer (of bytes)
  const messageBytes = Buffer.from(Message.encode(castAdd).finish());

  try {
    const response = await axios.post(url, messageBytes, postConfig);
  } catch (e) {
    // handle errors
    console.error("Error submitting message: ", e.response.data);
  }
}

submitMessage().then(() => console.log("Done!"));
