import * as moment from "moment";

import { MDWriter } from "../utils/md-writer";
import { ETH_BLOCKS_SOURCE_URL, EthBlockManager } from "./eth.block.manager";
import { ProducerManager } from "../common/producer.manager";

const OUTPUT_PATH = `${__dirname}/../../results/ethereum.results.md`;
const writer: MDWriter = new MDWriter();

export async function printStats() {
	writer.open(OUTPUT_PATH);

	writer.writeHeader(`Ethereum (${moment().format("MMMM Do YYYY")})`, 1);
	writer.writeLn(`Sources:`);
	writer.writeLn(`${ETH_BLOCKS_SOURCE_URL}`);
	// writer.writeLn(`${ETH_ACCOUNTS_SOURCE_URL}`);
	writer.writeDivider();
	const producerScore = await writeProducerStats();
	// writer.writeDivider();
	// await writeWealthStats();

	writer.close();
}

// =============================================================================
// Producers
// =============================================================================

async function writeProducerStats() {
	writer.writeHeader(`Producer Stats`, 2);

	// Load blocks
	const endLoadMoment = moment();
	const startLoadMoment = moment(endLoadMoment).subtract(1, "week");
	// const startLoadMoment = moment(endLoadMoment).subtract(1, "day");
	const blockManager = new EthBlockManager();
	await blockManager.load(startLoadMoment, endLoadMoment);

	// 1 day
	const start1Day = moment(endLoadMoment).subtract(1, "day");
	writer.writeHeader(`1 Day Stats`, 3);
	const producersScore1Day = writePeriodProducerStats(blockManager, start1Day, endLoadMoment);
	writer.write();

	// 1 week
	writer.writeHeader(`1 Week Stats`, 3);
	const start1Week = moment(endLoadMoment).subtract(1, "week");
	const producersScore1Week = writePeriodProducerStats(blockManager, start1Week, endLoadMoment);
	writer.write();

	// Producer score
	const producerScore = Math.min(producersScore1Day, producersScore1Week);
	writer.writeLn(`**Number of accounts needed to control 50% blocks: <span style="color:red">${producerScore}**</span>`);

	return producerScore;
}

function writePeriodProducerStats(blockManager: EthBlockManager, startMoment: moment.Moment, endMoment: moment.Moment) {
	const blocks = blockManager.getBlocks(startMoment, endMoment);
	const producerManager = new ProducerManager(blocks);

	// Number of participating producers
	writer.writeLn(`${producerManager.getProducersCount()} addresses over ${blocks.length} blocks`);

	// Producer score
	const producersScore = producerManager.getNoProducersFor50PercentConsensus();
	writer.writeLn(`50% of the blocks are produced by ${producersScore} of the top addresses`);

	// Top producers
	for (const index of [0, 1, 2, 3, 4, 9, 49, 99]) {
		const producer = producerManager.getProducer(index);
		if (producer)
			writer.writeLnQuoted(`Producer #${index + 1} (${producer.id}): mined ${producer.blockCount} blocks`);
	}

	return producersScore;
}

// =============================================================================
// Wealth
// =============================================================================

// TODO:
