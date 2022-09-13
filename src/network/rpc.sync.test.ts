import { AddressInfo } from 'net';
import { populateEngine } from '~/engine/engine.mock.test';
import { Result } from 'neverthrow';
import { RPCServer, RPCClient } from '~/network/rpc';
import Engine from '~/engine';

const serverEngine = new Engine();

let server: RPCServer;
let client: RPCClient;

const NUM_USERS = 5;

describe('rpcSync', () => {
  beforeAll(async () => {
    // setup the rpc server and client
    server = new RPCServer(serverEngine);
    await server.start();
    const address = server.address;
    expect(address).not.toBeNull();
    client = new RPCClient(server.address as AddressInfo);

    await populateEngine(serverEngine, NUM_USERS);
  });

  afterAll(async () => {
    await server.stop();
  });

  test(
    'sync data from one engine to another ',
    async () => {
      const clientEngine = new Engine();

      // sanity test that the server has something in it
      const users = await serverEngine.getUsers();
      expect(users.size).toEqual(NUM_USERS);

      //
      // TODO this logic needs to live in the "Hub executable" when that exists
      // Sync logic
      // Get the list of all users from the server
      // Get all custody events and signer messages and merge them
      // Get all the messages from the other sets on the server
      // Merge all the messages
      //

      const result = await client.getUsers();
      expect(result.isOk()).toBeTruthy();
      const userIds = result._unsafeUnwrap();

      for (const user of userIds) {
        // get the signer messages first so we can prepare to ingest the remaining messages later
        let result: Result<any, string> = await client.getCustodyEventByUser(user);
        expect(result.isOk()).toBeTruthy();
        const custodyResult = await clientEngine.mergeIDRegistryEvent(result._unsafeUnwrap());
        expect(custodyResult.isOk()).toBeTruthy();
        // next, get all the signer messages
        result = await client.getAllSignerMessagesByUser(user);
        expect(result.isOk()).toBeTruthy();
        const signerResults = await Promise.all(clientEngine.mergeMessages([...result._unsafeUnwrap()]));
        signerResults.forEach((result) => {
          expect(result.isOk()).toBeTruthy();
        });

        // now collect all the messages from each set
        const responses = await Promise.all([
          client.getAllCastsByUser(user),
          client.getAllFollowsByUser(user),
          client.getAllReactionsByUser(user),
          client.getAllVerificationsByUser(user),
        ]);

        const messages = responses.flatMap((response) => {
          expect(response.isOk()).toBeTruthy();
          return response.match(
            (messages) => {
              return [...messages];
            },
            () => {
              return [];
            }
          );
        });

        // replay all messages into the client Engine
        const mergeResults = await Promise.all(clientEngine.mergeMessages(messages));
        mergeResults.forEach((result) => {
          expect(result.isOk()).toBeTruthy();
        });
      }

      // Finally compare the two Engines and make sure they're equal.
      await expect(clientEngine.getUsers()).resolves.toEqual(users);
      for (const user of userIds) {
        const casts = await serverEngine.getAllCastsByUser(user);
        await expect(clientEngine.getAllCastsByUser(user)).resolves.toEqual(casts);
        const follows = await serverEngine.getAllFollowsByUser(user);
        await expect(clientEngine.getAllFollowsByUser(user)).resolves.toEqual(follows);
        const reactions = await serverEngine.getAllReactionsByUser(user);
        await expect(clientEngine.getAllReactionsByUser(user)).resolves.toEqual(reactions);
        const verifications = await serverEngine.getAllVerificationsByUser(user);
        await expect(clientEngine.getAllVerificationsByUser(user)).resolves.toEqual(verifications);
      }
    },
    // Set a 2 minute timeout for this test
    2 * 60 * 1000
  );
});
