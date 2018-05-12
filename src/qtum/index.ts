import * as moment from "moment";

import { MDWriter } from "../utils/md-writer";
import { QTUM_BLOCKS_SOURCE_URL, QtumBlockManager } from "./qtum.block.manager";
import { ProducerManager } from "../common/producer.manager";
import { QTUM_ACCOUNTS_SOURCE_URL, QtumAccountManager } from "./qtum.account.manager";

const OUTPUT_PATH = `${__dirname}/../../results/qtum.results.md`;
const writer: MDWriter = new MDWriter();

export async function printStats() {
	writer.open(OUTPUT_PATH);

	writer.writeHeader(`Qtum (${moment().format("MMMM Do YYYY")})`, 1);
	writer.writeLn(`Sources:`);
	writer.writeLn(`${QTUM_BLOCKS_SOURCE_URL}`);
	writer.writeLn(`${QTUM_ACCOUNTS_SOURCE_URL}`);
	writer.write();
	writer.writeDivider();
	await printConsensusStats();
	writer.write();
	writer.writeDivider();
	await printWealthStats();

	writer.close();
}

// =============================================================================
// Helpers
// =============================================================================

async function printConsensusStats() {
	writer.writeHeader(`Consensus Stats`, 2);

	// Load blocks
	const endLoadMoment = moment();
	const startLoadMoment = moment(endLoadMoment).subtract(1, "month");
	// const startLoadMoment = moment(endLoadMoment).subtract(1, "day");
	const blockManager = new QtumBlockManager();
	await blockManager.load(startLoadMoment, endLoadMoment);

	// 1 day
	const start1Day = moment(endLoadMoment).subtract(1, "day");
	writer.writeHeader(`1 Day Stats`, 3);
	printPeriodStats(blockManager, start1Day, endLoadMoment);
	writer.write();

	// 1 week
	writer.writeHeader(`1 Week Stats`, 3);
	const start1Week = moment(endLoadMoment).subtract(1, "week");
	printPeriodStats(blockManager, start1Week, endLoadMoment);
	writer.write();

	// 1 month
	writer.writeHeader(`1 Month Stats`, 3);
	const start1Month = moment(endLoadMoment).subtract(1, "month");
	printPeriodStats(blockManager, start1Month, endLoadMoment);
}

function printPeriodStats(blockManager: QtumBlockManager, startMoment: moment.Moment, endMoment: moment.Moment) {
	const blocks = blockManager.getBlocks(startMoment, endMoment);
	const producerManager = new ProducerManager(blocks);

	writer.writeLn(`${producerManager.getProducersCount()} addresses over ${blocks.length} blocks`);
	writer.writeLn(`${producerManager.getNoProducersFor51Percent()} of the top addresses generated 51% of the blocks`);

	for (const index of [0, 1, 2, 3, 4, 9, 49, 99]) {
		const producer = producerManager.getProducer(index);
		if (producer)
			writer.writeLnQuoted(`Producer #${index + 1} mined ${producer.blockCount} blocks`);
	}
}

async function printWealthStats() {
	writer.writeHeader(`Wealth Stats`, 2);

	// Load accounts
	const accountManager = new QtumAccountManager();
	await accountManager.load();

	// Stats
	printTopAccountStats(accountManager, 10);
	printTopAccountStats(accountManager, 50);
	printTopAccountStats(accountManager, 100);
}

async function printTopAccountStats(accountManager: QtumAccountManager, accountsCount: number) {
	const accumAmount = accountManager.getAccumulatedAmountForAccountsCount(accountsCount);
	const totalAmount = accountManager.getTotalAmount();
	const accumPercent = accumAmount / totalAmount;
	writer.writeLn(`${accumPercent.toPrecision(5)}% held by the top ${accountsCount} accounts`);
}
