import * as cheerio from "cheerio";
import * as moment from "moment";

import logger from "../utils/logger";
import { RetryRequest } from "../utils/retry_request";
import { Block, StatsManager } from "../common/stats.manager";

export const NEO_ACCOUNTS_SOURCE_URL = "https://coranos.github.io/neo/charts/neo-account-data.html";
export const NEO_API_SOURCE_URL = "https://neoscan.io/api/main_net/v1";

export class NeoStatsManager extends StatsManager {
	private readonly mockValidators: string[] = [];

	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Neo" }, {});
		this.totalWealth = 100;		// In percentage, 0-100
		this.totalNodeCount = 7;	// No dynamic source

		// Populate fake validators
		for (let i = 0; i < this.totalNodeCount; ++i) {
			this.mockValidators.push(i.toString());
		}
	}

	protected async onLoad() {
		// await this.loadAccounts();
		await this.loadBlocks();
	}

	// =============================================================================
	// Loaders
	// =============================================================================

	protected async loadBlocks() {
		logger.debug(`Loading blocks: ${this.start.toString()} - ${this.end.toString()}`);

		// Get current height
		let height = await this.loadCurrentHeight();

		// Loop blocks 5 at a time
		let startReached = false;
		for (; height >= 0; height -= 5) {
			const results = await Promise.all([
				this.loadBlock(height),
				this.loadBlock(height - 1),
				this.loadBlock(height - 2),
				this.loadBlock(height - 3),
				this.loadBlock(height - 4),
			]);

			logger.debug(`Parsing blocks: ${results[results.length - 1].height} - ${results[0].height}`);

			// Combine blocks
			for (const result of results) {
				// Check time
				if (result.time.isBefore(this.start)) {
					startReached = true;
					break;
				}
				if (result.time.isAfter(this.end))
					continue;

				this.blocks.push(result);
			}

			if (startReached)
				break;
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	protected async loadCurrentHeight(): Promise<number> {
		const response = await RetryRequest.get({
			url: `${NEO_API_SOURCE_URL}/get_height`,
		});
		const currentHeight = Number.parseInt(response.data.height);
		return currentHeight;
	}

	protected async loadBlock(height: number): Promise<Block> {
		const response = await RetryRequest.get({
			url: `${NEO_API_SOURCE_URL}/get_block/${height}`,
		});
		const data = response.data;

		const block: Block = {
			height: Number.parseInt(data.index),
			producer: data.nextconsensus,
			validators: this.mockValidators,
			time: moment.unix(data.time),
		};
		return block;
	}
}
