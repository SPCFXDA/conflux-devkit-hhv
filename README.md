# Conflux DevKit HardHat Ignition Viem

## Description

This project extends Hardhat's viem sample project with Hardhat Ignition for Conflux eSpace and js-conflux-sdk for Conflux Core.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)

## Installation

To install the package, use npm:

```bash
npm install
```

Adittionaly to enable hardhat cli completion use the following command:

```
hardhat-completion install
```

follow the instruction and select `bash` and `y`, to reload the shell, write `bash` in the terminal.

## Usage

### Local Chain

The system will auto generate 5 privatekeys, if you want to add your development private keys to the system use the following command before starting the node:

```
hh vars set DEPLOYER_PRIVATE_KEY
```

to start the development node you can use the following command:

```bash
hh node
```

This will start the local Conflux node and fund the genesis accounts on core, to have funds also on the eSpace evm you can run the following command:

```
devkit --espace-genesis
```

The `devkit` utility is available, for more details, refer to the [Conflux Devkit README](https://github.com/SPCFXDA/conflux-devkit/blob/main/README.md).

Once the accounts are funded and the chain is running, you can invoke the deployment examples with the following commands:

### Deploy to eSpace

```bash
hh ignition deploy ./ignition/modules/LockModule.ts --network confluxESpaceLocal
```

This will use [LockModule.ts](/ignition/modules/LockModule.ts) with Ignition to deploy the contract on the local eSpace.

### Deploy to Core

```bash
hh run scripts/LockDeploy_Core.ts --network confluxCoreLocal
```

This will use [LockDeploy_Core.ts](/scripts/LockDeploy_Core.ts) with js-conflux-sdk to deploy on the local Core.
