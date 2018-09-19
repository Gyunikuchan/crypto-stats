import { NetworkInfo } from "src/model/NetworkInfo";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";
import { NetworkManager } from "src/network/network.manager";
import { QtumBlockStatsService } from "src/network/qtum/qtum.blockstats.service";
import { QtumWealthStatsService } from "src/network/qtum/qtum.wealthstats.service";

export const QTUM_ACCOUNTS_SOURCE_URL = "https://qtum.info/misc/rich-list";
export const QTUM_BLOCKS_SOURCE_URL = "https://qtum.info/block";
export const QTUM_NODES_SOURCE_URL = "https://nodes.qtum.org/api/nodes";

export class QtumNetworkManager extends NetworkManager {
	// =============================================================================
	// Abstract
	// =============================================================================

	constructor() {
		super({
			blockStatsService: new QtumBlockStatsService(),
			wealthStatsService: new QtumWealthStatsService(),
		});
	}

	public get name() {
		return `Qtum`;
	}

	protected async getNetworkInfoFromSource(): Promise<NetworkInfo> {
		return {
			name: this.name,
			summary:
				`Combining a modified Bitcoin Core infrastructure with an intercompatible version of the Ethereum Virtual Machine (EVM), ` +
				`Qtum merges the reliability of Bitcoin’s unfailing blockchain with the endless possibilities provided by smart contracts.`,
			consensus: `PoS`,
			website: `https://qtum.org`,
			sources: [
				QTUM_ACCOUNTS_SOURCE_URL,
				QTUM_BLOCKS_SOURCE_URL,
				QTUM_NODES_SOURCE_URL,
			],
			percentToAttack: 50,
			nodeCount: await this.getNodeCountFromSource(),
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async getNodeCountFromSource(): Promise<number> {
		logger.debug(`[${this.name}] Getting node count from source`);

		const response = await RetryRequest.get({
			url: QTUM_NODES_SOURCE_URL,
		});
		const cityStats: any[] = response.data;

		let nodeCount = 0;
		for (const cityStat of cityStats) {
			nodeCount += cityStat.count;
		}

		logger.debug(`[${this.name}] Got network count: ${nodeCount}`);
		return nodeCount;
	}
}
