import * as moment from "moment";

export interface Producer {
	id: string;
	count: number;
}

export interface Validator {
	id: string;
	count: number;
}

// Used for memoizing
export interface BlockStatsDay {
	date: moment.Moment;			// Date in utc
	startHeight: number;
	endHeight: number;
	totalBlocks: number;
	totalValidations: number;
	producers: Producer[];		// Unordered
	validators: Validator[];	// Unordered
}

export interface BlockStatsPeriod {
	startDate: moment.Moment;		// Date in utc
	endDate: moment.Moment;			// Date in utc
	startHeight: number;
	endHeight: number;
	totalBlocks: number;
	totalValidations: number;
	producers: Producer[];			// Sorted by count (descending)
	validators: Validator[];		// Sorted by count (descending)
	noTopValidatorsToAttack: number;
}
