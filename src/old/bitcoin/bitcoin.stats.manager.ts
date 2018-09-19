import * as cheerio from "cheerio";
import * as moment from "moment";
import { delay } from "bluebird";

import logger from "../utils/logger";
import { RetryRequest } from "../utils/retry_request";
import { StatsManager } from "src/old/common/stats.manager";

export const BITCOIN_ACCOUNTS_SOURCE_URL = "https://btc.com/stats/rich-list";
export const BITCOIN_BLOCKS_SOURCE_URL = "https://chain.api.btc.com";
export const BITCOIN_NODES_SOURCE_URL = "https://coin.dance/nodes";

export class BitcoinStatsManager extends StatsManager {
	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Bitcoin", consensus: "PoW" }, {});
		this.totalWealth = 100;	// In percentage, 0-100
	}

	protected async onLoad() {
		await this.loadWealth();
		await this.loadBlocks();
		await this.loadTotalNodeCount();
	}

	// =============================================================================
	// Loaders
	// =============================================================================

	protected async loadWealth() {
		logger.debug(`Loading accounts`);

		const response = await RetryRequest.get({
			url: BITCOIN_ACCOUNTS_SOURCE_URL,
		});

		this.loadTotalWealth(response.data);
		this.loadAccountWealth(response.data);
	}

	private loadTotalWealth(responseData) {
		const $ = cheerio.load(responseData);
		const globalsString = $(`head`).find(`script`)[0].children[0].data;
		const globalsStringRows = globalsString.split(`\n`);
		const sumListRowString = globalsStringRows[4];
		const sumListString = sumListRowString.substring(sumListRowString.indexOf(`[`) + 1, sumListRowString.indexOf(`]`));
		const sumList = sumListString.split(`,`).map((sumString) => Number.parseFloat(sumString));

		this.totalWealth = 0;
		sumList.forEach((sum) => {
			this.totalWealth += sum;
		});

		logger.debug(`Loaded total wealth: ${this.totalWealth}`);
	}

	private loadAccountWealth(responseData) {
		const $ = cheerio.load(responseData);
		const dataRows = $(`body`).find(`div[class="diff-history"]`).find(`tbody`).children();

		// Loop accounts
		dataRows.each((index, element) => {
			if (index === 0)
				return;

			const id = element.children[3].children[1].children[1].children[0].data.trim();
			const balance1 = element.children[5].children[0].data;
			const balance2 = element.children[5].children[1].children[0].data;
			const balance = (balance1 + balance2).trim().replace(`,`, ``);

			this.accounts.push({
				id,
				wealth: Number.parseFloat(balance),
			});
		});

		logger.debug(`Loaded accounts: ${this.accounts.length}`);
	}

	protected async loadBlocks() {
		logger.debug(`Loading blocks: ${this.start.toString()} - ${this.end.toString()}`);

		const dayCounter = moment(this.start).utc().startOf("day");

		// Loop days
		while (dayCounter.isBefore(this.end)) {
			const response = await RetryRequest.get({
				url: `${BITCOIN_BLOCKS_SOURCE_URL}/v3/block/date/${dayCounter.format("YYYYMMDD")}`,
			});
			const data: any[] = response.data.data;

			// Loop blocks
			for (const block of data) {
				// Check time
				const blockTimeMoment = moment.unix(block.timestamp);

				if (blockTimeMoment.isBefore(this.start))
					continue;
				if (blockTimeMoment.isAfter(this.end))
					continue;

				const height = block.height;
				const producer = block.extras.pool_name;

				this.blocks.push({
					height,
					producer,
					validators: [producer],
					time: blockTimeMoment,
				});
			}

			await delay(1000);	// Rate limited
			dayCounter.add(1, "day");

			logger.debug(`Loaded blocks for day: ${dayCounter.toString()}, ${this.blocks.length} blocks`);
		}

		// Sort by time
		this.blocks.sort((a, b) => a.height - b.height);

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	protected async loadTotalNodeCount() {
		logger.debug(`Loading total node count`);

		const response = await RetryRequest.get({
			url: BITCOIN_NODES_SOURCE_URL,
		});

		const $ = cheerio.load(response.data);
		const nodeRows = $(`div[class="col-sm-6 col-lg-3 nodeCountBlock"]`);
		const nodes = nodeRows.first().children()[0].children[1].children[0].children[0].data;
		this.totalNodeCount = Number.parseInt(nodes);

		logger.debug(`Loaded total node count: ${this.totalNodeCount}`);
	}
}
