import * as cheerio from "cheerio";
import * as moment from "moment";

import logger from "../utils/logger";
import { RetryRequest } from "../utils/retry_request";
import { StatsManager } from "../common/stats.manager";

export const QTUM_ACCOUNTS_SOURCE_URL = "https://qtum.info/misc/rich-list";
export const QTUM_BLOCKS_SOURCE_URL = "https://qtum.info/block";
export const QTUM_NODES_SOURCE_URL = "https://qtum.org/api/nodes";

export class QtumStatsManager extends StatsManager {
	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Qtum", consensus: "MPoS" }, {});
		this.totalWealth = 100;	// In percentage, 0-100
	}

	protected async onLoad() {
		await this.loadAccounts();
		await this.loadBlocks();
		await this.loadTotalNodeCount();
	}

	// =============================================================================
	// Loaders
	// =============================================================================

	protected async loadAccounts() {
		logger.debug(`Loading accounts`);

		const response = await RetryRequest.get({
			url: QTUM_ACCOUNTS_SOURCE_URL,
		});
		const $ = cheerio.load(response.data);
		const dataRows = $(`#app`).find(`tbody`).children();

		// Loop accounts
		dataRows.each((index, element) => {
			const id = element.children[1].children[0].children[0].children[0].data;
			const percentage = element.children[3].children[0].data;

			this.accounts.push({
				id,
				wealth: Number.parseFloat(percentage),
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
				url: QTUM_BLOCKS_SOURCE_URL,
				params: {
					date: dayCounter.format("YYYY-MM-DD"),
				},
			});

			const $ = cheerio.load(response.data);
			const dataRows = $(`#app`).find(`tbody`).children();

			// Loop blocks
			dataRows.each((index, element) => {
				// Check time
				const blockTimeString = element.children[1].children[0].data;
				const blockTimeMoment = moment.utc(blockTimeString);

				if (blockTimeMoment.isBefore(this.start))
					return;
				if (blockTimeMoment.isAfter(this.end))
					return;

				// Add block
				const height = Number.parseInt(element.children[0].children[0].children[0].children[0].data);
				const producer = element.children[3].children[0].children[0].children[0].data;
				this.blocks.push({
					height,
					producer,
					validators: [producer],
					time: blockTimeMoment,
				});
			});

			dayCounter.add(1, "day");

			logger.debug(`Loaded blocks for day: ${dayCounter.toString()}, ${this.blocks.length} blocks`);
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	protected async loadTotalNodeCount() {
		logger.debug(`Loading total node count`);

		const response = await RetryRequest.get({
			url: QTUM_NODES_SOURCE_URL,
		});
		const cityStats: any[] = response.data;

		this.totalNodeCount = 0;
		for (const cityStat of cityStats) {
			this.totalNodeCount += cityStat.count;
		}

		logger.debug(`Loaded total node count: ${this.totalNodeCount}`);
	}
}
