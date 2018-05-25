import * as _ from "lodash";
import * as moment from "moment";
import { Heap } from "typescript-collections";
import { Block } from "./stats.manager";
import logger from "../utils/logger";

export interface Producer {
	id: string;
	blockCount: number;
}

export interface Validator {
	id: string;
	blockCount: number;
}

export interface ProducerStats {
	totalBlocks: number;
	producers: Producer[];
	noTopProducersToTakeOver: number;
	totalValidations: number;
	validators: Validator[];
	noTopValidatorsToTakeOver: number;
}

export class ProducerService {
	public getStats(
		blocks: Block[],
		fractionalToTakeOver: number,
	): ProducerStats {
		const { totalBlocks, producers, totalValidations, validators } = this.getProducersValidators(blocks);
		const noTopProducersToTakeOver = this.getNoTopProducersToTakeOver(totalBlocks, producers, fractionalToTakeOver);
		const noTopValidatorsToTakeOver = this.getNoTopValidatorsToTakeOver(totalValidations, validators, fractionalToTakeOver);

		return {
			totalBlocks,
			noTopProducersToTakeOver,
			producers,
			totalValidations,
			validators,
			noTopValidatorsToTakeOver,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	/**
	 * Gets a list of producers sorted by block count (descending)
	 */
	protected getProducersValidators(blocks: Block[]) {
		logger.debug(`Getting producers and validators`);

		type ID = string;
		type BlockCount = number;
		const producersMap = new Map<ID, BlockCount>();
		const validatorsMap = new Map<ID, BlockCount>();
		let totalValidations = 0;

		// Load from blocks
		for (const block of blocks) {
			const producerCount = (producersMap.get(block.producer) || 0) + 1;
			producersMap.set(block.producer, producerCount);

			for (const validator of block.validators) {
				const validatorCount = (validatorsMap.get(validator) || 0) + 1;
				validatorsMap.set(validator, validatorCount);
			}

			totalValidations += block.validators.length;
		}

		// Transform and sort by count (highest first)
		const producersHeap = new Heap<Producer>((a, b) => b.blockCount - a.blockCount);
		producersMap.forEach((blockCount, id) => { producersHeap.add({ id, blockCount }); });
		const producers: Producer[] = [];
		while (!producersHeap.isEmpty()) {
			producers.push(producersHeap.removeRoot());
		}

		const validatorsHeap = new Heap<Validator>((a, b) => b.blockCount - a.blockCount);
		validatorsMap.forEach((blockCount, id) => { validatorsHeap.add({ id, blockCount }); });
		const validators: Validator[] = [];
		while (!validatorsHeap.isEmpty()) {
			validators.push(validatorsHeap.removeRoot());
		}

		// Sanity check
		this.auditProducers(producers);
		this.auditValidators(validators);

		logger.debug(`Got ${producers.length} producers and ${validators.length} validators`);
		return {
			totalBlocks: blocks.length,
			producers,
			totalValidations,
			validators,
		};
	}

	protected getNoTopProducersToTakeOver(
		totalBlocks: number,
		producers: Producer[],
		fractionalToTakeOver: number,
	) {
		logger.debug(`Getting number of top producers to take over`);

		const blocksToTakeOver = totalBlocks * fractionalToTakeOver;

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

	protected getNoTopValidatorsToTakeOver(
		totalValidations,
		validators: Validator[],
		fractionalToTakeOver: number,
	) {
		logger.debug(`Getting number of top validators to take over`);

		const validationsToTakeOver = totalValidations * fractionalToTakeOver;

		let noOfAddresses = 0;
		let validationsAccum = 0;
		for (const validator of validators) {
			++noOfAddresses;
			validationsAccum += validator.blockCount;

			logger.debug(`Validator #${noOfAddresses} validated ${validator.blockCount} times (Accumulated: ${validationsAccum})`);
			if (validationsAccum > validationsToTakeOver)
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

	protected auditValidators(validators: Validator[]) {
		logger.debug(`Auditing validators`);

		// Check for unique ids
		const unique = _.uniqBy(validators, (validator) => validator.id);
		if (unique.length !== validators.length)
			throw new Error(`Duplicate validator detected: ${unique.length} - ${unique[0]}`);

		// Check for no blocks
		const failedHasBlockCheck = _.some(validators, (validator) => !validator.blockCount);
		if (failedHasBlockCheck)
			throw new Error(`Validator with no block detected`);
	}
}
