import * as cheerio from "cheerio";
import * as _ from "lodash";
import { AccountWealth, WealthStats } from "src/model/WealthStats";
import { ETH_ACCOUNTS_SOURCE_URL } from "src/network/ethereum/ethereum.network.manager";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";
import { WealthStatsService } from "../wealthstats.service";

export class EthereumWealthStatsService extends WealthStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getWealthStatsFromSource(): Promise<WealthStats> {
		const totalWealth = 100;
		const topAccountsWealth = await this.getTopAccountsWealthFromSource();
		const top10Wealth = this.getTopWealth(topAccountsWealth, 10);
		const top50Wealth = this.getTopWealth(topAccountsWealth, 50);
		const top100Wealth = this.getTopWealth(topAccountsWealth, 100);

		return {
			totalWealth,
			top10Wealth,
			top50Wealth,
			top100Wealth,
			topAccountsWealth,
			noTopAccountsToAttack: null,
			noTopAccountsToAttackOverflow: null,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async getTopAccountsWealthFromSource(): Promise<AccountWealth[]> {
		logger.info(`[${this.name}] Getting top accounts wealth from source`);

		const response = await RetryRequest.get({
			url: `${ETH_ACCOUNTS_SOURCE_URL}/1`,
			params: {
				ps: 100,
			},
		});


		const $ = cheerio.load(response.data);
		const dataRows = $(`body`).find(`tbody`).children();

		// Loop accounts
		const accounts: AccountWealth[] = [];
		dataRows.each((index, element) => {
			if (index > 99)
				return;

			const td = element.children[1];
			let id: string;
			let alias: string;

			if (td.children[0].name === "a") {
				id = td.children[0].children[0].data;
			} else if (td.children[1].name === "a") {
				id = td.children[1].children[0].data;
			} else if (td.children[2].name === "a") {
				id = td.children[2].children[0].data;
			}

			if (!!td.children[1] && td.children[1].type === "text" && td.children[1].data.trim().length > 0) {
				alias = _.trimStart(td.children[1].data, " | ");
			} else if (!!td.children[3] && td.children[3].type === "text" && td.children[3].data.trim().length > 0) {
				alias = _.trimStart(td.children[3].data, " | ");
			}

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
