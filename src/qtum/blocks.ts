import axios from "axios";
import * as cheerio from "cheerio";
import * as moment from "moment";
import logger from "../config/logger";

export interface Block {
	miner: string;
	time: moment.Moment;
}

export async function getBlocks(start: moment.Moment, end: moment.Moment) {
	logger.debug(`Getting blocks`);
	const blocks: Block[] = [];

	// Loop days (Check that day is before or equals to end)
	const dayCounter = moment(start).startOf("day");
	while (!dayCounter.isAfter(end)) {
		logger.debug(`Day: ${dayCounter}`);
		const response = await axios.get("https://qtum.info/block", {
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
			const miner = element.children[3].children[0].children[0].children[0].data;

			blocks.push({
				miner,
				time: blockTimeMoment,
			});
		});

		dayCounter.add(1, "day");
	}

	// Sort by time
	blocks.sort((a, b) => a.time.valueOf() - b.time.valueOf());
	logger.debug(`Got blocks`);
	return blocks;
}
