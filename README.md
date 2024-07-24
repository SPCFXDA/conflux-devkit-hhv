# Conflux DevKit HardHat Ignition Viem

## Description

This project extends Hardhat's viem sample project with Hardhat Ignition for Conflux eSpace and js-conflux-sdk for Conflux Core.

## Table of Contents

- Installation
- Usage

## Installation

To install the package, use npm:

bash npm install 

Additionally, to enable Hardhat CLI completion, use the following command:

bash hardhat-completion install 

Follow the instructions and select bash and y. To reload the shell, write bash in the terminal.

## Usage

### Local Chain

The system will auto-generate 5 private keys. If you want to add your development private keys to the system, use the following command before starting the node:

```bash
hh vars set DEPLOYER_PRIVATE_KEY 
```
To start the development node, you can use the following command:

```bash
hh node 
```
This will start the local Conflux node and fund the genesis accounts on Core. Other available commands:

To stop the node:

```bash
hh node --stop 
```

To get the status:

```bash
hh node --status 
```

To get the balance of the configured keys:

```bash
hh balance 
```

To add funds to a specific address on the local node:

```bash
hh faucet 100 0x1231231231123 
```

The devkit utility is available. For more details, refer to the [Conflux Devkit README](https://github.com/SPCFXDA/conflux-devkit/blob/main/README.md).

Once the accounts are funded and the chain is running, you can invoke the deployment examples with the following commands:

### Deploy to eSpace

```bash
hh ignition deploy ./ignition/modules/LockModule.ts --network confluxESpaceLocal 
```
This will use LockModule.ts with Ignition to deploy the contract on the local eSpace.

### Deploy to Core

```bash
hh run scripts/LockDeploy_Core.ts --network confluxCoreLocal 
```

This will use LockDeploy_Core.ts with js-conflux-sdk to deploy on the local Core.