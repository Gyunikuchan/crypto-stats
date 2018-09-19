import * as _ from "lodash";
import * as moment from "moment";

import { MDWriter } from "../utils/md_writer";
import { Summary } from "src/old/common/summary";
import {
	QTUM_ACCOUNTS_SOURCE_URL,
	QTUM_BLOCKS_SOURCE_URL,
	QTUM_NODES_SOURCE_URL,
	QtumStatsManager,
} from "src/old/qtum/qtum.stats.manager";

const writer: MDWriter = new MDWriter();

export async function writeStats(start: moment.Moment, end: moment.Moment): Promise<Summary> {
	// Load stats
	const statsManager = new QtumStatsManager(start, end);
	await statsManager.load();

	// Write
	writer.open(`${__dirname}/../../results/${statsManager.name.toLowerCase()}.results.md`);

	writeSummary(statsManager);

	writer.writeDivider();
	const producerStats1Week = writeProducerStats(statsManager);

	writer.writeDivider();
	const wealthStats = writeWealthStats(statsManager);

	writer.close();

	return {
		name: statsManager.name,
		consensus: statsManager.consensus,
		totalBlocks: statsManager.blocks.length.toString(),
		totalNodes: statsManager.totalNodeCount.toString(),
		totalProducers: producerStats1Week.producers.length.toString(),
		totalValidators: producerStats1Week.validators.length.toString(),
		noTopValidatorsToAttack: producerStats1Week.noTopValidatorsToAttack.toString(),
		wealthPercentHeldbyTop100: wealthStats.accumWealthPercent100.toPrecision(5),
		wealthNoTopAccountsToAttack: wealthStats.noTopAccountsToAttackString,
	};
}

// =============================================================================
// Summary
// =============================================================================

function writeSummary(statsManager: QtumStatsManager) {
	writer.writeHeader(`${statsManager.name}`, 1);
	writer.writeLn(`Combining a modified Bitcoin Core infrastructure with an intercompatible version of the Ethereum Virtual Machine (EVM), ` +
		`Qtum merges the reliability of Bitcoin’s unfailing blockchain with the endless possibilities provided by smart contracts.`);

	writer.writeTableHeader(`Attribute`, `Description`);
	writer.writeTableRow(`---`, `---`);
	writer.writeTableRow(`**Website**`, `https://qtum.org`);
	writer.writeTableRow(`**Sources**`,
		`${QTUM_ACCOUNTS_SOURCE_URL}<br/>` +
		`${QTUM_BLOCKS_SOURCE_URL}<br/>` +
		`${QTUM_NODES_SOURCE_URL}`);
	writer.writeTableRow(`**Consensus**`, `${statsManager.consensus}`);
	writer.writeTableRow(`**Total nodes**`, `${statsManager.totalNodeCount}`);
}

// =============================================================================
// Producers
// =============================================================================

function writeProducerStats(statsManager: QtumStatsManager) {
	writer.writeHeader(`Producer Stats`, 2);

	// 1 day
	const start1Day = moment(statsManager.end).subtract(1, "day");
	writer.writeHeader(`Period: 1 day (${start1Day.toString()} - ${statsManager.end.toString()})`, 3);
	const producerStats1Day = writePeriodProducerStats(statsManager, start1Day);
	writer.write();

	// 1 week
	const start1Week = moment(statsManager.end).subtract(1, "week");
	writer.writeHeader(`Period: 1 week (${start1Week.toString()} - ${statsManager.end.toString()})`, 3);
	const producerStats1Week = writePeriodProducerStats(statsManager, start1Week);
	writer.write();

	// Summary
	const noTopValidatorsToAttack = Math.min(producerStats1Day.noTopValidatorsToAttack, producerStats1Week.noTopValidatorsToAttack);
	writer.writeHeader(`**No of validators to attack the network: <span style="color:red">${noTopValidatorsToAttack}</span>**`, 3);

	return producerStats1Week;
}

function writePeriodProducerStats(statsManager: QtumStatsManager, start: moment.Moment) {
	const producerStats = statsManager.getProducerStats(start, statsManager.end, 0.5);

	// Producer stats
	writer.writeTableHeader(`Metric`, `Result`);
	writer.writeTableRow(`---`, `---`);
	writer.writeTableRow(`Total blocks`, `${producerStats.totalBlocks}`);
	writer.writeTableRow(`Total producers`, `${producerStats.producers.length}`);
	writer.writeTableRow(`Total validations`, `${producerStats.totalValidations}`);
	writer.writeTableRow(`Total validators`, `${producerStats.validators.length}`);
	writer.writeTableRow(`No of validators to attack`, `${producerStats.noTopValidatorsToAttack}`);
	writer.write();
	writer.writeLn();

	// Top producers
	writer.writeTableHeaderQuoted(`Rank`, `Address`, `Blocks`);
	writer.writeTableRowQuoted(`---`, `---`, `---`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const producer = producerStats.producers[index];
		if (producer)
			writer.writeTableRowQuoted(`${(index + 1)}`, `${statsManager.getAliasOrId(producer.id)}`, `${producer.blockCount}`);
	}

	return producerStats;
}

// =============================================================================
// Wealth
// =============================================================================

function writeWealthStats(statsManager: QtumStatsManager) {
	writer.writeHeader(`Wealth Stats`, 2);

	// Top accumulated
	const accumWealthPercent10 = statsManager.getAccumulatedWealthForAccountCount(10);
	const accumWealthPercent50 = statsManager.getAccumulatedWealthForAccountCount(50);
	const accumWealthPercent100 = statsManager.getAccumulatedWealthForAccountCount(100);

	writer.writeTableHeader(`Metric`, `Result`);
	writer.writeTableRow(`---`, `---`);
	writer.writeTableRow(`Amount held by the top 10 accounts`, `${accumWealthPercent10.toPrecision(5)}%`);
	writer.writeTableRow(`Amount held by the top 50 accounts`, `${accumWealthPercent50.toPrecision(5)}%`);
	writer.writeTableRow(`Amount held by the top 100 accounts`, `${accumWealthPercent100.toPrecision(5)}%`);
	writer.write();
	writer.writeLn();

	// Top accounts
	writer.writeTableHeader(`Rank`, `Address`, `Amount`);
	writer.writeTableRow(`---`, `---`, `---`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const account = statsManager.accounts[index];
		if (account)
			writer.writeTableRow(`${(index + 1)}`, `${account.alias || account.id}`, `${account.wealth.toPrecision(5)}%`);
	}
	writer.write();

	// Summary
	const noTopAccountsToAttack = statsManager.getNoTopAccountsToAttack(0.5);
	const prefixSymbol = noTopAccountsToAttack.moreThan ? ">" : "";
	const noTopAccountsToAttackString = `${prefixSymbol}${noTopAccountsToAttack.noOfAccounts}`;
	writer.writeHeader(`**No of accounts needed to attack the network with wealth: <span style="color:red">${noTopAccountsToAttackString}</span>**`, 3);

	return {
		accumWealthPercent100,
		noTopAccountsToAttackString,
	};
}
