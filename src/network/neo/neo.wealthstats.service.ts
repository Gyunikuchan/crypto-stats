import { AccountWealth, WealthStats } from "src/model/WealthStats";
import { NEO_ACCOUNTS_SOURCE_URL } from "src/network/neo/neo.network.manager";
import { WealthStatsService } from "src/network/wealthstats.service";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";

export class NeoWealthStatsService extends WealthStatsService {
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
			url: `${NEO_ACCOUNTS_SOURCE_URL}`,
		});

		const accountResults = response.data.results;
		let totalWealth = 0;

		// Loop accounts
		const accounts: AccountWealth[] = [];
		for (const accountData of accountResults) {
			const id = accountData.account;
			const wealth = Number.parseFloat(accountData.neo);
			totalWealth += wealth;

			accounts.push({
				id,
				wealth,
			});
		}

		// Sort by wealth (highest first)
		accounts.sort((a, b) => b.wealth - a.wealth);

		// Convert wealth to percentage (1-100)
		accounts.forEach((account) => { account.wealth = account.wealth / totalWealth * 100; });

		logger.debug(`[${this.name}] Got top accounts wealth from source: ${accounts.length}`);
		return accounts;
	}
}
