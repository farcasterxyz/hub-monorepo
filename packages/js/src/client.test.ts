import { Client } from './client';

// TODO: mock grpc server

test('Client can be constructed', () => {
  const client = new Client(`127.0.0.1:0`);
  expect(client).toBeTruthy();
});
