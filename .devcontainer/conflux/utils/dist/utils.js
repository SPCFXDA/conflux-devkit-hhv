"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genesisList = genesisList;
exports.faucet = faucet;
exports.genesisToeSpace = genesisToeSpace;
exports.genesisSecrets = genesisSecrets;
exports.balance = balance;
exports.status = status;
exports.start = start;
exports.stop = stop;
exports.logs = logs;
exports.stderr = stderr;
// Import required modules
const toml_1 = require("@iarna/toml"); // For parsing TOML files
const fs_1 = require("fs"); // For file system operations
const js_conflux_sdk_1 = require("js-conflux-sdk"); // Conflux SDK for blockchain interactions
const path = require("path"); // For handling and transforming file paths
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const util_1 = require("util");
const tail_file_1 = __importDefault(require("@logdna/tail-file"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const exec = (0, util_1.promisify)(require("child_process").exec);
// Define paths and RPC host from environment variables or default values
const configPath = process.env.CONFIG_PATH || "/opt/conflux/develop.toml";
const configString = (0, fs_1.readFileSync)(configPath, "utf-8");
const config = (0, toml_1.parse)(configString);
function initConflux() {
    return new js_conflux_sdk_1.Conflux({
        url: `http://localhost:${config.jsonrpc_http_port}`,
        networkId: config.chain_id,
    });
}
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}
function getBalance(conflux, address) {
    return __awaiter(this, void 0, void 0, function* () {
        return new js_conflux_sdk_1.Drip(yield conflux.cfx.getBalance(address)).toCFX();
    });
}
// Main function to list genesis accounts
function genesisList() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize Conflux instance with RPC URL and network ID from config
            const conflux = initConflux();
            // Read and process the genesis secrets file
            const secrets = (0, fs_1.readFileSync)(config.genesis_secrets, "utf-8");
            // Split the secrets file into lines and process each
            let i = 0;
            secrets.split(/\r?\n/).forEach((privateKey) => {
                if (privateKey.length) {
                    try {
                        // Add the private key to Conflux wallet
                        const account = conflux.wallet.addPrivateKey(`0x${privateKey}`);
                        // Generate eSpace address from the private key
                        const eSpaceAddress = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`).address;
                        // Log account details
                        console.group(`\n######  ACCOUNT ${i}  ######`);
                        console.warn(`Private Key`.padEnd(14), `: 0x${privateKey}`);
                        console.log(`Core Address`.padEnd(14), `: ${account.address}`);
                        console.log(`eSpace Address`.padEnd(14), `: ${eSpaceAddress}`);
                        console.groupEnd();
                        i++;
                    }
                    catch (error) {
                        console.error(`Failed to process private key ${privateKey}:`, error.message);
                    }
                }
            });
            conflux.close();
        }
        catch (error) {
            // Handle errors
            console.error("An error occurred:", error.message);
            process.exit(1);
        }
    });
}
// Main function to handle the faucet logic
function faucet(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const secretPath = process.env.MINER_PATH || "/opt/conflux/mining_secret.txt";
        try {
            // Read secret and config files
            const secretString = (0, fs_1.readFileSync)(secretPath, "utf-8");
            // Initialize Conflux instance with RPC URL and network ID from config
            const conflux = initConflux();
            // Validate the connection
            yield conflux.cfx.getStatus();
            console.log("Connected to Conflux node");
            // Add miner private key to Conflux wallet and get balance
            const miner = conflux.wallet.addPrivateKey(secretString);
            const balance = yield getBalance(conflux, miner.address);
            console.log(`Faucet balance is ${balance} CFX`);
            // Exit if no arguments are provided
            if (options.length !== 2) {
                console.warn("Please provide the request amount and destination address (faucet <amount> <address>).");
                return;
            }
            // Retrieve request amount and destination address from arguments
            const requestAmount = options[0];
            const destinationAddress = options[1];
            // Check if the request amount is numeric
            if (!isNumeric(requestAmount)) {
                console.error("Requested amount is not a valid number.");
                return;
            }
            // Check if the request amount exceeds the faucet balance
            if (parseFloat(requestAmount) >= parseFloat(balance)) {
                console.error("Requested amount exceeds faucet balance.");
                return;
            }
            // Check if the destination address is a valid Conflux address
            if (js_conflux_sdk_1.address.isValidCfxAddress(destinationAddress)) {
                // Send transaction to the Conflux address
                yield conflux.cfx.sendTransaction({
                    from: miner.address,
                    to: destinationAddress,
                    value: js_conflux_sdk_1.Drip.fromCFX(parseFloat(requestAmount)),
                });
                console.log(`${requestAmount} CFX successfully sent to ${destinationAddress}`);
                return;
            }
            // Check if the destination address is a valid Ethereum address
            if ((0, viem_1.isAddress)(destinationAddress)) {
                // Initialize CrossSpaceCall internal contract for cross-space transactions
                const crossSpaceCall = conflux.InternalContract("CrossSpaceCall");
                // Function to handle cross-space call transactions
                function crossSpaceCallFx(eSpaceAddress, amount) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const receipt = yield crossSpaceCall
                            .transferEVM(eSpaceAddress)
                            .sendTransaction({
                            from: miner,
                            value: js_conflux_sdk_1.Drip.fromCFX(amount),
                        })
                            .executed();
                        // Check transaction outcome status
                        if (receipt.outcomeStatus === 0) {
                            console.log(`${amount} CFX successfully sent to ${eSpaceAddress}`);
                        }
                        else {
                            console.error(`Transfer to ${eSpaceAddress} failed.`);
                        }
                    });
                }
                // Execute cross-space call
                yield crossSpaceCallFx(destinationAddress, requestAmount);
                return;
            }
            // Log error if the destination address is invalid
            console.error("Invalid destination address.");
            conflux.close();
        }
        catch (error) {
            // Handle connection error
            if (error.errno === -111) {
                console.warn(`Failed to connect to ${error.address}:${error.port}. Have you started the local node with 'devkit --start' command?`);
            }
            else {
                console.error("An error occurred:", error.message);
            }
            process.exit(1);
        }
    });
}
function genesisToeSpace(amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize Conflux instance with RPC URL and network ID from config
            const conflux = initConflux();
            // Validate the connection
            yield conflux.cfx.getStatus();
            console.log("Connected to Conflux node");
            // Initialize CrossSpaceCall internal contract for cross-space transactions
            const crossSpaceCall = conflux.InternalContract("CrossSpaceCall");
            // Async function to handle cross-space call transactions
            function crossSpaceCallFx(privateKey) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Add account to Conflux wallet using the private key
                        const account = conflux.wallet.addPrivateKey(`0x${privateKey}`);
                        // Generate eSpace address from the private key
                        const balance = yield getBalance(conflux, account.address);
                        if (Number(balance) < Number(amount)) {
                            console.log("Insufficent balance");
                            return;
                        }
                        const eSpaceAddress = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`).address;
                        // Send transaction to transfer 1000 CFX to the eSpace address
                        const receipt = yield crossSpaceCall
                            .transferEVM(eSpaceAddress)
                            .sendTransaction({
                            from: account,
                            value: js_conflux_sdk_1.Drip.fromCFX(Number(amount)), // Transfer 1000 CFX
                        })
                            .executed();
                        // Log the result of the transaction
                        if (receipt.outcomeStatus === 0) {
                            console.log(`Transfer from ${account.address} to ${eSpaceAddress} succeeded`);
                        }
                        else {
                            console.error(`Transfer from ${account.address} to ${eSpaceAddress} failed`);
                        }
                    }
                    catch (error) {
                        console.error(`Failed to process private key ${privateKey}:`, error.message);
                    }
                });
            }
            // Read and process the genesis secrets file
            const secrets = (0, fs_1.readFileSync)(config.genesis_secrets, "utf-8");
            // Split the secrets file into lines and process each line
            secrets.split(/\r?\n/).forEach((line) => {
                if (line.length) {
                    crossSpaceCallFx(line);
                }
            });
            conflux.close();
        }
        catch (error) {
            // Handle errors
            if (error.errno === -111) {
                console.warn(`Failed to connect to ${error.address}:${error.port}. Have you started the local node with 'devkit --start' command?`);
            }
            else {
                console.error("An error occurred:", error.message);
            }
            process.exit(1);
        }
    });
}
function genesisSecrets(value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let valueInt;
            if (!isNumeric(value)) {
                console.error(`${value} is not a valid number.`);
                return;
            }
            else {
                valueInt = parseInt(value);
            }
            const genesisSecretsPath = config.genesis_secrets;
            const miningAccountPath = path.join(path.dirname(genesisSecretsPath), "mining_secret.txt");
            if ((0, fs_1.existsSync)(genesisSecretsPath)) {
                console.log(`The file ${genesisSecretsPath} already exists.`);
                return;
            }
            // Array to store generated private keys
            let secrets = [];
            // Generate 5 random accounts and store their private keys (without '0x' prefix) in the secrets array
            for (let i = 0; i < valueInt; i++) {
                const randomAccount = js_conflux_sdk_1.PrivateKeyAccount.random(
                // @ts-ignore
                undefined, config.chain_id);
                secrets.push(randomAccount.privateKey.replace("0x", ""));
            }
            // Append the generated secrets to the genesis secrets file
            (0, fs_1.appendFileSync)(genesisSecretsPath, secrets.join("\n") + "\n");
            console.log("Secrets generated and appended successfully!");
            // Check if mining account file exists, skip if it does
            if ((0, fs_1.existsSync)(miningAccountPath)) {
                console.log(`The file ${miningAccountPath} already exists. Skipping mining account creation.`);
                return;
            }
            // Generate a random mining account
            // @ts-ignore
            const miningAccount = js_conflux_sdk_1.PrivateKeyAccount.random(undefined, config.chain_id);
            // Update the configuration with the new mining account address
            config.mining_author = miningAccount.address;
            // Write the updated configuration back to the config file
            (0, fs_1.writeFileSync)(configPath, (0, toml_1.stringify)(config));
            console.log("Configuration file updated successfully!");
            // Write the mining account's private key to a separate file
            (0, fs_1.writeFileSync)(miningAccountPath, miningAccount.privateKey);
            console.log(`Mining account configured successfully! Private key saved to ${miningAccountPath}`);
        }
        catch (error) {
            console.error("An error occurred:", error.message);
            process.exit(1);
        }
    });
}
function viemClient() {
    const dev_node = (0, viem_1.defineChain)({
        id: 2030,
        name: "eSpace",
        nativeCurrency: {
            decimals: 18,
            name: "Conflux",
            symbol: "CFX",
        },
        rpcUrls: {
            default: {
                http: ["http://localhost:8545"],
                webSocket: ["wss://localhost:8546"],
            },
        },
    });
    return (0, viem_1.createPublicClient)({
        chain: dev_node,
        transport: (0, viem_1.http)(),
    });
}
// Main function to handle the balance logic
function balance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize Conflux instance with RPC URL and network ID from config
            const conflux = initConflux();
            // Validate the connection
            yield conflux.cfx.getStatus();
            console.log("Connected to Conflux node");
            const client = viemClient();
            // Read and process the genesis secrets file
            const secrets = (0, fs_1.readFileSync)(config.genesis_secrets, "utf-8");
            // Split the secrets file into lines and process each line
            secrets.split(/\r?\n/).forEach((line, index) => __awaiter(this, void 0, void 0, function* () {
                if (line.length) {
                    const coreAddress = conflux.wallet.addPrivateKey(`0x${line}`).address;
                    const eSpaceAddress = (0, accounts_1.privateKeyToAccount)(`0x${line}`).address;
                    const coreBalance = yield getBalance(conflux, coreAddress);
                    const eSpaceBalance = (0, viem_1.formatEther)(yield client.getBalance({ address: eSpaceAddress }));
                    console.log("Account", index, "Core:", coreBalance, "eSpace:", eSpaceBalance);
                }
            }));
            conflux.close();
        }
        catch (error) {
            console.error("An error occurred:", error.message);
            process.exit(1);
        }
    });
}
// Main function to handle the balance logic
function status() {
    return __awaiter(this, void 0, void 0, function* () {
        let msg = "";
        // Returns a Promise that resolves after "ms" Milliseconds
        const timer = (ms) => new Promise(res => setTimeout(res, ms));
        function checkStatus() {
            return __awaiter(this, void 0, void 0, function* () {
                for (var i = 1; i <= 5; i++) {
                    try {
                        // Initialize Conflux instance with RPC URL and network ID from config
                        const conflux = initConflux();
                        // Validate the connection
                        console.log(yield conflux.cfx.getStatus());
                        conflux.close();
                        return;
                    }
                    catch (error) {
                        // Handle errors
                        if (error.errno === -111) {
                            msg = `Failed to connect to ${error.address}:${error.port}. the node is not running or starting up...`;
                        }
                        else {
                            console.error("An error occurred:", error.message);
                            process.exit(1);
                        }
                    }
                    console.log(`[...]`);
                    yield timer(3000); // then the created Promise can be awaited
                }
                console.log(msg);
                process.exit(0);
            });
        }
        yield checkStatus();
    });
}
const execAsync = (0, util_1.promisify)(exec);
// get pid without 'ps' system utility
const getPidCmd = "ls -l /proc/*/exe 2>/dev/null | grep '/usr/bin/conflux' | awk '{print $9}' | cut -d'/' -f3";
const startNodeCmd = "ulimit -n 10000 && export RUST_BACKTRACE=1 && conflux --config $CONFIG_PATH 2> $CONFLUX_NODE_ROOT/log/stderr.txt& 1> /dev/null";
function execCmd(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        const execOut = yield execAsync(getPidCmd);
        const std = { out: execOut.stdout.trim(), err: execOut.stderr.trim() };
        if (std.err) {
            console.error(std.err);
            process.exit(1);
        }
        return std.out;
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 
            const pid = yield execCmd(getPidCmd);
            if (pid) {
                console.log(`Node is already running (PID: ${pid}), not starting again.`);
                return;
            }
            console.log("Node starting...");
            execAsync(startNodeCmd);
            console.log(`Node started with PID: ${yield execCmd(getPidCmd)}`);
            console.log("bootstrap...");
            yield status();
            console.log("Node started!");
        }
        catch (error) {
            console.error("An error occurred:", error.message);
            process.exit(1);
        }
    });
}
function stop() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pid;
            // Try to read the PID from the lock file
            pid = yield execCmd(getPidCmd);
            if (!pid) {
                console.log("PID not found, is the node running?");
                return;
            }
            console.log(`Found PID: ${pid}`);
            // Kill the process
            yield execAsync(`kill ${pid}`);
            console.log('Node stopped');
        }
        catch (error) {
            console.error("An error occurred:", error.message);
            process.exit(1);
        }
    });
}
function logs() {
    return __awaiter(this, void 0, void 0, function* () {
        const logConfigString = (0, fs_1.readFileSync)(process.env.CONFLUX_NODE_ROOT + "/log.yaml", "utf-8");
        const logConfig = js_yaml_1.default.load(logConfigString);
        let position; // Can be used to resume the last position from a new instance
        const tail = new tail_file_1.default(logConfig.appenders.logfile.path);
        process.on('SIGINT', () => {
            tail.quit()
                .then(() => {
                console.log(`The last read file position was: ${position}`);
            })
                .catch((err) => {
                process.nextTick(() => {
                    console.error('Error during TailFile shutdown', err);
                });
            });
        });
        tail
            .on('flush', ({ lastReadPosition }) => {
            position = lastReadPosition;
        })
            .on('data', (chunk) => {
            console.log(chunk.toString());
        })
            .start()
            .catch((err) => {
            console.error('Cannot start.  Does the file exist?', err);
            throw err;
        });
    });
}
function stderr() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const filePath = process.env.CONFLUX_NODE_ROOT + "/log/stderr.txt";
            const data = yield fs_1.promises.readFile(filePath, "utf8");
            if (data.trim().length === 0) {
                console.log("No content to display.");
                return;
            }
            process.stdout.write(data);
        }
        catch (error) {
            console.error(`Error reading file`, error.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=utils.js.map