import BasicSimulator from '~/simulator/basicSimulator';
import ChaosSimulator from '~/simulator/chaosSimulator';
import SplitBrainAltSimulator from '~/simulator/splitBrainAltSimulator';
import SplitBrainSimulator from '~/simulator/splitBrainSimulator';

const runSimulations = async () => {
  const basicSim = new BasicSimulator();
  await basicSim.run();

  const chaosSim = new ChaosSimulator();
  await chaosSim.run();

  const splitSim = new SplitBrainSimulator();
  await splitSim.run();

  const partAltSim = new SplitBrainAltSimulator();
  await partAltSim.run();
};

runSimulations();
