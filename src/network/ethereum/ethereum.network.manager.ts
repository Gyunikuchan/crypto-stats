import * as cheerio from "cheerio";
import { NetworkInfo } from "src/model/NetworkInfo";
import { EthereumBlockStatsService } from "src/network/ethereum/ethereum.blockstats.service";
import { EthereumWealthStatsService } from "src/network/ethereum/ethereum.wealthstats.service";
import { NetworkManager } from "src/network/network.manager";
import logger from "src/util/logger";
import { RetryRequest } from "src/util/retry_request";

export const ETH_ACCOUNTS_SOURCE_URL = "https://etherscan.io/accounts";
export const ETH_BLOCKS_SOURCE_URL = "https://etherscan.io/blocks";
export const ETH_API_SOURCE_URL = "https://api.etherscan.io/api";
export const ETH_NODES_SOURCE_URL = "https://www.ethernodes.org/network";

export class EthereumNetworkManager extends NetworkManager {
	// =============================================================================
	// Abstract
	// =============================================================================

	constructor() {
		super({
			blockStatsService: new EthereumBlockStatsService(),
			wealthStatsService: new EthereumWealthStatsService(),
		});
	}

	public get name() {
		return `Ethereum`;
	}

	protected async getNetworkInfoFromSource(): Promise<NetworkInfo> {
		return {
			summary:
				`Ethereum is a decentralized platform that runs smart contracts: applications that ` +
				`run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.`,
			consensus: `PoW`,
			website: `https://www.ethereum.org`,
			sources: [
				ETH_ACCOUNTS_SOURCE_URL,
				ETH_BLOCKS_SOURCE_URL,
				ETH_API_SOURCE_URL,
				ETH_NODES_SOURCE_URL,
			],
			percentToAttack: 50,
			nodeCount: await this.getNodeCountFromSource(),
			aliases: new Map(),
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async getNodeCountFromSource(): Promise<number> {
		logger.debug(`[${this.name}] Getting node count from source`);

		const response = await RetryRequest.get({
			url: `${ETH_NODES_SOURCE_URL}/1`,
		});
		const $ = cheerio.load(response.data);
		const nodeRows = $(`div[class="col-sm-4 m-b-md"]`).find(`ul[class="list-group"]`);
		const nodeCountString = nodeRows.children()[0].children[2].children[0].data;
		const nodeCount = Number.parseInt(nodeCountString.substr(0, nodeCountString.indexOf(`(`)));

		logger.debug(`[${this.name}] Got network count: ${nodeCount}`);
		return nodeCount;
	}
}
