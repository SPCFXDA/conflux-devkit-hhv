import { Start, Status } from "devkit";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const dev_node = new Start;
export async function node(
    taskArguments: {stop: boolean, status: boolean},
    hre: HardhatRuntimeEnvironment,
    runSuper: unknown,
  ) {
    let _ = runSuper;
    if(taskArguments.stop) {
        await dev_node.stop();
        return
    }
    if(taskArguments.status) {
        await new Status().run({});
        return
    }
    await dev_node.run({ logs: true });
}