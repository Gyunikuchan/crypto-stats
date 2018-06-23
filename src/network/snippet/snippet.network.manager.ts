import { NetworkInfo } from "src/model/NetworkInfo";
import { NetworkManager } from "../network.manager";
import { SnippetBlockStatsService } from "./snippet.blockstats.service";
import { SnippetWealthStatsService } from "./snippet.wealthstats.service";

export const SNIPPET_SOURCE_URL = "TODO:";

export class SnippetNetworkManager extends NetworkManager {
	// =============================================================================
	// Abstract
	// =============================================================================

	constructor() {
		super({
			blockStatsService: new SnippetBlockStatsService(),
			wealthStatsService: new SnippetWealthStatsService(),
		});
	}

	public get name() {
		return `TODO:`;
	}

	protected async getNetworkInfoFromSource(): Promise<NetworkInfo> {
		return {} as NetworkInfo;
	}
}
