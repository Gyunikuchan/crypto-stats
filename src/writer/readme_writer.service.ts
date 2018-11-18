import { NetworkStats } from "src/model/NetworkStats";
import logger from "src/util/logger";
import { MDWriter } from "src/util/md_writer";

export class ReadmeWriterService {
	public static async write(rootDirPath: string, relativeSummaryDirPath: string, allNetworkStats: NetworkStats[]) {
		logger.info(`Writing readme`);

		// Open file
		const writer: MDWriter = new MDWriter();
		await writer.open(rootDirPath, `README.md`);

		writer.writeHeader(`Crypto-Stats`, 1);
		writer.write();

		writer.writeHeader(`Summary`, 3);
		writer.writeLn(`Gathers decentralization statistics for various public cryptocurrency networks.`);
		writer.writeLn(`These are pretty raw metrics that are incapable of tell the full story on its own.`);
		writer.writeTableHeader(`Metric`, `Description`);
		writer.writeTableRow(`:---`, `:---`);
		writer.writeTableRow(`Total Nodes`, `The number of full nodes capable of producing and validating<br/>` +
			`A higher number here gives better assurances that the network is unstoppable`);
		writer.writeTableRow(`Total Blocks`, `The amount of activity within the period`);
		writer.writeTableRow(`Total Producers`, `Unique addresses that managed to produce blocks<br/>` +
			`A higher number here means that the network is harder to censor (your transactions will be published fairly and timely)`);
		writer.writeTableRow(`Total Validators`, `Unique addresses that participated in validation`);
		writer.writeTableRow(`No of top validators to attack`, `The minimum number of the top addresses needed for collusion<br/>` +
			`A higher number here helps to guard against network attacks (e.g. double spends, network stoppage)`);
		writer.writeTableRow(`Wealth held by top 100 (%)`, `Percentage of wealth held by the top 100 addresses`);
		writer.writeTableRow(`No of top accounts to attack`, `The minimum number of the top addresses needed for collusion<br/>` +
			`Similar to "No of validators to take over network" but relevant only to staking consensus and includes all potential validators`);
		writer.write();

		writer.writeHeader(`Why?`, 3);
		writer.writeLn(`The key propositions of public DLT networks are that they are **trustless**, **permissionless** and **censorship-resistant**.`);
		writer.writeLn(`Without these properties, using private/consortium/trusted networks makes a lot more sense.`);
		writer.write();

		writer.writeHeader(`Other Considerations`, 3);
		writer.writeLn(`- A single entity can control multiple addresses`);
		writer.writeLn(`- Some consensus are easier/cheaper to game (e.g. buying votes)`);
		writer.writeLn(`- Some networks have higher barriers to entry in governance or in execution`);
		writer.writeLn(`- Some networks have claims/properties we assume to be true, but may not be so in practice`);
		writer.writeLn(`- Some of the wealthiest addresses are exchanges, but they still pose a potential threat if misbehaving`);
		writer.writeLn(`- While wealth inequality in non-staking networks should not directly affect the network, there are other economical concerns`);
		writer.writeDivider();

		writer.writeHeader(`How to run`, 2);
		writer.writeLn(`\`npm i\``);
		writer.writeLn(`\`npm start\``);
		writer.writeDivider();

		writer.writeHeader(`Metrics`, 2);
		writer.writeTableHeader(
			`Name`,
			`Consensus`,
			`Total Nodes`,
			`Total Blocks`,
			`Total Producers`,
			`Total Validators`,
			`No of top validators to attack`,
			`Wealth held by top 100`,
			`No of top accounts to attack`);
		writer.writeTableRow(`:---`, `:---:`, `:---:`, `:---:`, `:---:`, `:---:`, `:---:`, `:---:`, `:---:`);
		for (const networkStats of allNetworkStats) {
			const { networkInfo, blockStats, wealthStats, networkManager } = networkStats;
			logger.info(`Writing readme network stats: ${networkManager.name}`);

			let noTopAccountsToAttackString = (wealthStats.noTopAccountsToAttack != null ? wealthStats.noTopAccountsToAttack.toString() : `-`);
			noTopAccountsToAttackString = (wealthStats.noTopAccountsToAttackOverflow ? `>${noTopAccountsToAttackString}` : noTopAccountsToAttackString);

			const percentTop100Wealth = (wealthStats.top100Wealth / wealthStats.totalWealth) * 100;

			writer.writeTableRow(
				`[${networkManager.name}](${relativeSummaryDirPath}/${networkManager.name.toLowerCase()}.summary.md)`,
				`${networkInfo.consensus}`,
				`${networkInfo.nodeCount}`,
				`${blockStats.totalBlocks}`,
				`${blockStats.producers.length}`,
				`${blockStats.validators.length}`,
				`${blockStats.noTopValidatorsToAttack}`,
				`${percentTop100Wealth.toPrecision(4)}%`,
				`${noTopAccountsToAttackString}`);
		}
		writer.write();

		writer.close();
	}
}
