import * as _ from "lodash";
import * as cheerio from "cheerio";
import * as moment from "moment";

import logger from "../utils/logger";
import { RetryRequest } from "../utils/retry_request";
import { Block, StatsManager } from "src/old/common/stats.manager";

export const ETH_ACCOUNTS_SOURCE_URL = "https://etherscan.io/accounts";
export const ETH_BLOCKS_SOURCE_URL = "https://etherscan.io/blocks";
export const ETH_API_SOURCE_URL = "https://api.etherscan.io/api";
export const ETH_NODES_SOURCE_URL = "https://www.ethernodes.org/network";

export class EthereumStatsManager extends StatsManager {
	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Ethereum", consensus: "PoW" }, {});
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
			url: `${ETH_ACCOUNTS_SOURCE_URL}/1`,
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

			this.accounts.push({
				id,
				alias,
				wealth: Number.parseFloat(percentage),
			});
		});

		logger.debug(`Loaded accounts: ${this.accounts.length}`);
	}

	protected async loadBlocks() {
		logger.debug(`Loading blocks: ${this.start.toString()} - ${this.end.toString()}`);

		// Loop pages 4 at a time
		let startReached = false;
		for (let page = 1; true; page += 4) {
			const results = await Promise.all([
				this.loadBlocksPage(this.start, this.end, page),
				this.loadBlocksPage(this.start, this.end, page + 1),
				this.loadBlocksPage(this.start, this.end, page + 2),
				this.loadBlocksPage(this.start, this.end, page + 3),
			]);

			// Combine blocks
			for (const result of results) {
				if (result.length === 0) {
					startReached = true;
					break;
				}

				logger.debug(`Parsing blocks: ${result[result.length - 1].height} - ${result[0].height}`);

				const lastHeight = (this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].height : Number.MAX_SAFE_INTEGER);
				const nextHeight = lastHeight - 1;
				const startIndex = result.findIndex((block) => block.height <= nextHeight);
				const newBlocks = result.splice(startIndex);

				// Add missing blocks
				if (this.blocks.length > 0) {
					const noMissingBlocks = nextHeight - newBlocks[0].height;
					for (let i = 0; i < noMissingBlocks; ++i) {
						const missingHeight = nextHeight - i;
						logger.debug(`Loading missing block: ${missingHeight}`);

						const missingBlock = await this.loadBlock(missingHeight);
						this.blocks.push(missingBlock);
					}
				}

				this.blocks.push(...newBlocks);
			}

			// Escape outer loop
			if (startReached)
				break;
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	protected async loadBlocksPage(start: moment.Moment, end: moment.Moment, page: number) {
		logger.debug(`Loading page: ${page}`);

		const response = await RetryRequest.get({
			url: ETH_BLOCKS_SOURCE_URL,
			params: {
				p: page,
				ps: 100,
			},
		});

		const $ = cheerio.load(response.data);
		const dataRows = $(`tbody`).children();

		// Loop blocks
		let startReached = false;
		const blocks: Block[] = [];
		dataRows.each((index, element) => {
			if (element.children.length !== 9)
				return;

			// Check time
			const blockTimeString = element.children[1].children[0].attribs.title;
			const blockTimeMoment = moment.utc(blockTimeString, "MMM-DD-YYYY hh:mm:ss A");

			if (blockTimeMoment.isBefore(start)) {
				startReached = true;
				return;
			}
			if (blockTimeMoment.isAfter(end)) {
				return;
			}

			// Add block
			const height = Number.parseInt(element.children[0].children[0].children[0].data);
			const producer1 = element.children[4].children[0].attribs.title;		// If there is an alias
			const producer2 = element.children[4].children[0].children[0].data;	// If there isn't an alias
			const producer = producer1 || producer2;

			blocks.push({
				height,
				producer,
				validators: [producer],
				time: blockTimeMoment,
			});
		});

		return blocks;
	}

	protected async loadBlock(height: number): Promise<Block> {
		const response = await RetryRequest.get({
			url: ETH_API_SOURCE_URL,
			params: {
				module: "block",
				action: "getblockreward",
				blockno: height,
			},
		});

		const result = response.data.result;
		const block: Block = {
			height: Number.parseInt(result.blockNumber),
			producer: result.blockMiner,
			validators: [result.blockMiner],
			time: moment.unix(result.timeStamp),
		};

		return block;
	}

	protected async loadTotalNodeCount() {
		logger.debug(`Loading total node count`);

		const response = await RetryRequest.get({
			url: `${ETH_NODES_SOURCE_URL}/1`,
		});
		const $ = cheerio.load(response.data);
		const nodeRows = $(`div[class="col-sm-4 m-b-md"]`).find(`ul[class="list-group"]`);
		const totalNodeCountString = nodeRows.children()[0].children[2].children[0].data;
		this.totalNodeCount = Number.parseInt(totalNodeCountString.substr(0, totalNodeCountString.indexOf(`(`)));

		logger.debug(`Loaded total node count: ${this.totalNodeCount}`);
	}
}
