import { getInsecureClient } from ".";

test("Client can be constructed", async () => {
  const client = getInsecureClient("127.0.0.1:0");
  expect(client).toBeTruthy();
});

test("Reports more helpful error if address unspecified", async () => {
  expect(() => getInsecureClient("")).toThrow(new Error("Hub address not specified"));
});
