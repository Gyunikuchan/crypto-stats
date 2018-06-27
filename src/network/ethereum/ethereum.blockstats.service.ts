import * as cheerio from "cheerio";
import * as moment from "moment";
import { Block } from "src/model/Block";
import { ETH_API_SOURCE_URL, ETH_BLOCKS_SOURCE_URL } from "src/network/ethereum/ethereum.network.manager";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";
import { BlockStatsService } from "../blockstats.service";

const BLOCK_TIME_S = 15;
const BLOCKS_PER_PAGE = 100;

export class EthereumBlockStatsService extends BlockStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getBlocksDayFromSource(date: moment.Moment): Promise<Block[]> {
		const startTime = moment(date).startOf("day");
		const endTime = moment(date).endOf("day");

		// Load page blocks
		const estimatedPage = this.getEstimatedPage(startTime);
		const blockMap: Map<number, Block> = new Map();

		const traversalState = await this.getAndMergePageBlocks(estimatedPage, startTime, endTime, blockMap);

		let currentPage = estimatedPage - 1;
		while (traversalState.shouldTraverseBack) {
			const backTraversalState = await this.getAndMergePageBlocks(currentPage, startTime, endTime, blockMap);

			traversalState.shouldTraverseBack = backTraversalState.shouldTraverseBack;
			traversalState.endHeight = Math.max(
				traversalState.endHeight || Number.MIN_SAFE_INTEGER,
				backTraversalState.endHeight || Number.MIN_SAFE_INTEGER);
			currentPage -= 1;
		}

		currentPage = estimatedPage + 1;
		while (traversalState.shouldTraverseForward) {
			const forwardTraversalState = await this.getAndMergePageBlocks(currentPage, startTime, endTime, blockMap);

			traversalState.shouldTraverseForward = forwardTraversalState.shouldTraverseForward;
			traversalState.startHeight = Math.min(
				traversalState.startHeight || Number.MAX_VALUE,
				forwardTraversalState.startHeight || Number.MAX_VALUE);
			currentPage += 1;
		}

		// Fill in missing blocks
		const { startHeight, endHeight } = traversalState;
		const missingBlocks = [];

		for (let expectedHeight = startHeight + 1; expectedHeight < endHeight; ++expectedHeight) {
			if (!blockMap.get(expectedHeight)) {
				missingBlocks.push(await this.getBlockFromSource(expectedHeight));
			}
		}

		// Combine and sort
		const blocks = Array.from(blockMap.values());
		blocks.push(...missingBlocks);
		blocks.sort((a, b) => a.height - b.height);

		return blocks;
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	/**
	 * Assumes date is in the pass
	 * Assumes pages are in descending order
	 */
	protected getEstimatedPage(date: moment.Moment): number {
		logger.info(`[${this.name}] Getting estimated page: ${date.format("YYYY-MM-DD")}`);
		const secondsToTargetDate = moment().diff(date, "seconds");
		const blocksToTargetDate = secondsToTargetDate / BLOCK_TIME_S;
		const pagesToTargetDate = Math.floor(blocksToTargetDate / BLOCKS_PER_PAGE);
		logger.debug(`[${this.name}] Got estimated page: ${pagesToTargetDate}`);
		return pagesToTargetDate;
	}

	protected async getAndMergePageBlocks(page: number, startTime: moment.Moment, endTime: moment.Moment, blockMap: Map<number, Block>) {
		logger.info(`[${this.name}] Getting and merging page blocks: ${page}`);

		// Load page
		const pageBlocks = await this.getPageBlocksFromSource(page);
		const lastBlock = pageBlocks[0];
		const firstBlock = pageBlocks[pageBlocks.length - 1];
		let startHeight;
		let endHeight;

		// Merge blocks
		for (const block of pageBlocks) {
			if (block.time.isBefore(startTime))
				continue;

			if (block.time.isAfter(endTime))
				continue;

			blockMap.set(block.height, block);
			startHeight = Math.min(startHeight || Number.MAX_VALUE, block.height || Number.MAX_VALUE);
			endHeight = Math.max(endHeight || Number.MIN_VALUE, block.height || Number.MIN_VALUE);
		}

		const shouldTraverseBack = lastBlock.time.isBefore(endTime);
		const shouldTraverseForward = firstBlock.time.isAfter(startTime);

		logger.debug(`[${this.name}] Merged page blocks: ${blockMap.size} ${shouldTraverseBack} ${shouldTraverseForward}`);

		return {
			shouldTraverseBack,
			shouldTraverseForward,
			startHeight,
			endHeight,
		};
	}

	protected async getPageBlocksFromSource(page: number): Promise<Block[]> {
		logger.info(`[${this.name}] Getting blocks from page #${page}`);

		const response = await RetryRequest.get({
			url: ETH_BLOCKS_SOURCE_URL,
			params: {
				p: page,
				ps: BLOCKS_PER_PAGE,
			},
		});

		const $ = cheerio.load(response.data);
		const dataRows = $(`tbody`).children();

		// Loop blocks
		const blocks: Block[] = [];
		dataRows.each((index, element) => {
			if (element.children.length !== 9)
				return;

			// Check time
			const blockTimeString = element.children[1].children[0].attribs.title;
			const blockTimeMoment = moment.utc(blockTimeString, "MMM-DD-YYYY hh:mm:ss A");

			// Add block
			const height = Number.parseInt(element.children[0].children[0].children[0].data);
			const producer1 = element.children[4].children[0].attribs.title;		// If there is an alias
			const producer2 = element.children[4].children[0].children[0].data;	// If there isn't an alias
			const producer = producer1 || producer2;

			blocks.push({
				height,
				producerId: producer,
				validatorIds: [producer],
				time: blockTimeMoment,
			});
		});

		logger.info(`[${this.name}] Get blocks from page #${page}: ${blocks.length}`);
		return blocks;
	}

	protected async getBlockFromSource(height): Promise<Block> {
		logger.info(`[${this.name}] Getting block: ${height}`);

		const response = await RetryRequest.get({
			url: ETH_API_SOURCE_URL,
			params: {
				module: "block",
				action: "getblockreward",
				blockno: height,
			},
		});

		const result = response.data.result;
		const block: Block = {
			height: Number.parseInt(result.blockNumber),
			producerId: result.blockMiner,
			validatorIds: [result.blockMiner],
			time: moment.unix(result.timeStamp),
		};

		logger.debug(`[${this.name}] Got block`);
		return block;
	}
}
