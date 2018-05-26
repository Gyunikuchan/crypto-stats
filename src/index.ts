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
	writer.write(``);
	writer.writeHeader(`Summary`, 3);
	writer.writeLn(`Gathers decentralization statistics for various public cryptocurrency networks.`);
	writer.writeLn(`These are pretty raw metrics that are incapable of tell the full story on its own.`);
	writer.write(``);
	writer.write(`|Metric|Description|`);
	writer.write(`|:---|:---|`);
	writer.writeLn(`|Total Blocks|The amount of activity within the period|`);
	writer.writeLn(`|Total Nodes|The number of full nodes capable of producing and validating<br/>` +
		`A higher number here gives better assurances that the network is unstoppable|`);
	writer.writeLn(`|Total Producers|Unique addresses that managed to produce blocks<br/>` +
		`A higher number here means that the network is harder to censor (your transactions will be published fairly and timely)|`);
	writer.writeLn(`|Total Validators|Unique addresses that participated in validation|`);
	writer.writeLn(`|No of validators to take over network|The minimum number of addresses needed for collusion<br/>` +
		`A higher number here helps to guard against network attacks (e.g. double spends, network stoppage)|`);
	writer.writeLn(`|Wealth held by top 100 (%)|Percentage of wealth held by the top 100 addresses|`);
	writer.writeLn(`|No of accounts to take over network with wealth|The minimum number of addresses needed for collusion<br/>` +
		`Similar to "No of validators to take over network" but relevant only to staking consensus and includes all potential validators|`);
	writer.write(``);
	writer.writeHeader(`Why?`, 3);
	writer.writeLn(`The key propositions of a public DLT network is that it is **trustless** and **permissionless**.`);
	writer.writeLn(`Without these properties, using private/consortium/trusted networks makes a lot more sense.`);
	writer.write(``);
	writer.writeHeader(`Other Considerations`, 3);
	writer.writeLn(`- A single entity can control multiple addresses`);
	writer.writeLn(`- Some consensus are easier/cheaper to game (e.g. buying votes)`);
	writer.writeLn(`- Some networks have higher barriers to entry either in governance or in execution`);
	writer.writeLn(`- Some networks have claims/properties we assume to be true, but may not be so in practice`);
	writer.writeLn(`- Some of the top wealth holders are exchanges, but it still poses a threat should the exchange misbehave`);
	writer.writeLn(`- While wealth inequality in non-staking networks are not directly affecting the network, price manipulation can be a concern`);
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
			`**${summary.noTopValidatorsToTakeOver}**|` +
			`${summary.wealthPercentHeldbyTop100}|` +
			`**${summary.wealthNoTopAccountsToTakeOver}**|`);
	}
	writer.write(``);
	writer.writeQuoted(`*Not dynamically updated`);

	writer.close();
}

writeSummary();
