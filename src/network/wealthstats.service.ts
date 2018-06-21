import { WealthStats } from "../model/WealthStats";
import { NetworkManager } from "./network.manager";

export abstract class WealthStatsService {
	private networkManager: NetworkManager;

	// =============================================================================
	// Abstract
	// =============================================================================

	public abstract async getWealthStats(): Promise<WealthStats>;

	// =============================================================================
	// Public
	// =============================================================================

	public setNetworkManager(networkManager: NetworkManager) {
		this.networkManager = networkManager;
		return this;
	}

	public get name() {
		return this.networkManager.networkInfo.name;
	}
}
