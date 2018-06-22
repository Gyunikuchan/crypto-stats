import * as cheerio from "cheerio";
import { AccountWealth, WealthStats } from "src/model/WealthStats";
import { QTUM_ACCOUNTS_SOURCE_URL } from "src/network/qtum/qtum.network.manager";
import { WealthStatsService } from "src/network/wealthstats.service";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";

export class QtumWealthStatsService extends WealthStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getWealthStatsFromSource(): Promise<WealthStats> {
		const totalWealth = 100;
		const topAccountsWealth = await this.getTopAccountsWealthFromSource();
		const top10Wealth = this.getTopWealth(topAccountsWealth, 10);
		const top50Wealth = this.getTopWealth(topAccountsWealth, 50);
		const top100Wealth = this.getTopWealth(topAccountsWealth, 100);
		const { noTopAccountsToAttack, noTopAccountsToAttackOverflow } = this.getNoTopAccountsToAttack(totalWealth, topAccountsWealth);

		return {
			totalWealth,
			top10Wealth,
			top50Wealth,
			top100Wealth,
			topAccountsWealth,
			noTopAccountsToAttack,
			noTopAccountsToAttackOverflow,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async getTopAccountsWealthFromSource(): Promise<AccountWealth[]> {
		logger.info(`[${this.name}] Getting top accounts wealth from source`);

		const response = await RetryRequest.get({
			url: QTUM_ACCOUNTS_SOURCE_URL,
		});
		const $ = cheerio.load(response.data);
		const dataRows = $(`#app`).find(`tbody`).children();

		// Loop accounts
		const accounts: AccountWealth[] = [];
		dataRows.each((index, element) => {
			const id = element.children[1].children[0].children[0].children[0].data;
			const percentage = element.children[3].children[0].data;

			accounts.push({
				id,
				wealth: Number.parseFloat(percentage),
			});
		});

		logger.debug(`[${this.name}] Got top accounts wealth from source: ${accounts.length}`);
		return accounts;
	}
}
