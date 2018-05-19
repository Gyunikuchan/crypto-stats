import * as moment from "moment";

import * as eth from "./ethereum";
import * as qtum from "./qtum";

async function printStats() {
	const endLoadMoment = moment();
	// const startLoadMoment = moment(endLoadMoment).subtract(1, "week");
	const startLoadMoment = moment(endLoadMoment).subtract(1, "day");

	// await eth.printStats();
	await qtum.writeStats(startLoadMoment, endLoadMoment);
}

printStats();
