import axios from "axios";
import * as cheerio from "cheerio";
import * as moment from "moment";

import { Block, BlockManager } from "../common/block.manager";
import logger from "../config/logger";

export const QTUM_BLOCKS_SOURCE_URL = "https://qtum.info/block";

export class QtumBlockManager extends BlockManager {
	public async load(start: moment.Moment, end: moment.Moment) {
		logger.debug(`Loading blocks: ${start.toString()} - ${end.toString()}`);

		const dayCounter = moment(start).startOf("day");

		// Loop days (Check that day is before or equals to end)
		while (!dayCounter.isAfter(end)) {
			logger.debug(`Loading day: ${dayCounter.toString()}`);

			// FIXME: Can optimize with promises to reduce network delay times
			const response = await axios.get(QTUM_BLOCKS_SOURCE_URL, {
				params: {
					date: moment(dayCounter).utc().format("YYYY-MM-DD"),
				},
			});

			const $ = cheerio.load(response.data);
			const dataRows = $(`#app`).find(`tbody`).children();

			// Loop blocks
			dataRows.each((index, element) => {
				// Check time
				const blockTimeString = element.children[1].children[0].data;
				const blockTimeMoment = moment.utc(blockTimeString);

				if (blockTimeMoment.isBefore(start))
					return;
				if (blockTimeMoment.isAfter(end))
					return;

				// Add block
				const producer = element.children[3].children[0].children[0].children[0].data;
				this.blocks.push({
					producer,
					time: blockTimeMoment,
				});
			});

			dayCounter.add(1, "day");
		}

		// Sort by time
		this.blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());

		logger.debug(`Loaded blocks: ${this.blocks.length}`);
	}
}
