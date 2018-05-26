import * as moment from "moment";

import { MDWriter } from "./utils/md_writer";
import { Summary } from "./common/summary";

import * as ethereum from "./ethereum";
import * as qtum from "./qtum";
import * as neo from "./neo";

const writer: MDWriter = new MDWriter();

async function writeSummary() {
	const endLoadMoment = moment();
	const startLoadMoment = moment(endLoadMoment).subtract(1, "week");
	// const startLoadMoment = moment(endLoadMoment).subtract(10, "minutes");

	// Load summaries
	const summaries: Summary[] = [
		...await Promise.all([
			ethereum.writeStats(startLoadMoment, endLoadMoment),
			qtum.writeStats(startLoadMoment, endLoadMoment),
			neo.writeStats(startLoadMoment, endLoadMoment),
		]),
	];

	// Write
	writer.open(`${__dirname}/../readme.md`);

	writer.writeHeader(`Crypto-Stats`, 1);
	writer.writeHeader(`Summary`, 2);
	writer.writeLn(`Gathers decentralization statistics for various cryptocurrency projects`);
	writer.writeLn(`These are pretty raw statistics and are incapable of tell the full story on its own`);
	writer.writeLn(`A single entity can control multiple addresses`);
	writer.writeLn(`Some consensus are easier/cheaper to game (e.g. buying votes)`);
	writer.writeLn(`Some projects have higher barriers to entry either in governance or in execution`);
	writer.writeLn(``);
	writer.writeHeader(`Explanation`, 3);
	writer.writeLn(`**Total Blocks**: Activity in this period`);
	writer.writeLn(`**Total Nodes**: The number of full nodes capable of producing and validating`);
	writer.writeLn(`**Total Producers**: Unique addresses that managed to produce blocks`);
	writer.writeLn(`**Total Validators**: Unique addresses that participated in validation (lower means it is easier to censor)`);
	writer.writeLn(`**No of validators to take over network**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)`);
	writer.writeLn(`**Wealth held by top 100 (%)**: Percentage of wealth held by the top 100 addresses`);
	writer.writeLn(`**No of accounts to take over network with wealth**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)`);
	writer.writeDivider();

	writer.writeHeader(`How to run`, 2);
	writer.writeLn(`\`npm i\``);
	writer.writeLn(`\`npm start\``);
	writer.writeDivider();

	writer.writeHeader(`Results`, 2);
	writer.writeLn(`Date: ${endLoadMoment.format("MMMM Do YYYY")}`);
	writer.writeLn(`Period: 1 week (${startLoadMoment.toString()} - ${endLoadMoment.toString()})`);
	writer.writeQuoted(`|` +
		`Name|` +
		`Consensus|` +
		`Total Blocks|` +
		`Total Nodes|` +
		`Total Producers|` +
		`Total Validators|` +
		`No of validators to take over network|` +
		`Wealth held by top 100 (%)|` +
		`No of accounts to take over network with wealth|`);
	writer.writeQuoted(`|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|`);
	for (const summary of summaries) {
		writer.writeQuoted(`|` +
			`[${summary.name}](results/${summary.name.toLowerCase()}.results.md)|` +
			`${summary.consensus}|` +
			`${summary.totalBlocks}|` +
			`${summary.totalNodes}|` +
			`${summary.totalProducers}|` +
			`${summary.totalValidators}|` +
			`${summary.noTopValidatorsToTakeOver}|` +
			`${summary.wealthPercentHeldbyTop100}|` +
			`${summary.wealthNoTopAccountsToTakeOver}|`);
	}
	writer.writeQuoted(`*Not dynamically updated`);

	writer.close();
}

writeSummary();
