import axios from "axios";
import * as querystring from "querystring";
import * as cheerio from "cheerio";
import * as moment from "moment";

import { Block, BlockManager } from "../common/block.manager";
import logger from "../utils/logger";

export const ETH_BLOCKS_SOURCE_URL = "https://etherscan.io/blocks";

export class EthBlockManager extends BlockManager {
	public async load(start: moment.Moment, end: moment.Moment) {
		logger.debug(`Loading blocks: ${start.toString()} - ${end.toString()}`);
		this.startMoment = start;
		this.endMoment = end;

		let lastHeight;
		for (let page = 1; true; ++page) {
			logger.debug(`Loading page: ${page}, ${this.blocks.length} blocks`);

			// FIXME: Can optimize with promises to reduce network delay times
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

			dataRows.each((index, element) => {
				if (element.children.length !== 9)
					return;

				// Check height
				const height = Number.parseInt(element.children[0].children[0].children[0].data);
				if (lastHeight != null && height >= lastHeight)
					return;

				lastHeight = height;

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
				const producer = element.children[4].children[0].children[0].data;
				this.blocks.push({
					height,
					producer,
					time: blockTimeMoment,
				});
			});

			if (startReached)
				break;
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		// Sanity check
		this.audit();

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}
}
