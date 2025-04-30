/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      chainId: 10,
      forking: {
        url: "https://mainnet.optimism.io",
      },
    },
  },
};
