import axios from "axios";
import * as cheerio from "cheerio";

import logger from "../utils/logger";
import { AccountManager } from "../common/account.manager";

export const QTUM_ACCOUNTS_SOURCE_URL = "https://qtum.info/misc/rich-list";

export class QtumAccountManager extends AccountManager {
	constructor() {
		super();
		this.totalAmount = 1;	// Amount is in percentage
	}

	public async load() {
		logger.debug(`Loading accounts`);

		const response = await axios.get(QTUM_ACCOUNTS_SOURCE_URL);
		const $ = cheerio.load(response.data);
		const dataRows = $(`#app`).find(`tbody`).children();

		// Loop accounts
		dataRows.each((index, element) => {
			const id = element.children[0].children[0].data;
			const percentage = element.children[3].children[0].data;

			this.accounts.push({
				id,
				amount: Number.parseFloat(percentage),
			});
		});

		logger.debug(`Loaded accounts: ${this.accounts.length}`);
	}
}
