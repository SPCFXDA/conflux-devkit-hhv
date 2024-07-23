import { task, vars } from "hardhat/config";
import type { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ignition-viem";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-toolbox-viem";

import { SetupTask, Start } from "devkit";


task("node", "Start the local Conflux development node").setAction(async () => {
  await new Start().run({ logs: true });
});


export class HardHatSetup extends SetupTask {
  generateSecrets() {
    if (this.secretExist()) {
      this.secrets = this.readSecrets();
      return;
    }
    if(vars.has("DEPLOYER_PRIVATE_KEY") ) {
      this.secrets.push(vars.get("DEPLOYER_PRIVATE_KEY"));
    }
    // Generate 5 random accounts and store their private keys (without '0x' prefix) in the secrets array
    for (let i = 0; i < 5; i++) {
      const randomAccount = this.randomAccount();
      this.secrets.push(randomAccount.privateKey);
    }
    this.writeSecrets();
  }
  getSecrets() {
    this.generateSecrets();
    return this.secrets;
  }
}

let deployerPrivateKey: string[] = new HardHatSetup().getSecrets();

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      confluxESpaceTestnet: "<api-key>",
      confluxESpace: "<api-key>",
    },
    customChains: [
      {
        network: "confluxESpace",
        chainId: 1030,
        urls: {
          apiURL: 'https://evmapi.confluxscan.net',
          browserURL: 'https://evm.confluxscan.io/',
        }
      },
      {
        network: "confluxESpaceTestnet",
        chainId: 71,
        urls: {
          apiURL: 'https://evmapi-testnet.confluxscan.io/api/',
          browserURL: 'https://evmtestnet.confluxscan.io/',
        },
      }
    ]
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    confluxCoreLocal: {
      url: "http://localhost:12537",
      accounts: deployerPrivateKey,
    },
    confluxCoreTestnet: {
      url: "https://test.confluxrpc.com",
      accounts: deployerPrivateKey,
    },
    confluxCore: {
      url: "https://main.confluxrpc.com",
      accounts: deployerPrivateKey,
    },
    confluxESpaceLocal: {
      url: "http://localhost:8545",
      accounts: deployerPrivateKey,
    },
    confluxESpaceTestnet: {
      url: "https://evmtestnet.confluxrpc.com",
      accounts: deployerPrivateKey,
    },
    confluxESpace: {
      url: "https://evm.confluxrpc.com",
      accounts: deployerPrivateKey,
    },
  },
};

export default config;
