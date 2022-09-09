import { AddressInfo } from 'net';
import { CastRemove, CastShort, EthereumSigner, IDRegistryEvent, MessageSigner, ReactionAdd, SignerAdd } from '~/types';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';
import { RPCServer, RPCClient } from '~/network/rpc';
import CastSet from '~/sets/castSet';
import Engine from '~/engine';
import Faker from 'faker';

const aliceFid = Faker.datatype.number();

let engine: Engine;
let aliceCustodySigner: EthereumSigner;
let aliceCustodyRegister: IDRegistryEvent;
let aliceDelegateSigner: MessageSigner;
let cast: CastShort;
let reaction: ReactionAdd;
let remove: CastRemove;
let addDelegateSigner: SignerAdd;

let server: RPCServer;
let client: RPCClient;

const populate = async (engine: Engine) => {
  const results = await Promise.all([
    engine.mergeMessage(cast),
    engine.mergeMessage(reaction),
    engine.mergeMessage(remove),
  ]);
  results.forEach((value) => {
    expect(value.isOk()).toBeTruthy();
  });
};

describe('rpc', () => {
  beforeAll(async () => {
    // setup the rpc server and client
    engine = new Engine();
    server = new RPCServer(engine);
    await server.start();
    const address = server.address;
    expect(address).not.toBeNull();
    client = new RPCClient(server.address as AddressInfo);

    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();

    // setup alices prereqs
    const createParams = {
      data: { fid: aliceFid },
    };
    const createOptions = {
      transient: { signer: aliceDelegateSigner },
    };
    cast = await Factories.CastShort.create(createParams, createOptions);
    reaction = await Factories.ReactionAdd.create(createParams, createOptions);
    remove = await Factories.CastRemove.create(createParams, createOptions);

    addDelegateSigner = await Factories.SignerAdd.create(createParams, {
      transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner },
    });
  });

  beforeEach(async () => {
    engine._reset();
    await engine.mergeIDRegistryEvent(aliceCustodyRegister);
    await engine.mergeMessage(addDelegateSigner);
  });

  afterAll(async () => {
    await server.stop();
  });

  test('simple test for an empty set', async () => {
    const response = await client.getAllCastsForFid(aliceFid);
    expect(response.isOk()).toBeTruthy();
    expect(response._unsafeUnwrap()).toEqual(new Set([]));
  });

  test('get a cast set with adds and removes in it', async () => {
    await populate(engine);
    const response = await client.getAllCastsForFid(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const set = new Set([cast, remove]);
    expect(response._unsafeUnwrap()).toEqual(set);
  });

  test('get all Fids', async () => {
    await populate(engine);
    const response = await client.getFids();
    expect(response.isOk()).toBeTruthy();
    expect(response._unsafeUnwrap()).toEqual(new Set([aliceFid]));
  });

  test('get all signers for FID', async () => {
    const response = await client.getAllSignerMessagesForFid(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const aliceSignerMessages = response._unsafeUnwrap();
    expect(aliceSignerMessages).toEqual(new Set([addDelegateSigner]));
  });
});
