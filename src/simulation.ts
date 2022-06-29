import Client from '~/client';
import BasicSimulator from '~/simulator/basicSimulator';
import ChaosSimulator from '~/simulator/chaosSimulator';
import SplitBrainAltSimulator from '~/simulator/splitBrainAltSimulator';
import SplitBrainSimulator from '~/simulator/splitBrainSimulator';
import { generateEd25519KeyPair } from '~/utils';

const instanceNames = ['alice', 'bob'];
const clients = new Map<string, Client>();

const runSimulations = async () => {
  for (const name of instanceNames) {
    const keyPair = await generateEd25519KeyPair();
    clients.set(name, new Client(name, keyPair.privateKey, keyPair.publicKey));
  }

  const basicSim = new BasicSimulator(clients);
  await basicSim.run();

  const chaosSim = new ChaosSimulator(clients);
  await chaosSim.run();

  const splitSim = new SplitBrainSimulator(clients);
  await splitSim.run();

  const splitAltSim = new SplitBrainAltSimulator(clients);
  await splitAltSim.run();
};

runSimulations();
