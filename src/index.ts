import * as eth from "./ethereum";
import * as qtum from "./qtum";

async function printStats() {
	await eth.printStats();
	await qtum.printStats();
}

printStats();
