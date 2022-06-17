import BasicSimulator from '~/simulator/basicSimulator';
import ChaosSimulator from '~/simulator/chaosSimulator';
import SplitBrainAltSimulator from '~/simulator/splitBrainAltSimulator';
import SplitBrainSimulator from '~/simulator/splitBrainSimulator';
import { generatePublicPrivateKeys } from '~/utils';

const instanceNames = ['alice', 'bob'];

const runSimulations = async () => {
  const publicPrivateKeys = await generatePublicPrivateKeys(instanceNames);

  const basicSim = new BasicSimulator(publicPrivateKeys, instanceNames);
  await basicSim.run();

  const chaosSim = new ChaosSimulator(publicPrivateKeys, instanceNames);
  await chaosSim.run();

  const splitSim = new SplitBrainSimulator(publicPrivateKeys, instanceNames);
  await splitSim.run();

  const splitAltSim = new SplitBrainAltSimulator(publicPrivateKeys, instanceNames);
  await splitAltSim.run();
};

runSimulations();
