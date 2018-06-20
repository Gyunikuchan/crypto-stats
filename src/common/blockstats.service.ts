import * as fs from "fs";
import * as moment from "moment";
import { Heap } from "typescript-collections";
import logger from "../utils/logger";
import { Block } from "./models/Block";
import { BlockStatsConsolidated, BlockStatsDay, Producer, Validator } from "./models/BlockStats";

export abstract class BlockStatsService {
	public name: string;
	public fractionalToAttack: number;	// 0 - 1

	// =============================================================================
	// Abstract
	// =============================================================================

	constructor(network: {
		name: string,
		fractionalToAttack: number,
	}) {
		this.name = network.name;
		this.fractionalToAttack = network.fractionalToAttack;
	}

	// Load blocks for the day from the relevant data sources, sorted by height (ascending)
	protected abstract async getBlocksDayFromSource(date: moment.Moment): Promise<Block[]>;

	// =============================================================================
	// Public
	// =============================================================================

	public async getBlockStats(dateStart: moment.Moment, dateEnd: moment.Moment): Promise<BlockStatsConsolidated> {
		logger.debug(`[${this.name}] Getting block stats for period: ${dateStart.format("YYYY-MM-DD")} - ${dateEnd.format("YYYY-MM-DD")}`);

		const blockStatsConsolidated: BlockStatsConsolidated = {
			dateStart,
			dateEnd,
			heightStart: undefined,
			heightEnd: undefined,
			totalBlocks: undefined,
			totalValidations: undefined,
			producers: undefined,
			validators: undefined,
			noTopValidatorsToAttack: undefined,
		};

		// Loop days
		const producersMap = new Map<string, Producer>();
		const validatorsMap = new Map<string, Validator>();
		let lastHeightEnd;
		const currentDate = moment(dateStart);

		while (!currentDate.isAfter(dateEnd)) {
			const blockStatsDay = await this.getBlockStatsDay(currentDate);

			// Check for overlaps
			if (lastHeightEnd != null && blockStatsDay.heightStart <= lastHeightEnd)
				throw new Error(`[${this.name}] Invalid start block: ${blockStatsDay.heightStart} (last: ${lastHeightEnd})`);

			// Update stats
			if (blockStatsConsolidated.heightStart == null)
				blockStatsConsolidated.heightStart = blockStatsDay.heightStart;

			blockStatsConsolidated.heightEnd = blockStatsDay.heightEnd;
			blockStatsConsolidated.totalBlocks += blockStatsDay.totalBlocks;
			blockStatsConsolidated.totalValidations += blockStatsDay.totalValidations;

			// Combine producers and validators
			blockStatsDay.producers.forEach((producer) => {
				const combinedProducer = producersMap.get(producer.id);
				if (!combinedProducer) {
					producersMap.set(producer.id, producer);
					return;
				}

				combinedProducer.count += producer.count;
			});

			blockStatsDay.validators.forEach((validator) => {
				const combinedValidator = validatorsMap.get(validator.id);
				if (!combinedValidator) {
					validatorsMap.set(validator.id, validator);
					return;
				}

				combinedValidator.count += validator.count;
			});

			// Next day
			lastHeightEnd = blockStatsDay.heightEnd;
			currentDate.add(1, "day");
		}

		// Heap sort producers and validators by count (descending)
		const producersHeap = new Heap<Producer>((a, b) => b.count - a.count);
		producersMap.forEach((producer, id) => { producersHeap.add(producer); });
		while (!producersHeap.isEmpty()) {
			blockStatsConsolidated.producers.push(producersHeap.removeRoot());
		}

		const validatorsHeap = new Heap<Validator>((a, b) => b.count - a.count);
		validatorsMap.forEach((validator, id) => { validatorsHeap.add(validator); });
		while (!validatorsHeap.isEmpty()) {
			blockStatsConsolidated.validators.push(validatorsHeap.removeRoot());
		}

		// Calculated number to attack
		blockStatsConsolidated.noTopValidatorsToAttack = this.calculateNoTopValidatorsToAttack(blockStatsConsolidated);

		return blockStatsConsolidated;
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected async getBlockStatsDay(date: moment.Moment) {
		logger.debug(`[${this.name}] Getting block stats for day: ${date.format("YYYY-MM-DD")}`);

		// Try to load from file
		const blockStatsDayPath = `../../data/${this.name}/${date.format("YYYY-MM-DD")}`;
		let blockStatsDay: BlockStatsDay = require(blockStatsDayPath);
		if (blockStatsDay != null) {
			logger.debug(`[${this.name}] Got block stats for day from file: ${blockStatsDay.totalBlocks}`);
			return blockStatsDay;
		}

		// Load from source
		blockStatsDay = await this.getBlockStatsDayFromSource(date);

		// Write to file
		fs.writeFileSync(blockStatsDayPath, JSON.stringify(blockStatsDay));

		logger.debug(`[${this.name}] Got block stats for day from source: ${blockStatsDay.totalBlocks}`);
		return blockStatsDay;
	}

	protected async getBlockStatsDayFromSource(date: moment.Moment): Promise<BlockStatsDay> {
		// Load blocks from source
		logger.debug(`[${this.name}] Getting blocks from source`);

		const blocksDay = await this.getBlocksDayFromSource(date);
		if (blocksDay == null || blocksDay.length === 0)
			return null;

		logger.debug(`[${this.name}] Got blocks from source: ${blocksDay.length}`);

		// Audit blocks
		this.auditBlocksDay(date, blocksDay);

		const blockStatsDay: BlockStatsDay = {
			date,
			heightStart: blocksDay[0].height,
			heightEnd: blocksDay[blocksDay.length - 1].height,
			totalBlocks: blocksDay.length,
			totalValidations: 0,
			producers: [],
			validators: [],
		};

		// Loop blocks
		const producersMap = new Map<string, Producer>();
		const validatorsMap = new Map<string, Validator>();

		for (const block of blocksDay) {
			const combinedProducer = producersMap.get(block.producer);
			if (!combinedProducer) {
				producersMap.set(block.producer, { id: block.producer, count: 1 });
			} else {
				combinedProducer.count += 1;
			}

			for (const validator of block.validators) {
				const combinedValidator = validatorsMap.get(validator);
				if (!combinedValidator) {
					validatorsMap.set(validator, { id: validator, count: 1 });
				} else {
					combinedValidator.count += 1;
				}
			}

			blockStatsDay.totalValidations += block.validators.length;
		}

		// Map producer and validator data
		blockStatsDay.producers = Array.from(producersMap.values());
		blockStatsDay.validators = Array.from(validatorsMap.values());

		logger.debug(`[${this.name}] Got producers from source: ${blockStatsDay.producers.length}`);
		logger.debug(`[${this.name}] Got validators from source: ${blockStatsDay.validators.length}`);

		return blockStatsDay;
	}

	protected auditBlocksDay(date: moment.Moment, blocksDay: Block[]) {
		logger.debug(`[${this.name}] Auditing blocks for day: ${date.format("YYYY-MM-DD")}`);

		const startTime = date;
		const endTime = moment(date).endOf("day");

		// Loop blocks
		const startHeight = blocksDay[0].height;
		for (let i = 1; i < blocksDay.length; ++i) {
			const block = blocksDay[i];

			// Check for running block heights
			const expectedBlockHeight = startHeight + i;
			if (block.height !== expectedBlockHeight)
				throw new Error(`[${this.name}] Unexpected block height: expected=${expectedBlockHeight} got=${block.height}`);

			// Check for bad id
			if (!block.producer)
				throw new Error(`[${this.name}] No producer: ${block.height}`);

			// Check for no validator
			if (block.validators.length === 0)
				throw new Error(`[${this.name}] No validators: ${block.height}`);

			// Check for time constraints
			if (block.time.isBefore(startTime))
				throw new Error(`[${this.name}] Block before start: ${block.height}`);

			if (block.time.isAfter(endTime))
				throw new Error(`[${this.name}] Block after end: ${block.height}`);
		}
	}

	protected calculateNoTopValidatorsToAttack(blockStatsConsolidated: BlockStatsConsolidated): number {
		logger.debug(`[${this.name}] Calculating number of top validators to take over`);

		const validationsToAttack = Math.floor(blockStatsConsolidated.totalValidations * this.fractionalToAttack);

		let noOfAddresses = 0;
		let validationsAccum = 0;
		for (const validator of blockStatsConsolidated.validators) {
			++noOfAddresses;
			validationsAccum += validator.count;

			logger.debug(`[${this.name}] Validator #${noOfAddresses} validated ${validator.count} times (Accumulated: ${validationsAccum})`);
			if (validationsAccum >= validationsToAttack)
				break;
		}

		return noOfAddresses;
	}
}
