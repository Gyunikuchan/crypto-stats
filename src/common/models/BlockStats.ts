import * as moment from "moment";

export interface Producer {
	id: string;
	count: number;
}

export interface Validator {
	id: string;
	count: number;
}

export interface BlockStatsDay {
	date: moment.Moment;			// Date in utc
	heightStart: number;
	heightEnd: number;
	totalBlocks: number;
	totalValidations: number;
	producers: Producer[];		// Unordered
	validators: Validator[];	// Unordered
}

export interface BlockStatsConsolidated {
	dateStart: moment.Moment;		// Date in utc
	dateEnd: moment.Moment;			// Date in utc
	heightStart: number;
	heightEnd: number;
	totalBlocks: number;
	totalValidations: number;
	producers: Producer[];			// Sorted by count (descending)
	validators: Validator[];		// Sorted by count (descending)
	noTopValidatorsToAttack: number;
}
