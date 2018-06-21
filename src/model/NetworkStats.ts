import { BlockStatsPeriod } from "./BlockStats";
import { NetworkInfo } from "./NetworkInfo";
import { WealthStats } from "./WealthStats";

export interface NetworkStats {
	networkInfo: NetworkInfo;
	blockStats: BlockStatsPeriod;
	wealthStats: WealthStats;
}
