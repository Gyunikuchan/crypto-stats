import * as moment from "moment";

import logger from "../utils/logger";
import { QTUM_BLOCKS_SOURCE_URL, QtumBlockManager } from "./qtum.block.manager";
import { ProducerManager } from "../common/producer.manager";
import { QTUM_ACCOUNTS_SOURCE_URL, QtumAccountManager } from "./qtum.account.manager";

export async function printStats() {
	logger.info(`# Qtum`);
	logger.info(`Sources:`);
	logger.info(`${QTUM_BLOCKS_SOURCE_URL}`);
	logger.info(`${QTUM_ACCOUNTS_SOURCE_URL}`);
	logger.info(``);
	logger.info(`---`);
	await printConsensusStats();
	logger.info(``);
	logger.info(`---`);
	await printWealthStats();
}

// =============================================================================
// Helpers
// =============================================================================

async function printConsensusStats() {
	logger.info(`## Consensus Stats`);

	// Load blocks
	const endLoadMoment = moment();
	const startLoadMoment = moment(endLoadMoment).subtract(1, "month");
	// const startLoadMoment = moment(endLoadMoment).subtract(1, "day");
	const blockManager = new QtumBlockManager();
	await blockManager.load(startLoadMoment, endLoadMoment);

	// 1 day
	const start1Day = moment(endLoadMoment).subtract(1, "day");
	logger.info(`### 1 Day Stats`);
	printPeriodStats(blockManager, start1Day, endLoadMoment);
	logger.info(``);

	// 1 week
	logger.info(`### 1 Week Stats`);
	const start1Week = moment(endLoadMoment).subtract(1, "week");
	printPeriodStats(blockManager, start1Week, endLoadMoment);
	logger.info(``);

	// 1 month
	logger.info(`### 1 Month Stats`);
	const start1Month = moment(endLoadMoment).subtract(1, "month");
	printPeriodStats(blockManager, start1Month, endLoadMoment);
}

function printPeriodStats(blockManager: QtumBlockManager, startMoment: moment.Moment, endMoment: moment.Moment) {
	const blocks = blockManager.getBlocks(startMoment, endMoment);
	const producerManager = new ProducerManager(blocks);

	logger.info(`${producerManager.getProducersCount()} addresses over ${blocks.length} blocks`);
	logger.info(`${producerManager.getNoProducersFor51Percent()} of the top addresses generated 51% of the blocks`);

	for (const index of [0, 1, 2, 3, 4, 49, 99]) {
		const producer = producerManager.getProducer(index);
		if (producer)
			logger.info(`Producer #${index + 1} mined ${producer.blockCount} blocks`);
	}
}

async function printWealthStats() {
	logger.info(`## Wealth Stats`);

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
	logger.info(`${accumPercent.toPrecision(5)}% held by the top ${accountsCount} accounts`);
}
