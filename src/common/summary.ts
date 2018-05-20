import * as moment from "moment";

/**
 * Summary data for the main page
 */
export interface Summary {
	// General
	name: string;

	// Producers
	totalBlocks: string;
	totalNodes: string;
	totalProducers: string;
	noTopProducersToTakeOver: string;

	// Wealth
	wealthPercentHeldbyTop100: string;
	wealthNoTopAccountsToTakeOver: string;
}
