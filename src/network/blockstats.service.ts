import * as fse from "fs-extra";
import * as moment from "moment";
import { Block } from "src/model/Block";
import { BlockStatsDay, BlockStatsPeriod, Producer, Validator } from "src/model/BlockStats";
import { NetworkManager } from "src/network/network.manager";
import logger from "src/util/logger";

export abstract class BlockStatsService {
	private networkManager: NetworkManager;

	// =============================================================================
	// Abstract
	// =============================================================================

	// Load blocks for the day from the relevant data sources, sorted by height (ascending)
	protected abstract async getBlocksDayFromSource(date: moment.Moment): Promise<Block[]>;

	// =============================================================================
	// Public
	// =============================================================================

	public setNetworkManager(networkManager: NetworkManager) {
		this.networkManager = networkManager;
		return this;
	}

	public get name() {
		return this.networkManager.name;
	}

	/**
	 * Get block stats for a period
	 * Expecting utc dates only
	 * Expecting endDate to be at least 24 hours ago (for finality and for padding)
	 */
	public async getBlockStats(startDate: moment.Moment, endDate: moment.Moment): Promise<BlockStatsPeriod> {
		logger.info(`[${this.name}] Getting block stats for period: ${startDate.format("YYYY-MM-DD")} - ${endDate.format("YYYY-MM-DD")}`);

		const latestEndDate = moment().subtract(23, "hours").subtract(59, "seconds");
		if (endDate.isAfter(latestEndDate))
			throw new Error(`[${this.name}] End date must be at least 24 hours ago`);

		const blockStatsPeriod: BlockStatsPeriod = {
			startDate,
			endDate,
			startHeight: undefined,
			endHeight: undefined,
			totalBlocks: 0,
			totalValidations: 0,
			producers: [],
			validators: [],
			noTopValidatorsToAttack: undefined,
		};

		// Loop days
		const producersMap = new Map<string, Producer>();
		const validatorsMap = new Map<string, Validator>();
		let lastHeightEnd;
		const currentDate = moment(startDate);

		while (!currentDate.isAfter(endDate)) {
			const blockStatsDay = await this.getBlockStatsDay(currentDate);

			// Check for overlaps
			if (lastHeightEnd != null && blockStatsDay.startHeight <= lastHeightEnd)
				throw new Error(`[${this.name}] Invalid start block: ${blockStatsDay.startHeight} (last: ${lastHeightEnd})`);

			// Update stats
			if (blockStatsPeriod.startHeight == null)
				blockStatsPeriod.startHeight = blockStatsDay.startHeight;

			blockStatsPeriod.endHeight = blockStatsDay.endHeight;
			blockStatsPeriod.totalBlocks += blockStatsDay.totalBlocks;
			blockStatsPeriod.totalValidations += blockStatsDay.totalValidations;

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
			lastHeightEnd = blockStatsDay.endHeight;
			currentDate.add(1, "day");
		}

		// Sort producers and validators by count (descending)
		blockStatsPeriod.producers = Array.from(producersMap.values());
		blockStatsPeriod.producers.sort((a, b) => b.count - a.count);

		blockStatsPeriod.validators = Array.from(validatorsMap.values());
		blockStatsPeriod.validators.sort((a, b) => b.count - a.count);

		// Calculated number to attack
		blockStatsPeriod.noTopValidatorsToAttack = this.getNoTopValidatorsToAttack(blockStatsPeriod);

		return blockStatsPeriod;
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	/**
	 * Attempts to get block stats for a single day from file first
	 * Loads from source and cache on file otherwise
	 */
	protected async getBlockStatsDay(date: moment.Moment) {
		logger.info(`[${this.name}] Getting block stats for day: ${date.format("YYYY-MM-DD")}`);

		// Try to load from file
		const blockStatsDirPath = `${__dirname}/../../data/${this.name}`;
		const blockStatsDayPath = `${blockStatsDirPath}/${date.format("YYYY-MM-DD")}`;

		let blockStatsDay: BlockStatsDay;
		try {
			const file = await fse.readFile(blockStatsDayPath);
			blockStatsDay = JSON.parse(file.toString());
			if (blockStatsDay) {
				logger.debug(`[${this.name}] Got block stats for day from file: ${blockStatsDay.totalBlocks}`);
				return blockStatsDay;
			}
		} catch (error) { }

		// Load from source
		blockStatsDay = await this.getBlockStatsDayFromSource(date);
		if (!blockStatsDay)
			throw new Error(`[${this.name}] Failed to get day block stats from source: ${date.format("YYYY-MM-DD")}`);

		// Write to file
		await fse.ensureDir(blockStatsDirPath);
		await fse.writeFile(blockStatsDayPath, JSON.stringify(blockStatsDay));

		logger.debug(`[${this.name}] Got block stats for day from source: ${blockStatsDay.totalBlocks}`);
		return blockStatsDay;
	}

	/**
	 * Load blocks for a single day from source and compute it's block stats
	 */
	protected async getBlockStatsDayFromSource(date: moment.Moment): Promise<BlockStatsDay> {
		// Load blocks from source
		logger.info(`[${this.name}] Getting blocks from source`);

		const blocksDay = await this.getBlocksDayFromSource(date);
		if (blocksDay == null || blocksDay.length === 0)
			return null;

		logger.debug(`[${this.name}] Got blocks from source: ${blocksDay.length}`);

		// Audit blocks
		this.auditBlocksDay(date, blocksDay);

		const blockStatsDay: BlockStatsDay = {
			date,
			startHeight: blocksDay[0].height,
			endHeight: blocksDay[blocksDay.length - 1].height,
			totalBlocks: blocksDay.length,
			totalValidations: 0,
			producers: [],
			validators: [],
		};

		// Loop blocks
		const producersMap = new Map<string, Producer>();
		const validatorsMap = new Map<string, Validator>();

		for (const block of blocksDay) {
			const combinedProducer = producersMap.get(block.producerId);
			if (!combinedProducer) {
				producersMap.set(block.producerId, { id: block.producerId, count: 1 });
			} else {
				combinedProducer.count += 1;
			}

			for (const validator of block.validatorIds) {
				const combinedValidator = validatorsMap.get(validator);
				if (!combinedValidator) {
					validatorsMap.set(validator, { id: validator, count: 1 });
				} else {
					combinedValidator.count += 1;
				}
			}

			blockStatsDay.totalValidations += block.validatorIds.length;
		}

		// Map producer and validator data
		blockStatsDay.producers = Array.from(producersMap.values());
		blockStatsDay.validators = Array.from(validatorsMap.values());

		logger.debug(`[${this.name}] Got producers from source: ${blockStatsDay.producers.length}`);
		logger.debug(`[${this.name}] Got validators from source: ${blockStatsDay.validators.length}`);

		return blockStatsDay;
	}

	/**
	 * Sanity check for blocks that are loaded from source
	 * Expecting blocks to be ordered by block height (ascending)
	 */
	protected auditBlocksDay(date: moment.Moment, blocksDay: Block[]) {
		logger.info(`[${this.name}] Auditing blocks for day: ${date.format("YYYY-MM-DD")}`);

		const startTime = date;
		const endTime = moment(date).endOf("day");

		// Loop blocks
		const startHeight = blocksDay[0].height;
		for (let i = 0; i < blocksDay.length; ++i) {
			const block = blocksDay[i];

			// Check for running block heights
			const expectedBlockHeight = startHeight + i;
			if (block.height !== expectedBlockHeight)
				throw new Error(`[${this.name}] Unexpected block height: expected=${expectedBlockHeight} got=${block.height}`);

			// Check for bad id
			if (!block.producerId)
				throw new Error(`[${this.name}] No producer: ${block.height}`);

			// Check for no validator
			if (block.validatorIds.length === 0)
				throw new Error(`[${this.name}] No validators: ${block.height}`);

			// Check for time constraints
			if (block.time.isBefore(startTime))
				throw new Error(`[${this.name}] Block before start: ${block.height}`);

			if (block.time.isAfter(endTime))
				throw new Error(`[${this.name}] Block after end: ${block.height}`);
		}
	}

	/**
	 * Computes the number of top validators required to attack the network
	 */
	protected getNoTopValidatorsToAttack(blockStatsConsolidated: BlockStatsPeriod): number {
		logger.info(`[${this.name}] Getting number of top validators to attack`);
		const fractionalToAttack = this.networkManager.networkInfo.percentToAttack / 100;
		const validationsToAttack = Math.floor(blockStatsConsolidated.totalValidations * fractionalToAttack);

		let noOfAddresses = 0;
		let validationsAccum = 0;

		for (const validator of blockStatsConsolidated.validators) {
			++noOfAddresses;
			validationsAccum += validator.count;

			logger.debug(`[${this.name}] Validator #${noOfAddresses} validated ${validator.count} times (Accumulated: ${validationsAccum})`);
			if (validationsAccum >= validationsToAttack)
				break;
		}

		logger.debug(`[${this.name}] Got number of top validators to attack: ${noOfAddresses}`);
		return noOfAddresses;
	}
}
