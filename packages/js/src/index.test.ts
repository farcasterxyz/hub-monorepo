import { getClient } from '.';

test('Client can be constructed', async () => {
  const client = await getClient('127.0.0.1:0');
  expect(client).toBeTruthy();
});
