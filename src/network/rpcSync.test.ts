import { AddressInfo } from 'net';
import { RPCServer, RPCClient } from '~/network/rpc';
import Engine from '~/engine';
import { jestRocksDB } from '~/db/jestUtils';
import { populateEngine } from '~/engine/mock';

const serverDb = jestRocksDB('rpcSync.test.server');
const serverEngine = new Engine(serverDb);

const clientDb = jestRocksDB('rpcSync.test.client');
const clientEngine = new Engine(clientDb);

let server: RPCServer;
let client: RPCClient;

const NUM_USERS = 5;
const TEST_TIMEOUT = 2 * 60 * 1000; // 2 min timeout

describe('rpcSync', () => {
  beforeAll(async () => {
    // setup the rpc server and client
    server = new RPCServer(serverEngine);
    await server.start();
    expect(server.address).not.toBeNull();

    client = new RPCClient(server.address as AddressInfo);

    await populateEngine(serverEngine, NUM_USERS);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await server.stop();
  });

  test(
    'sync data from one engine to another ',
    async () => {
      // sanity test that the server has something in it
      const users = await serverEngine.getUsers();
      expect(users.size).toEqual(NUM_USERS);

      /**
       * TODO this logic needs to live in the "Hub executable" when that exists
       * Sync logic
       * Get the list of all users from the server
       * Get all custody events and signer messages and merge them
       * Get all the messages from the other sets on the server
       * Merge all the messages
       */

      const result = await client.getUsers();
      expect(result.isOk()).toBeTruthy();
      const userIds = result._unsafeUnwrap();

      for (const user of userIds) {
        // get the signer messages first so we can prepare to ingest the remaining messages later
        const custodyEventResult = await client.getCustodyEventByUser(user);
        expect(custodyEventResult.isOk()).toBeTruthy();
        const custodyResult = await clientEngine.mergeIDRegistryEvent(custodyEventResult._unsafeUnwrap());
        expect(custodyResult.isOk()).toBeTruthy();
        const signerMessagesResult = await client.getAllSignerMessagesByUser(user);
        expect(signerMessagesResult.isOk()).toBeTruthy();
        const signerResults = await Promise.all(clientEngine.mergeMessages([...signerMessagesResult._unsafeUnwrap()]));
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

        // collect all the messages for each Set into a single list of messages
        const allMessages = responses.flatMap((response) => {
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
        const mergeResults = await Promise.all(clientEngine.mergeMessages(allMessages));
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
    TEST_TIMEOUT
  );
});
