import { NetworkStats } from "model/NetworkStats";
import * as moment from "moment";
import { NetworkInfo } from "../model/NetworkInfo";
import { BlockStatsService } from "../network/blockstats.service";
import logger from "../util/logger";
import { WealthStatsService } from "./wealthstats.service";

export abstract class NetworkManager {
	public networkInfo: NetworkInfo;
	public readonly blockStatsService: BlockStatsService;
	public readonly wealthStatsService: WealthStatsService;

	// =============================================================================
	// Abstract
	// =============================================================================

	constructor(
		networkInfo: NetworkInfo,
		services: {
			blockStatsService: BlockStatsService,
			wealthStatsService: WealthStatsService,
		}) {
		this.networkInfo = networkInfo;
		this.blockStatsService = services.blockStatsService.setNetworkManager(this);
		this.wealthStatsService = services.wealthStatsService.setNetworkManager(this);
	}

	// =============================================================================
	// Public
	// =============================================================================

	public async getStats(dateStart: moment.Moment, dateEnd: moment.Moment): Promise<NetworkStats> {
		logger.debug(`[${this.networkInfo.name}] Getting stats`);
		return {
			networkInfo: this.networkInfo,
			blockStats: await this.blockStatsService.getBlockStats(dateStart, dateEnd),
			wealthStats: await this.wealthStatsService.getWealthStats(),
		};
	}
}
