import * as moment from "moment";

import { MDWriter } from "./utils/md_writer";
import { Summary } from "./common/summary";
import * as ethereum from "./ethereum";
import * as qtum from "./qtum";

const writer: MDWriter = new MDWriter();

async function writeSummary() {
	const endLoadMoment = moment();
	const startLoadMoment = moment(endLoadMoment).subtract(1, "week");
	// const startLoadMoment = moment(endLoadMoment).subtract(1, "hour");

	// Load summaries
	const summaries: Summary[] = await Promise.all([
		ethereum.writeStats(startLoadMoment, endLoadMoment),
		qtum.writeStats(startLoadMoment, endLoadMoment),
	]);

	// Write
	writer.open(`${__dirname}/../readme.md`);

	writer.writeHeader(`Crypto-Stats`, 1);
	writer.writeHeader(`Summary`, 2);
	writer.writeLn(`Gathers decentralization statistics for various cryptocurrency projects`);
	writer.writeLn(`Disclaimer: These numbers are often very nuanced and cannot tell the full story`);
	writer.write(``);

	writer.writeHeader(`How to run`, 2);
	writer.writeLn(`\`npm i\``);
	writer.writeLn(`\`npm start\``);
	writer.write(``);

	writer.writeHeader(`Results`, 2);
	writer.writeLn(`Date: ${endLoadMoment.format("MMMM Do YYYY")}`);
	writer.writeLn(`Period: 1 week (${startLoadMoment.toString()} - ${endLoadMoment.toString()})`);
	writer.writeQuoted(`|` +
		`Name|` +
		`Total Blocks|` +
		`Total Nodes|` +
		`Total Producers|` +
		`No of producers to take over network|` +
		`Wealth held by top 100 (%)|` +
		`No of accounts to take over network with wealth|`);
	writer.writeQuoted(`|:---|:---:|:---:|:---:|:---:|:---:|:---:|`);
	for (const summary of summaries) {
		writer.writeQuoted(`|` +
			`[${summary.name}](results/${summary.name.toLowerCase()}.results.md)|` +
			`${summary.totalBlocks}|` +
			`${summary.totalNodes}|` +
			`${summary.totalProducers}|` +
			`${summary.noTopProducersToTakeOver}|` +
			`${summary.wealthPercentHeldbyTop100}|` +
			`${summary.wealthNoTopAccountsToTakeOver}|`);
	}

	writer.close();
}

writeSummary();
