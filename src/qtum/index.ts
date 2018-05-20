import * as _ from "lodash";
import * as moment from "moment";

import { MDWriter } from "../utils/md_writer";
import {
	QTUM_ACCOUNTS_SOURCE_URL,
	QTUM_BLOCKS_SOURCE_URL,
	QTUM_NODES_SOURCE_URL,
	QtumStatsManager,
} from "./qtum.stats.manager";

const writer: MDWriter = new MDWriter();

export async function writeStats(start: moment.Moment, end: moment.Moment) {
	// Load stats
	const statsManager = new QtumStatsManager(start, end);
	await statsManager.load();

	// Write
	writer.open(`${__dirname}/../../results/${statsManager.name.toLowerCase()}.results.md`);

	writeSummary(statsManager);

	writer.writeDivider();
	writeProducerStats(statsManager);

	writer.writeDivider();
	writeWealthStats(statsManager);

	writer.close();
}

// =============================================================================
// Summary
// =============================================================================

function writeSummary(statsManager: QtumStatsManager) {
	writer.writeHeader(`${statsManager.name} (${statsManager.end.format("MMMM Do YYYY")})`, 1);
	writer.writeLn(`Combining a modified Bitcoin Core infrastructure with an intercompatible version of the Ethereum Virtual Machine (EVM),`);
	writer.writeLn(`Qtum merges the reliability of Bitcoin’s unfailing blockchain with the endless possibilities provided by smart contracts. `);

	writer.write(`|||`);
	writer.write(`|---|---|`);
	writer.write(`|**Website**|https://qtum.org|`);
	writer.write(`|**Sources**|${QTUM_ACCOUNTS_SOURCE_URL}|`);
	writer.write(`||${QTUM_BLOCKS_SOURCE_URL}|`);
	writer.write(`||${QTUM_NODES_SOURCE_URL}|`);
	writer.write(`|**Consensus**|PoS|`);
	writer.write(`|**Total nodes**|${statsManager.totalNodeCount}|`);
}

// =============================================================================
// Producers
// =============================================================================

function writeProducerStats(statsManager: QtumStatsManager) {
	writer.writeHeader(`Producer Stats`, 2);

	// 1 day
	writer.writeHeader(`1 Day Stats`, 3);
	const start1Day = moment(statsManager.end).subtract(1, "day");
	const noTopProducersToTakeOver1Day = writePeriodProducerStats(statsManager, start1Day);
	writer.write();

	// 1 week
	writer.writeHeader(`1 Week Stats`, 3);
	const start1Week = moment(statsManager.end).subtract(1, "week");
	const noTopProducersToTakeOver1Week = writePeriodProducerStats(statsManager, start1Week);
	writer.write();

	// Summary
	const noTopProducersToTakeOver = Math.min(noTopProducersToTakeOver1Day, noTopProducersToTakeOver1Week);
	writer.writeHeader(`**No of producers to take over: <span style="color:red">${noTopProducersToTakeOver}</span>**`, 3);
}

function writePeriodProducerStats(statsManager: QtumStatsManager, start: moment.Moment) {
	const stats = statsManager.getProducerStats(start, statsManager.end);

	// Producer stats
	writer.writeLn(`Total blocks: **${stats.totalBlocks}**`);
	writer.writeLn(`Total producers: **${stats.producers.length}**`);
	writer.writeLn(`No of producers to take over: **${stats.noTopProducersToTakeOver}**`);

	// Top producers
	writer.writeQuoted(`|Rank|Address|Blocks|`);
	writer.writeQuoted(`|---|---|---|`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const producer = stats.producers[index];
		if (producer)
			writer.writeQuoted(`|${(index + 1)}|${producer.id}|${producer.blockCount}|`);
	}

	return stats.noTopProducersToTakeOver;
}

// =============================================================================
// Wealth
// =============================================================================

async function writeWealthStats(statsManager: QtumStatsManager) {
	writer.writeHeader(`Wealth Stats`, 2);

	// Top accumulated
	const accumWealthPercent10 = statsManager.getAccumulatedWealthForAccountCount(10);
	const accumWealthPercent50 = statsManager.getAccumulatedWealthForAccountCount(50);
	const accumWealthPercent100 = statsManager.getAccumulatedWealthForAccountCount(100);

	writer.writeLn(`Amount held by the top 10 accounts: **${accumWealthPercent10.toPrecision(5)}%**`);
	writer.writeLn(`Amount held by the top 50 accounts: **${accumWealthPercent50.toPrecision(5)}%**`);
	writer.writeLn(`Amount held by the top 100 accounts: **${accumWealthPercent100.toPrecision(5)}%**`);

	// Top accounts
	writer.writeQuoted(`|Rank|Address|Amount(%)|`);
	writer.writeQuoted(`|---|---|---|`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const account = statsManager.accounts[index];
		if (account)
			writer.writeQuoted(`|${(index + 1)}|${account.id}|${account.wealth.toPrecision(5)}|`);
	}
	writer.write();

	// Summary
	const noTopAccountsToTakeOverWealth = statsManager.getNoTopAccountsToTakeOverWealth();
	const prefixSymbol = noTopAccountsToTakeOverWealth.moreThan ? ">" : "";
	writer.writeHeader(`**No of accounts needed to take over: <span style="color:red">${prefixSymbol}${noTopAccountsToTakeOverWealth.noOfAccounts}</span>**`, 3);
}
