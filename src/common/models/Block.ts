import * as moment from "moment";

export interface Block {
	height: number;
	producer: string;
	validators: string[];
	time: moment.Moment;
}
