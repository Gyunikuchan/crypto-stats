import * as _ from "lodash";
import * as moment from "moment";

import logger from "../utils/logger";

export interface Block {
	height: number;
	producer: string;
	time: moment.Moment;
}

export abstract class BlockManager {
	protected startMoment: moment.Moment;
	protected endMoment: moment.Moment;
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

		logger.debug(`Got ${filteredBlocks.length} blocks`);
		return filteredBlocks;
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected audit() {
		// Check for unique block heights
		const unique = _.uniqBy(this.blocks, (block) => block.height);
		if (unique.length !== this.blocks.length)
			throw new Error("Duplicate block detected");

		// Check for time constraints
		const failedTimeConstraintCheck = _.some(this.blocks, (block: Block) => {
			if (block.time.isBefore(this.startMoment)) {
				logger.warn(`Block found before start: ${block.time}`);
				return true;
			}

			if (block.time.isAfter(this.endMoment)) {
				logger.warn(`Block found after end: ${block.time}`);
				return true;
			}

			return false;
		});

		if (failedTimeConstraintCheck)
			throw new Error("Block outside of time range detected");
	}
}
