import axios from "axios";
import * as cheerio from "cheerio";
import * as moment from "moment";

import { Block, StatsManager } from "../common/stats.manager";
import logger from "../utils/logger";

export const NEO_ACCOUNTS_SOURCE_URL = "https://coranos.github.io/neo/charts/neo-account-data.html";
export const NEO_API_SOURCE_URL = "https://neoscan.io/api/main_net/v1";

export class NeoStatsManager extends StatsManager {
	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Neo", percentToTakeOver: 1 / 3 }, {});
		this.totalWealth = 100;		// In percentage, 0-100
		this.totalNodeCount = 7;	// No dynamic source
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
		const response = await axios.get(`${NEO_API_SOURCE_URL}/get_height`);
		const currentHeight = Number.parseInt(response.data.height);
		return currentHeight;
	}

	protected async loadBlock(height: number): Promise<Block> {
		logger.debug(`Loading block: ${height}`);

		const response = await axios.get(`${NEO_API_SOURCE_URL}/get_block/${height}`);
		const data = response.data;
		const block: Block = {
			height: Number.parseInt(data.index),
			producer: data.nextconsensus,
			time: moment.unix(data.time),
		};
		return block;
	}
}
