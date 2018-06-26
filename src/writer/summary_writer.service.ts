import * as _ from "lodash";
import { NetworkStats } from "src/model/NetworkStats";
import logger from "src/util/logger";
import { MDWriter } from "src/util/md_writer";

export class SumaryWriterService {
	public static async write(summaryDirPath: string, networkStats: NetworkStats) {
		logger.info(`Writing summary network stats: ${networkStats.networkInfo.name}`);

		// Open file
		const writer: MDWriter = new MDWriter();
		await writer.open(summaryDirPath, `${networkStats.networkInfo.name.toLowerCase()}.summary.md`);

		// Write
		this.writeSummary(writer, networkStats);
		writer.writeDivider();
		this.writeBlockStats(writer, networkStats);
		writer.writeDivider();
		this.writeWealthStats(writer, networkStats);
		writer.write();

		writer.close();
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private static writeSummary(writer: MDWriter, networkStats: NetworkStats) {
		const { networkInfo } = networkStats;

		writer.writeHeader(networkInfo.name, 1);
		writer.writeLn(networkInfo.summary);

		writer.writeTableHeader(`Attribute`, `Description`);
		writer.writeTableRow(`---`, `---`);
		writer.writeTableRow(`**Website**`, networkInfo.website);
		writer.writeTableRow(`**Sources**`, networkInfo.sources.join(`<br/>`));
		writer.writeTableRow(`**Consensus**`, networkInfo.consensus);
		writer.writeTableRow(`**Percent to Attack**`, `${networkInfo.percentToAttack.toPrecision(4)}%`);
		writer.writeTableRow(`**Total nodes**`, networkInfo.nodeCount.toString());
	}

	private static writeBlockStats(writer: MDWriter, networkStats: NetworkStats) {
		const { blockStats } = networkStats;

		writer.writeHeader(`Block Stats`, 2);

		// Metrics
		writer.writeTableHeader(`Metric`, `Result`);
		writer.writeTableRow(`---`, `---`);
		writer.writeTableRow(`Period`, `${blockStats.startDate.format("YYYY-MM-DD")} - ${blockStats.endDate.format("YYYY-MM-DD")}`);
		writer.writeTableRow(`Blocks`, `${blockStats.startHeight} - ${blockStats.endHeight}`);
		writer.writeTableRow(`Total blocks`, `${blockStats.totalBlocks}`);
		writer.writeTableRow(`Total producers`, `${blockStats.producers.length}`);
		writer.writeTableRow(`Total validations`, `${blockStats.totalValidations}`);
		writer.writeTableRow(`Total validators`, `${blockStats.validators.length}`);
		writer.writeTableRow(`No of top validators to attack`, `${blockStats.noTopValidatorsToAttack}`);
		writer.write();
		writer.writeLn();

		// Top validators
		writer.writeTableHeaderQuoted(`Rank`, `Address`, `Validations`);
		writer.writeTableRowQuoted(`---`, `---`, `---`);
		for (const index of [..._.range(0, 19), ..._.range(19, 100, 10)]) {
			const validator = blockStats.validators[index];
			if (validator)
				writer.writeTableRowQuoted(`${(index + 1)}`, `${validator.id}`, `${validator.count}`);
		}
	}

	private static writeWealthStats(writer: MDWriter, networkStats: NetworkStats) {
		const { wealthStats } = networkStats;

		writer.writeHeader(`Wealth Stats`, 2);

		// Metrics
		writer.writeTableHeader(`Metric`, `Result`);
		writer.writeTableRow(`---`, `---`);

		if (wealthStats.totalWealth !== 100)
			writer.writeTableRow(`Total wealth`, `${wealthStats.totalWealth.toPrecision(4)}%`);

		const top10Wealth = wealthStats.top10Wealth.toPrecision(5);
		const top10WealthPercentage = (wealthStats.top10Wealth / wealthStats.totalWealth) * 100;
		writer.writeTableRow(`Top 10 accounts wealth`, `${top10Wealth} (${top10WealthPercentage.toPrecision(4)}%)`);

		const top50Wealth = wealthStats.top50Wealth.toPrecision(5);
		const top50WealthPercentage = (wealthStats.top50Wealth / wealthStats.totalWealth) * 100;
		writer.writeTableRow(`Top 50 accounts wealth`, `${top50Wealth} (${top50WealthPercentage.toPrecision(4)}%)`);

		const top100Wealth = wealthStats.top100Wealth.toPrecision(5);
		const top100WealthPercentage = (wealthStats.top100Wealth / wealthStats.totalWealth) * 100;
		writer.writeTableRow(`Top 100 accounts wealth`, `${top100Wealth} (${top100WealthPercentage.toPrecision(4)}%)`);

		let noTopAccountsToAttackString = (wealthStats.noTopAccountsToAttack != null ? wealthStats.noTopAccountsToAttack.toString() : `-`);
		noTopAccountsToAttackString = (wealthStats.noTopAccountsToAttackOverflow ? `>${noTopAccountsToAttackString}` : noTopAccountsToAttackString);
		writer.writeTableRow(`No of top accounts to attack`, noTopAccountsToAttackString);
		writer.write();
		writer.writeLn();

		// Top accounts
		writer.writeTableHeaderQuoted(`Rank`, `Address`, `Wealth`);
		writer.writeTableRowQuoted(`---`, `---`, `---`);
		for (const index of [..._.range(0, 19), ..._.range(19, 100, 10)]) {
			const account = wealthStats.topAccountsWealth[index];
			if (!account)
				break;

			// Special case if wealth is already in percentage
			if (wealthStats.totalWealth === 100) {
				writer.writeTableRowQuoted(`${(index + 1)}`, `${account.id}`, `${account.wealth.toPrecision(4)}%`);
				continue;
			}

			const wealthPercentage = (account.wealth / wealthStats.totalWealth) * 100;
			writer.writeTableRowQuoted(`${(index + 1)}`, `${account.id}`, `${account.wealth.toPrecision(5)} (${wealthPercentage.toPrecision(4)}%)`);
		}
	}
}
