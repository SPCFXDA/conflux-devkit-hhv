#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const utils_1 = require("./utils");
const program = new commander_1.Command();
program
    .version("0.1.0")
    .description("DevKit CLI utils")
    .option("-l, --list", "List genesis accounts")
    .option("-b, --balance", "Balance of the genesis accounts")
    .option("-f, --faucet [value...]", "Faucet <amount> <address>")
    .option("-e, --espace-genesis [value]", "Transfer from Core genesis address to eSpace")
    .option("-g, --generate-genesis [value]", "Generate genesis addresses")
    .option("--start", "Start the development node")
    .option("--stop", "Stop the development node")
    .option("--status", "Show the node status")
    .option("--logs", "Show the node logs")
    .option("--stderr", "Show the errors the node produced in the stderr")
    .parse(process.argv);
const options = program.opts();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(options);
        if (options.list) {
            (0, utils_1.genesisList)();
        }
        if (options.faucet) {
            (0, utils_1.faucet)(options.faucet);
        }
        if (options.espaceGenesis) {
            let value = options.espaceGenesis == true ? 5000 : options.espaceGenesis;
            (0, utils_1.genesisToeSpace)(value);
        }
        if (options.generateGenesis) {
            let value = options.generateGenesis == true ? "5" : options.generateGenesis;
            (0, utils_1.genesisSecrets)(value);
        }
        if (options.balance) {
            (0, utils_1.balance)();
        }
        if (options.start) {
            yield (0, utils_1.start)();
            if (options.logs) {
                (0, utils_1.logs)();
            }
        }
        else {
            if (options.stop) {
                (0, utils_1.stop)();
            }
            if (options.status) {
                (0, utils_1.status)();
            }
            if (options.logs) {
                (0, utils_1.logs)();
            }
            if (options.stderr) {
                (0, utils_1.stderr)();
            }
        }
        if (!process.argv.slice(2).length) {
            program.outputHelp();
        }
    });
}
main().catch((error) => {
    console.error("An error occurred:", error.message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map