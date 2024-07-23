// loopNetworks.ts
import hre from "hardhat";

async function main() {
  const networks = hre.config.networks;
  const networkNames = Object.keys(networks).filter(
    (element) => element !== "hardhat" && element !== "localhost",
  );

  for (const networkName of networkNames) {
    console.log(networkName);
    console.log(networks[networkName].accounts);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// import {Task } from "devkit";

// import { readFileSync } from "fs"; // For file system operations
// import { formatEther, Address } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import hre from "hardhat";

// export class Balance extends Task {
//   async execute(options: any) {
//     // Validate the connection
//     const networks = hre.config.networks
//     Object(networks).forEach(element => {
//         console.log(element)
//       });

//     await this.status();

//     const client = this.viemClient();

//     // Read and process the genesis secrets file
//     const secrets: string = this.readSecrets();
//     // Split the secrets file into lines and process each line
//     secrets.split(/\r?\n/).forEach(async (line: string, index: number) => {
//       if (line.length) {
//         const coreAddress: string = this.conflux.wallet.addPrivateKey(
//           `0x${line}`,
//         ).address;
//         const eSpaceAddress: string = privateKeyToAccount(`0x${line}`).address;
//         const coreBalance: string = await this.getBalance(coreAddress);
//         const eSpaceBalance = formatEther(
//           await client.getBalance({ address: eSpaceAddress as Address }),
//         );
//         console.log(
//           "Account",
//           index,
//           "Core:",
//           coreBalance,
//           "eSpace:",
//           eSpaceBalance,
//         );
//       }
//     });
//     this.conflux.close();
//   }
// }

// new Balance().run({});
