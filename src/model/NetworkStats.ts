import { BlockStatsPeriod } from "src/model/BlockStats";
import { NetworkInfo } from "src/model/NetworkInfo";
import { WealthStats } from "src/model/WealthStats";
import { NetworkManager } from "src/network/network.manager";

export interface NetworkStats {
	networkManager: NetworkManager;
	networkInfo: NetworkInfo;
	blockStats: BlockStatsPeriod;
	wealthStats: WealthStats;
}
