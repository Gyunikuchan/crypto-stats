import logger from "../config/logger";
import { Block } from "./block.manager";

export interface Producer {
	id: string;
	blockCount: number;
}

export class ProducerManager {
	protected blocks: Block[] = [];				// Sorted by time
	protected producers: Producer[] = [];	// Sorted by block count (descending)

	constructor(blocks: Block[]) {
		this.blocks = blocks;
		this.loadProducers();
	}

	public getProducer(index: number) {
		return this.producers[index];
	}

	public getProducersCount() {
		return this.producers.length;
	}

	public getNoProducersFor51Percent() {
		const percent51 = Math.floor(this.producers.length * 0.51);

		let noOfAddresses = 0;
		let blocksAccum = 0;
		for (const producer of this.producers) {
			++noOfAddresses;
			blocksAccum += producer.blockCount;

			logger.debug(`Producer #${noOfAddresses} mined ${producer.blockCount} blocks, totalling ${blocksAccum} blocks`);
			if (blocksAccum > percent51)
				break;
		}

		return noOfAddresses;
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private loadProducers() {
		type ProducerId = string;
		type BlockCount = number;
		const producersMap = new Map<ProducerId, BlockCount>();

		// Load producers from blocks
		for (const block of this.blocks) {
			const blockCount = (producersMap.get(block.producer) || 0) + 1;
			producersMap.set(block.producer, blockCount);
		}

		// Sort by block count (descending)
		const sortedProducers = [...producersMap.entries()].sort((a, b) => b[1] - a[1]);

		// Transform
		this.producers = sortedProducers.map((producer) => { return { id: producer[0], blockCount: producer[1] }; });
	}
}