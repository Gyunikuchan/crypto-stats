import * as _ from "lodash";
import * as moment from "moment";
import { NetworkStats } from "src/model/NetworkStats";
import { QtumNetworkManager } from "src/network/qtum/qtum.network.manager";
import logger from "src/util/logger";
import { ReadmeWriterService } from "src/writer/readme_writer.service";
import { SumaryWriterService } from "src/writer/summary_writer.service";

async function start() {
	try {
		// Determine start and end dates
		const endDate = moment().utc().subtract(1, "day").startOf("day");
		const startDate = moment(endDate).utc().subtract(6, "day").startOf("day");
		// const startDate = moment(endDate).utc().subtract(1, "day").startOf("day");

		// Load network stats
		const allNetworkStats: NetworkStats[] = await Promise.all([
			new QtumNetworkManager().getStats(startDate, endDate),
		]);

		// Write summaries
		const roolDirPath = `${__dirname}/..`;
		const relativeSummariesDirPath = `summaries`;
		await Promise.all(_.map(allNetworkStats, (networkStats) => {
			return SumaryWriterService.write(`${roolDirPath}/${relativeSummariesDirPath}`, networkStats);
		}));

		// Write readme
		await ReadmeWriterService.write(roolDirPath, relativeSummariesDirPath, allNetworkStats);
	} catch (error) {
		logger.error(error);
	}
}

start();
