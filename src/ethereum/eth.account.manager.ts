import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";

import logger from "../utils/logger";
import { AccountManager } from "../common/account.manager";

export const ETH_ACCOUNTS_SOURCE_URL = "https://etherscan.io/accounts";

export class EthAccountManager extends AccountManager {
	constructor() {
		super();
		this.totalAmount = 100;	// Amount is in percentage
	}

	public async loadAccounts() {
		logger.debug(`Loading accounts`);

		const response = await axios.get(`${ETH_ACCOUNTS_SOURCE_URL}/1`, {
			params: {
				ps: 100,
			},
		});


		const $ = cheerio.load(response.data);
		const dataRows = $(`body`).find(`tbody`).children();

		// Loop accounts
		dataRows.each((index, element) => {
			if (index > 99)
				return;

			const td = element.children[1];
			let id: string;

			if (!!td.children[1] && td.children[1].type === "text" && td.children[1].data.trim().length > 0) {
				id = _.trimStart(td.children[1].data, " | ");
			} else if (!!td.children[3] && td.children[3].type === "text" && td.children[3].data.trim().length > 0) {
				id = _.trimStart(td.children[3].data, " | ");
			} else if (td.children[0].name === "a") {
				id = td.children[0].children[0].data;
			} else if (td.children[1].name === "a") {
				id = td.children[1].children[0].data;
			} else if (td.children[2].name === "a") {
				id = td.children[2].children[0].data;
			}

			const percentage = element.children[3].children[0].data;

			this.accounts.push({
				id,
				amount: Number.parseFloat(percentage),
			});
		});

		// Sanity check
		this.audit();

		logger.debug(`Loaded accounts: ${this.accounts.length}`);
	}

	/**
	 * Amount is already in percentage
	 */
	public getAccumulatedWealthPercentageForAccountsCount(accountsCount: number) {
		return this.getAccumulatedAmountForAccountsCount(accountsCount);
	}
}
