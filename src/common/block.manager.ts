import * as moment from "moment";

import logger from "../config/logger";

export interface Block {
	producer: string;
	time: moment.Moment;
}

export abstract class BlockManager {
	protected blocks: Block[] = [];

	/**
	 * Load all blocks for time period and sort them by time (ascending)
	 */
	public abstract async load(start: moment.Moment, end: moment.Moment);

	public getBlocks(start: moment.Moment, end: moment.Moment) {
		// FIXME: Could be optimized with binary search for partition
		const filteredBlocks = this.blocks.filter((block) => {
			if (block.time.isBefore(start))
				return false;

			if (block.time.isAfter(end))
				return false;

			return true;
		});

		logger.debug({ domain: "BlockManager" }, `Got ${filteredBlocks.length} blocks`);
		return filteredBlocks;
	}
}
