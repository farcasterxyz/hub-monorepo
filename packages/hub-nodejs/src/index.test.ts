import { getInsecureClient } from ".";

test("Client can be constructed", async () => {
  const client = getInsecureClient("127.0.0.1:0");
  expect(client).toBeTruthy();
});
