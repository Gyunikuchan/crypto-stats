import * as moment from "moment";

/**
 * Summary data for the main page
 */
export interface Summary {
	// General
	name: string;
	consensus: string;

	// Producers
	totalBlocks: string;
	totalNodes: string;
	totalProducers: string;
	totalValidators: string;
	noTopValidatorsToAttack: string;

	// Wealth
	wealthPercentHeldbyTop100: string;
	wealthNoTopAccountsToAttack: string;
}
