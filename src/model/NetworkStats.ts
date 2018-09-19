import { BlockStatsPeriod } from "src/model/BlockStats";
import { NetworkInfo } from "src/model/NetworkInfo";
import { WealthStats } from "src/model/WealthStats";

export interface NetworkStats {
	networkInfo: NetworkInfo;
	blockStats: BlockStatsPeriod;
	wealthStats: WealthStats;
}
