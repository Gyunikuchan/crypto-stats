import * as _ from "lodash";
import * as moment from "moment";

import { MDWriter } from "../utils/md-writer";
import { ProducerManager } from "../common/producer.manager";
import { ETH_BLOCKS_SOURCE_URL, EthBlockManager } from "./eth.block.manager";
import { ETH_ACCOUNTS_SOURCE_URL, EthAccountManager } from "./eth.account.manager";

const OUTPUT_PATH = `${__dirname}/../../results/ethereum.results.md`;
const writer: MDWriter = new MDWriter();

export async function printStats() {
	writer.open(OUTPUT_PATH);

	writer.writeHeader(`Ethereum (${moment().format("MMMM Do YYYY")})`, 1);
	writer.writeLn(`Sources:`);
	writer.writeLn(`${ETH_BLOCKS_SOURCE_URL}`);
	writer.writeLn(`${ETH_ACCOUNTS_SOURCE_URL}`);
	writer.writeDivider();
	const producerScore = await writeProducerStats();
	writer.writeDivider();
	const wealthScore = await writeWealthStats();

	writer.close();
}

// =============================================================================
// Producers
// =============================================================================

async function writeProducerStats() {
	writer.writeHeader(`Miner Stats`, 2);

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
	writer.writeHeader(`**\\# of accounts needed to control 50% hash power: <span style="color:red">${producerScore}</span>**`, 3);

	return producerScore;
}

function writePeriodProducerStats(blockManager: EthBlockManager, startMoment: moment.Moment, endMoment: moment.Moment) {
	const blocks = blockManager.getBlocks(startMoment, endMoment);
	const producerManager = new ProducerManager(blocks);
	const producersScore = producerManager.getNoProducersFor50PercentConsensus();

	// Producer stats
	writer.writeLn(`Total blocks mined: **${blocks.length}**`);
	writer.writeLn(`Unique accounts that mined a block: **${producerManager.getProducersCount()}**`);
	writer.writeLn(`\\# of top accounts that mined 50% of the blocks: **${producersScore}**`);

	// Top producers
	writer.writeQuoted(`|Rank|Address|Blocks mined|`);
	writer.writeQuoted(`|---|---|---|`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const producer = producerManager.getProducer(index);
		if (producer)
			writer.writeQuoted(`|${(index + 1)}|${producer.id}|${producer.blockCount}|`);
	}

	return producersScore;
}

// =============================================================================
// Wealth
// =============================================================================

async function writeWealthStats() {
	writer.writeHeader(`Wealth Stats`, 2);

	// Load accounts
	const accountManager = new EthAccountManager();
	await accountManager.load();

	// Top accumulated
	const accumWealthPercent10 = accountManager.getAccumulatedWealthPercentageForAccountsCount(10);
	const accumWealthPercent50 = accountManager.getAccumulatedWealthPercentageForAccountsCount(50);
	const accumWealthPercent100 = accountManager.getAccumulatedWealthPercentageForAccountsCount(100);

	writer.writeLn(`Amount held by the top 10 accounts: **${accumWealthPercent10.toPrecision(5)}%**`);
	writer.writeLn(`Amount held by the top 50 accounts: **${accumWealthPercent50.toPrecision(5)}%**`);
	writer.writeLn(`Amount held by the top 100 accounts: **${accumWealthPercent100.toPrecision(5)}%**`);

	// Top accounts
	writer.writeQuoted(`|Rank|Address|Amount(%)|`);
	writer.writeQuoted(`|---|---|---|`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const account = accountManager.getAccount(index);
		if (account)
			writer.writeQuoted(`|${(index + 1)}|${account.id}|${account.amount}|`);
	}
	writer.write();

	// Stake score
	const wealthScore = accountManager.getNoAccountFor50PercentWealth();
	const prefixSymbol = wealthScore.moreThan ? ">" : wealthScore.noOfAddresses;
	writer.writeHeader(`**\\# of accounts needed to control 50% wealth: <span style="color:red">${prefixSymbol}${wealthScore.noOfAddresses}</span>**`, 3);

	return wealthScore;
}
