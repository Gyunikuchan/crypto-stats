import { WealthStats } from "src/model/WealthStats";
import { WealthStatsService } from "../wealthstats.service";

export class SnippetWealthStatsService extends WealthStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getWealthStatsFromSource(): Promise<WealthStats> {
		return {
		};
	}
}
