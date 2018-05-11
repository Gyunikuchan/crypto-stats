import { printConsensusDistribution } from "./consensus_distribution";
import { printWealthDistribution } from "./wealth_distribution"

export async function printStats() {
	console.log(`//////////////////////////////////////////////////////`);
	console.log(`Qtum`);
	console.log(`//////////////////////////////////////////////////////`);
	console.log(`~~ consensus_distribution ~~`);
	await printConsensusDistribution(1, "day");
	console.log(``);
	await printConsensusDistribution(2, "day");
	console.log(``);
	await printConsensusDistribution(4, "day");
	console.log(``);
	await printConsensusDistribution(1, "week");
	console.log(``);
	await printConsensusDistribution(1, "month");
	console.log(``);

	console.log(`~~ wealth_distribution ~~`);
	await printWealthDistribution();
}
