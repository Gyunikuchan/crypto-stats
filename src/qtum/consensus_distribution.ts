import * as moment from "moment";
import logger from "../config/logger";
import { getBlocks, Block } from "./blocks";

export async function printConsensusDistribution() {
	const now = moment();
	const start1DayMoment = moment(now).subtract(1, "day");
	const start1WeekMoment = moment(now).subtract(1, "week");
	const start1MonthMoment = moment(now).subtract(1, "month");
	const blocks = await getBlocks(start1MonthMoment, now);

	logger.info(`======== Consensus Distribution ========`);
	logger.info(`1 Day Stats`);
	await printBlockStats(blocks, start1DayMoment);

	logger.info(``);
	logger.info(`1 Week Stats`);
	await printBlockStats(blocks, start1WeekMoment);

	logger.info(``);
	logger.info(`1 Month Stats`);
	await printBlockStats(blocks, start1MonthMoment);
}

// =============================================================================
// Helpers
// =============================================================================

interface BlockStats {
	sortedMinerStats: Array<[string, number]>;
	totalBlockCount: number;
}

async function getBlockStats(blocks: Block[], startMoment: moment.Moment): Promise<BlockStats> {
	const minerStats = new Map<string, number>();
	let totalBlockCount = 0;

	for (const block of blocks) {
		if (block.time.isBefore(startMoment))
			continue;

		const minerBlockCount = (minerStats.get(block.miner) || 0) + 1;
		minerStats.set(block.miner, minerBlockCount);
		++totalBlockCount;
	}

	// Sort from most blocks to fewest
	const sortedMinerStats = [...minerStats.entries()].sort((a, b) => b[1] - a[1]);

	return {
		sortedMinerStats,
		totalBlockCount,
	};
}

function getNoOfAddressesToPercent51(blockStats: BlockStats) {
	const percent51 = Math.floor(blockStats.totalBlockCount * 0.51);

	let noOfAddresses = 0;
	let blocksAccum = 0;
	for (const minerStat of blockStats.sortedMinerStats) {
		blocksAccum += minerStat[1];

		if (blocksAccum > percent51)
			break;

		++noOfAddresses;
	}

	return noOfAddresses;
}

async function printBlockStats(blocks: Block[], startMoment: moment.Moment) {
	const blockStats = await getBlockStats(blocks, startMoment);
	const noOfAddressesToPercent51 = getNoOfAddressesToPercent51(blockStats);

	logger.info(`${blockStats.sortedMinerStats.length} addresses over ${blockStats.totalBlockCount} blocks`);
	logger.info(`${noOfAddressesToPercent51} of the top addresses generated 51% of the blocks`);
	if (blockStats.sortedMinerStats[0]) logger.info(`Producer #1: ${blockStats.sortedMinerStats[0][1]} blocks`);
	if (blockStats.sortedMinerStats[1]) logger.info(`Producer #2: ${blockStats.sortedMinerStats[1][1]} blocks`);
	if (blockStats.sortedMinerStats[2]) logger.info(`Producer #3: ${blockStats.sortedMinerStats[2][1]} blocks`);
	if (blockStats.sortedMinerStats[3]) logger.info(`Producer #4: ${blockStats.sortedMinerStats[3][1]} blocks`);
	if (blockStats.sortedMinerStats[4]) logger.info(`Producer #5: ${blockStats.sortedMinerStats[4][1]} blocks`);
	if (blockStats.sortedMinerStats[9]) logger.info(`Producer #10: ${blockStats.sortedMinerStats[9][1]} blocks`);
	if (blockStats.sortedMinerStats[49]) logger.info(`Producer #50: ${blockStats.sortedMinerStats[49][1]} blocks`);
	if (blockStats.sortedMinerStats[99]) logger.info(`Producer #100: ${blockStats.sortedMinerStats[99][1]} blocks`);
}
