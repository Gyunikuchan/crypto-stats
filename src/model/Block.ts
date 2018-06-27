import * as moment from "moment";

export interface Block {
	height: number;
	producerId: string;
	validatorIds: string[];
	time: moment.Moment;
}
