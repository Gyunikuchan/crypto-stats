import * as moment from "moment";

/**
 * Summary data for the main page
 */
export interface Summary {
	// General
	name: string;
	start: moment.Moment;
	end: moment.Moment;

	// Validator
	totalBlocks: string;
	totalValidators: string;
	noEffectiveValidators: string;
	noTopValidatorsToTakeOver: string;

	// Wealth
	totalWealth: string;
	percentHeldbyTop100: string;
	noTopAccountsToTakeOver: string;
}
