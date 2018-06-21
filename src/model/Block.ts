import * as moment from "moment";

export interface Block {
	height: number;
	producerId: string;
	validatorsId: string[];
	time: moment.Moment;
}
