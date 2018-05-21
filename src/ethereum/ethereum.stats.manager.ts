import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";
import * as moment from "moment";

import { Block, StatsManager } from "../common/stats.manager";
import logger from "../utils/logger";

export const ETH_ACCOUNTS_SOURCE_URL = "https://etherscan.io/accounts";
export const ETH_BLOCKS_SOURCE_URL = "https://etherscan.io/blocks";
export const ETH_NODES_SOURCE_URL = "https://www.ethernodes.org/network";

export class EthereumStatsManager extends StatsManager {
	constructor(
		start: moment.Moment,
		end: moment.Moment,
	) {
		super({ start, end, name: "Ethereum", percentToTakeOver: 0.5 }, {});
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
				wealth: Number.parseFloat(percentage),
			});
		});

		logger.debug(`Loaded accounts: ${this.accounts.length}`);
	}

	protected async loadBlocks() {
		logger.debug(`Loading blocks: ${this.start.toString()} - ${this.end.toString()}`);

		// Loop pages 5 at a time
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
				if (result.startReached) {
					startReached = true;
					break;
				}

				const lastHeight = (this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].height : Number.MAX_SAFE_INTEGER);
				const startIndex = result.blocks.findIndex((block) => block.height < lastHeight);
				const newBlocks = result.blocks.splice(startIndex);
				this.blocks.push(...newBlocks);
				// console.log("BLOCKS", lastHeight, newBlocks[0].height, newBlocks[newBlocks.length - 1].height);
			}

			if (startReached)
				break;
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	private async loadBlocksPage(start: moment.Moment, end: moment.Moment, page: number) {
		logger.debug(`Loading page: ${page}`);

		const response = await axios.get(ETH_BLOCKS_SOURCE_URL, {
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
			const producer = element.children[4].children[0].children[0].data;
			blocks.push({
				height,
				producer,
				time: blockTimeMoment,
			});
		});

		if (blocks.length > 0)
			logger.debug(`Loaded page: ${blocks[0].height} - ${blocks[blocks.length - 1].height}`);

		return {
			startReached,
			blocks,
		};
	}

	protected async loadTotalNodeCount() {
		logger.debug(`Loading total node count`);

		const response = await axios.get(`${ETH_NODES_SOURCE_URL}/1`);
		const $ = cheerio.load(response.data);
		const nodeRows = $(`div[class="col-sm-4 m-b-md"]`).find(`ul[class="list-group"]`);
		const totalNodeCountPercent = nodeRows.children()[0].children[2].children[0].data;
		this.totalNodeCount = Number.parseFloat(totalNodeCountPercent.substr(0, totalNodeCountPercent.indexOf(`(`)));

		logger.debug(`Loaded total node count: ${this.totalNodeCount}`);
	}
}
