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
	protected totalNodeCount: number;
	/**
	 * Load all blocks for time period and sort them by time (ascending)
	 */
	public abstract async loadBlocks(start: moment.Moment, end: moment.Moment);

	/**
	 * Load the current total number of nodes
	 */
	public abstract async loadTotalNodeCount();

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
		// Loop blocks
		const startHeight = this.blocks[0].height;
		for (let i = 1; i < this.blocks.length; ++i) {
			const block = this.blocks[i];

			// Check for running block heights
			const expectedBlockHeight = startHeight + i;
			if (block.height !== expectedBlockHeight)
				throw new Error(`Missing block height: ${expectedBlockHeight}`);

			// Check for bad id
			if (!block.producer)
				throw new Error(`Bad account id detected: ${block.height}`);

			// Check for time constraints
			if (block.time.isBefore(this.startMoment))
				throw new Error(`Block found before start: ${block.height}`);

			if (block.time.isAfter(this.endMoment))
				throw new Error(`Block found after end: ${block.height}`);
		}

		// Check for unique block heights
		const unique = _.uniqBy(this.blocks, (block) => block.height);
		if (unique.length !== this.blocks.length)
			throw new Error(`Duplicate block detected: ${unique.length}`);
	}
}
