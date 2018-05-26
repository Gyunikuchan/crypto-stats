import * as _ from "lodash";
import * as moment from "moment";

import { MDWriter } from "../utils/md_writer";
import { Summary } from "../common/summary";
import {
	ETH_ACCOUNTS_SOURCE_URL,
	ETH_API_SOURCE_URL,
	ETH_BLOCKS_SOURCE_URL,
	ETH_NODES_SOURCE_URL,
	EthereumStatsManager,
} from "./ethereum.stats.manager";

const writer: MDWriter = new MDWriter();

export async function writeStats(start: moment.Moment, end: moment.Moment): Promise<Summary> {
	// Load stats
	const statsManager = new EthereumStatsManager(start, end);
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
		totalValidators: producerStats1Week.producers.length.toString(),
		noTopValidatorsToTakeOver: producerStats1Week.noTopValidatorsToTakeOver.toString(),
		wealthPercentHeldbyTop100: wealthStats.accumWealthPercent100.toPrecision(5),
		wealthNoTopAccountsToTakeOver: wealthStats.noTopAccountsToTakeOverWealthString,
	};
}

// =============================================================================
// Summary
// =============================================================================

function writeSummary(statsManager: EthereumStatsManager) {
	writer.writeHeader(`${statsManager.name}`, 1);
	writer.writeLn(`Ethereum is a decentralized platform that runs smart contracts: applications that` +
		`run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.`);

	writer.writeTableHeader(`Attribute`, `Description`);
	writer.writeTableRow(`---`, `---`);
	writer.writeTableRow(`**Website**`, `https://www.ethereum.org`);
	writer.writeTableRow(`**Sources**`,
		`${ETH_ACCOUNTS_SOURCE_URL}<br/>` +
		`${ETH_API_SOURCE_URL}<br/>` +
		`${ETH_BLOCKS_SOURCE_URL}<br/>` +
		`${ETH_NODES_SOURCE_URL}`);
	writer.writeTableRow(`**Consensus**`, `${statsManager.consensus}`);
	writer.writeTableRow(`**Total nodes**`, `${statsManager.totalNodeCount}`);
}

// =============================================================================
// Producers
// =============================================================================

function writeProducerStats(statsManager: EthereumStatsManager) {
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
	const noTopValidatorsToTakeOver = Math.min(producerStats1Day.noTopValidatorsToTakeOver, producerStats1Week.noTopValidatorsToTakeOver);
	writer.writeHeader(`**No of validators to take over network: <span style="color:red">${noTopValidatorsToTakeOver}</span>**`, 3);

	return producerStats1Week;
}

function writePeriodProducerStats(statsManager: EthereumStatsManager, start: moment.Moment) {
	const producerStats = statsManager.getProducerStats(start, statsManager.end, 0.5);

	// Producer stats
	writer.writeTableHeader(`Metric`, `Result`);
	writer.writeTableRow(`---`, `---`);
	writer.writeTableRow(`Total blocks`, `${producerStats.totalBlocks}`);
	writer.writeTableRow(`Total producers`, `${producerStats.producers.length}`);
	writer.writeTableRow(`Total validations`, `${producerStats.totalValidations}`);
	writer.writeTableRow(`Total validators`, `${producerStats.validators.length}`);
	writer.writeTableRow(`No of validators to take over network`, `${producerStats.noTopValidatorsToTakeOver}`);
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

function writeWealthStats(statsManager: EthereumStatsManager) {
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
	writer.writeTableHeader(`Rank`, `Address`, `Amount (%)`);
	writer.writeTableRow(`---`, `---`, `---`);
	for (const index of [..._.range(0, 15), ..._.range(19, 50, 10), 99]) {
		const account = statsManager.accounts[index];
		if (account)
			writer.writeTableRow(`${(index + 1)}`, `${account.alias || account.id}`, `${account.wealth.toPrecision(5)}`);
	}
	writer.write();

	// Summary
	const noTopAccountsToTakeOverWealthString = `-`;	// PoW is not affected
	writer.writeHeader(`**No of accounts needed to take over network with wealth: <span style="color:red">${noTopAccountsToTakeOverWealthString}</span>**`, 3);

	return {
		accumWealthPercent100,
		noTopAccountsToTakeOverWealthString,
	};
}
