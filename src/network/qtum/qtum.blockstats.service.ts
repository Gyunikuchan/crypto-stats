import * as cheerio from "cheerio";
import * as moment from "moment";
import { Block } from "src/model/Block";
import { RetryRequest } from "src/util/retry_request";
import { BlockStatsService } from "src/network/blockstats.service";
import { QTUM_BLOCKS_SOURCE_URL } from "src/network/qtum/qtum.network.manager";

export class QtumBlockStatsService extends BlockStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getBlocksDayFromSource(date: moment.Moment): Promise<Block[]> {
		const response = await RetryRequest.get({
			url: QTUM_BLOCKS_SOURCE_URL,
			params: {
				date: date.format("YYYY-MM-DD"),
			},
		});

		const $ = cheerio.load(response.data);
		const dataRows = $(`#app`).find(`tbody`).children();

		// Loop blocks
		const blocks: Block[] = [];
		dataRows.each((index, element) => {
			// Check time
			const blockTimeString = element.children[1].children[0].data;
			const blockTimeMoment = moment.utc(blockTimeString);

			// Add block
			const height = Number.parseInt(element.children[0].children[0].children[0].children[0].data);
			const producerId = element.children[3].children[0].children[0].children[0].data;
			blocks.push({
				height,
				producerId,
				validatorIds: [producerId],
				time: blockTimeMoment,
			});
		});

		// Sort by height (ascending)
		blocks.sort((a, b) => a.height - b.height);

		return blocks;
	}
}
