import { NetworkInfo } from "src/model/NetworkInfo";
import { NeoBlockStatsService } from "src/network/neo/neo.blockstats.service";
import { NeoWealthStatsService } from "src/network/neo/neo.wealthstats.service";
import { NetworkManager } from "src/network/network.manager";
import { RetryRequest } from "src/util/retry_request";

export const NEO_ACCOUNTS_SOURCE_URL = "https://coranos.github.io/neo/charts/neo-account-data.json";
export const NEO_NODES_SOURCE_URL = "https://neo.org/consensus";

export class NeoNetworkManager extends NetworkManager {
	// =============================================================================
	// Abstract
	// =============================================================================

	constructor() {
		super({
			blockStatsService: new NeoBlockStatsService(),
			wealthStatsService: new NeoWealthStatsService(),
		});
	}

	public get name() {
		return `Neo`;
	}

	protected async getNetworkInfoFromSource(): Promise<NetworkInfo> {
		return {
			name: this.name,
			summary:
				`NEO is a non-profit community-based blockchain project that utilizes blockchain technology ` +
				`and digital identity to digitize assets, to automate the management of digital assets using smart contracts, ` +
				`and to realize a "smart economy" with a distributed network.`,
			consensus: `dBFT`,
			website: `https://neo.org`,
			sources: [
				NEO_ACCOUNTS_SOURCE_URL,
				NEO_NODES_SOURCE_URL,
			],
			percentToAttack: 1 / 3,
			nodeCount: await this.getNodeCountFromSource(),
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	private async getNodeCountFromSource(): Promise<number> {
		const response = await RetryRequest.get({
			url: `${NEO_NODES_SOURCE_URL}/getvalidators`,
		});

		const nodes: any[] = response.data;
		nodes.filter((value) => value.Active === "true" && value.Votes > 0);
		return nodes.length;
	}
}
