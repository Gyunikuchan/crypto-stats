import logger from "../config/logger";
import { printConsensusDistribution } from "./consensus_distribution";
import { printWealthDistribution } from "./wealth_distribution";

export async function printStats() {
	logger.info(`//////////////////////////////////////////////////////`);
	logger.info(`Qtum`);
	logger.info(`//////////////////////////////////////////////////////`);
	await printConsensusDistribution();
	logger.info(``);
	await printWealthDistribution();
}
