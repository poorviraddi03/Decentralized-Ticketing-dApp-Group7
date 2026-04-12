// hardhat.config.js
// Task 4: Integration — Hardhat configuration
// Supports local Hardhat network and Polygon Amoy Testnet

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load from .env — see .env.example for required keys
const PRIVATE_KEY     = process.env.PRIVATE_KEY     || "0x" + "0".repeat(64);
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  // Use project root as Hardhat root so sources can live in ../contracts.
  paths: {
    root: "..",
    sources: "./contracts",
    tests: "./Integration/test",
    cache: "./Integration/cache",
    artifacts: "./Integration/artifacts",
    scripts: "./Integration/scripts",
  },

  networks: {
    // Default local node — run: npx hardhat node
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Polygon Amoy Testnet
    // Get test POL at https://faucet.polygon.technology/
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
      gasPrice: 30_000_000_000, // 30 gwei
    },
  },

  // Polygonscan verification
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL:     "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
