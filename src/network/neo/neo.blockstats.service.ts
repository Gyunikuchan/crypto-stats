import * as moment from "moment";
import { Block } from "src/model/Block";
import { BlockStatsService } from "src/network/blockstats.service";

const BLOCK_TIME_S = 15;

export class NeoBlockStatsService extends BlockStatsService {
	// =============================================================================
	// Abstract
	// =============================================================================

	protected async getBlocksDayFromSource(date: moment.Moment): Promise<Block[]> {
		return [];
	}
}
