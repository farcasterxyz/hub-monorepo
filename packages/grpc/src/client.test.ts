import { Client } from './client';

let client: Client;

beforeAll(async () => {
  client = new Client(`127.0.0.1:0`);
});

afterAll(async () => {
  client.close();
});

test('succeeds', () => {
  expect(client).toBeInstanceOf(Client);
});
