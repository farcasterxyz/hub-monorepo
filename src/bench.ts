import { Command } from 'commander';
import { RPCClient } from '~/network/rpc';
import { AddressInfo, isIP } from 'net';
import { generateUserInfo, getIDRegistryEvent, getSignerAdd, UserInfo } from '~/storage/engine/mock';
import Faker from 'faker';
import { IDRegistryEvent, Message, SignerAdd } from '~/types';
import { Factories } from '~/factories';
import { Result } from 'neverthrow';
import { sleep } from '~/utils';
import { JSONRPCError } from 'jayson/promise';
import { isIDRegistryEvent, isMessage } from '~/types/typeguards';

/**
 * Farcaster Benchmark Client
 *
 * This file provides a mechanism to benchmark and test a network of Farcaster Hubs
 *
 * When executed, it submits a series of events to the Hub network and measures the
 * time taken for each set of requests to be processed.
 *
 */

const post = (msg: string, start: number, stop: number) => {
  const delta = Number((stop - start) / 1000);
  const time = delta.toFixed(3);
  console.log(`Time ${time}s : ${msg}`);
  return delta;
};

const parseNumber = (string: string) => {
  const number = Number(string);
  if (isNaN(number)) throw new Error('Not a number.');
  return number;
};

const getCounts = (results: Result<any, any>[]): SubmitCounts => {
  const counts = results
    .map((r) => [Number(r.isOk()), Number(r.isErr())])
    .reduce((results, result) => {
      results[0] += result[0];
      results[1] += result[1];
      return results;
    });
  return {
    success: counts[0],
    fail: counts[1],
  };
};

type SubmitCounts = {
  success: number;
  fail: number;
};

const submitInBatches = async (messages: Message[] | IDRegistryEvent[]) => {
  // limits what we try to do in parallel. If this number is too large, we'll run out of sockets to use for tcp
  const BATCH_SIZE = 100;
  let results: Result<void, JSONRPCError>[] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const innerRes = await Promise.all(
      batch.map((message) => {
        if (isIDRegistryEvent(message)) {
          return client.submitIDRegistryEvent(message);
        }
        if (isMessage(message)) {
          return client.submitMessage(message);
        }
        throw Error('Trying to send invalid message');
      })
    );
    results = results.concat(innerRes);
  }
  return getCounts(results);
};

// Main
const app = new Command();
app
  .name('farcaster-benchmark-client')
  .description('Farcaster Benchmark')
  .version(process.env.npm_package_version ?? '1.0.0');

app
  .requiredOption('-A, --ip-address <address>', 'The IP address of a Hub to submit messages to')
  .requiredOption('-R, --rpc-port <port>', 'The RPC port of the Hub')
  .option('-U, --users <count>', 'The number of users to simulate', parseNumber, 100);

app.parse(process.argv);
const cliOptions = app.opts();
console.log(cliOptions, [...Array(cliOptions.users)].length, typeof cliOptions.users);
const family = isIP(cliOptions.ipAddress);
if (!family) throw new Error('Invalid Hub Address');

const address: AddressInfo = {
  address: cliOptions.ipAddress,
  port: cliOptions.rpcPort,
  family: family == 4 ? 'ip4' : 'ip6',
};
console.log(`Using RPC server: ${address.address}/${address.port}`);
const client = new RPCClient(address);

// generate users
console.log(`Generating IDRegistry events for ${cliOptions.users} users.`);
const firstUser = Faker.datatype.number();
const idRegistryEvents: IDRegistryEvent[] = [];
const signerAddEvents: SignerAdd[] = [];
let start = performance.now();
const userInfos: UserInfo[] = await Promise.all(
  [...Array(cliOptions.users)].map(async (_value, index) => {
    const info = await generateUserInfo(firstUser + index);
    idRegistryEvents.push(await getIDRegistryEvent(info));
    signerAddEvents.push(await getSignerAdd(info));
    return info;
  })
);
let stop = performance.now();
const accountTime = post(`Generated ${cliOptions.users} users. UserInfo has ${userInfos.length} items`, start, stop);

// submit users
start = performance.now();
const registryResults = await submitInBatches(idRegistryEvents);

stop = performance.now();
const idRegistryTime = post('IDRegistry Events submitted', start, stop);

console.log(`${registryResults.success} events submitted successfully. ${registryResults.fail} events failed.`);
console.log('_Waiting a few seconds for the network to synchronize_');
await sleep(10_000);

start = performance.now();
const signerResults = await submitInBatches(signerAddEvents);

stop = performance.now();
const signerAddsTime = post('Signers submitted', start, stop);

console.log(`${signerResults.success} signers submitted successfully. ${signerResults.fail} signers failed.`);

console.log('_Waiting a few seconds for the network to synchronize_');
await sleep(10_000);

// generate random data for each user
console.log(`Generating Casts for ${cliOptions.users} users`);
start = performance.now();
const casts = await Promise.all(
  userInfos.map((user) => {
    return Factories.CastShort.create({ data: { fid: user.fid } }, { transient: { signer: user.delegateSigner } });
  })
);
stop = performance.now();
const castTime = post('Generated 1 cast for each user', start, stop);

// submit data
start = performance.now();
const castResults = await submitInBatches(casts);
stop = performance.now();
post('Casts submitted', start, stop);

console.log(`${castResults.success} Casts submitted successfully. ${castResults.fail} Casts failed.`);

console.log('------------------------------------------');
console.log('Time \t\t\t\t Task');
console.log('------------------------------------------');
console.log(`${accountTime.toFixed(3)}s    \t\t\t Account generation time`);
console.log(`${idRegistryTime.toFixed(3)}s    \t\t\t IDRegistry Events`);
console.log(`${signerAddsTime.toFixed(3)}s    \t\t\t Signer Add Messages`);
console.log(`${castTime.toFixed(3)}s    \t\t\t Cast Messages`);
console.log(`Total: ${(accountTime + idRegistryTime + signerAddsTime + castTime).toFixed(3)}s`);
