import * as _ from "lodash";
import * as moment from "moment";
import { Block } from "./stats.manager";
import logger from "../utils/logger";

export interface Producer {
	id: string;
	blockCount: number;
}

export class ProducerService {
	public getStats(
		blocks: Block[],
		percentToTakeOver: number,
	) {
		const producers = this.getProducers(blocks);
		const noTopProducersToTakeOver = this.getNoTopProducersToTakeOver(blocks, producers, percentToTakeOver);

		return {
			producers,
			totalBlocks: blocks.length,
			noTopProducersToTakeOver,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	/**
	 * Gets a list of producers sorted by block count (descending)
	 */
	protected getProducers(
		blocks: Block[],
	) {
		logger.debug(`Getting producers`);

		type ProducerId = string;
		type BlockCount = number;
		const producersMap = new Map<ProducerId, BlockCount>();

		// Load producers from blocks
		for (const block of blocks) {
			const blockCount = (producersMap.get(block.producer) || 0) + 1;
			producersMap.set(block.producer, blockCount);
		}

		// Sort by block count (descending)
		const sortedProducers = [...producersMap.entries()].sort((a, b) => b[1] - a[1]);

		// Transform
		const producers: Producer[] = sortedProducers.map((producer) => { return { id: producer[0], blockCount: producer[1] }; });

		// Sanity check
		this.auditProducers(producers);

		return producers;
	}

	protected getNoTopProducersToTakeOver(
		blocks: Block[],
		producers: Producer[],
		percentToTakeOver: number,
	) {
		logger.debug(`Getting number of top producers to take over`);

		const blocksToTakeOver = blocks.length * percentToTakeOver;

		let noOfAddresses = 0;
		let blocksAccum = 0;
		for (const producer of producers) {
			++noOfAddresses;
			blocksAccum += producer.blockCount;

			logger.debug(`Producer #${noOfAddresses} produced ${producer.blockCount} times (Accumulated: ${blocksAccum})`);
			if (blocksAccum > blocksToTakeOver)
				break;
		}

		return noOfAddresses;
	}

	// =============================================================================
	// Sanity Checks
	// =============================================================================

	protected auditProducers(producers: Producer[]) {
		logger.debug(`Auditing producers`);

		// Check for unique ids
		const unique = _.uniqBy(producers, (producer) => producer.id);
		if (unique.length !== producers.length)
			throw new Error(`Duplicate producer detected: ${unique.length} - ${unique[0]}`);

		// Check for no blocks
		const failedHasBlockCheck = _.some(producers, (producer: Producer) => !producer.blockCount);
		if (failedHasBlockCheck)
			throw new Error(`Producer with no block detected`);
	}
}
