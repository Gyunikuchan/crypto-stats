import axios from "axios";
import * as querystring from "querystring";
import * as cheerio from "cheerio";
import * as moment from "moment";

import { Block, BlockManager } from "../common/block.manager";
import logger from "../utils/logger";

export const ETH_BLOCKS_SOURCE_URL = "https://etherscan.io/blocks";

export class EthBlockManager extends BlockManager {
	public async loadBlocks(start: moment.Moment, end: moment.Moment) {
		logger.debug(`Loading blocks: ${start.toString()} - ${end.toString()}`);
		this.startMoment = start;
		this.endMoment = end;

		// Loop pages 5 at a time
		let startReached = false;
		for (let page = 1; true; page += 4) {
			const results = await Promise.all([
				this.loadPage(start, end, page),
				this.loadPage(start, end, page + 1),
				this.loadPage(start, end, page + 2),
				this.loadPage(start, end, page + 3),
			]);

			// Combine blocks
			for (const result of results) {
				if (result.startReached) {
					startReached = true;
					break;
				}

				const lastHeight = (this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].height : Number.MAX_SAFE_INTEGER);
				const startIndex = result.blocks.findIndex((block) => block.height < lastHeight);
				this.blocks.push(...result.blocks.splice(startIndex));
			}

			if (startReached)
				break;
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		// Sanity check
		this.audit();

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}

	public async loadTotalNodeCount() {
		// TODO:
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async loadPage(start: moment.Moment, end: moment.Moment, page: number) {
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

		return {
			startReached,
			blocks,
		};
	}
}
