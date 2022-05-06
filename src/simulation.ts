import BasicSimulator from '~/simulator/basicSimulator';
import ChaosSimulator from '~/simulator/chaosSimulator';

const runSimulations = async () => {
  const basicSim = new BasicSimulator();
  await basicSim.run(20_000);

  const chaosSim = new ChaosSimulator();
  await chaosSim.run(100_000);
};

runSimulations();
