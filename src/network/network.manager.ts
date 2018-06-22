import * as moment from "moment";
import { NetworkInfo } from "src/model/NetworkInfo";
import { NetworkStats } from "src/model/NetworkStats";
import { BlockStatsService } from "src/network/blockstats.service";
import logger from "src/util/logger";
import { WealthStatsService } from "./wealthstats.service";

export abstract class NetworkManager {
	public readonly blockStatsService: BlockStatsService;
	public readonly wealthStatsService: WealthStatsService;
	public networkInfo: NetworkInfo;

	// =============================================================================
	// Abstract
	// =============================================================================

	public abstract get name();

	protected abstract async getNetworkInfoFromSource(): Promise<NetworkInfo>;

	// =============================================================================
	// Public
	// =============================================================================

	constructor(
		services: {
			blockStatsService: BlockStatsService,
			wealthStatsService: WealthStatsService,
		}) {
		this.blockStatsService = services.blockStatsService.setNetworkManager(this);
		this.wealthStatsService = services.wealthStatsService.setNetworkManager(this);
	}

	public async getStats(startDate: moment.Moment, endDate: moment.Moment): Promise<NetworkStats> {
		logger.info(`[${this.name}] Getting stats`);

		this.networkInfo = await this.getNetworkInfo();
		return {
			networkInfo: await this.networkInfo,
			blockStats: await this.blockStatsService.getBlockStats(startDate, endDate),
			wealthStats: await this.wealthStatsService.getWealthStats(),
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected async getNetworkInfo(): Promise<NetworkInfo> {
		logger.debug(`[${this.name}] Getting network info from source`);
		return this.getNetworkInfoFromSource();
	}
}
