import * as _ from "lodash";
import { NetworkStats } from "model/NetworkStats";
import { ReadmeWriterService } from "writer/readme_writer.service";
import { SumaryWriterService } from "writer/summary_writer.service";

async function start() {
	// Load network stats
	const allNetworkStats: NetworkStats[] = await Promise.all([
		// TODO:
	]);

	// Write summaries
	_.forEach(allNetworkStats, (networkStats) => {
		SumaryWriterService.write(`${__dirname}/summaries`, networkStats);
	});

	// Write readme
	ReadmeWriterService.write(__dirname, `summaries`, allNetworkStats);
}

start();
