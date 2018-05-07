const printConsensusDistribution = require("./stats/consensus_distribution");
const printWealthDistribution = require("./stats/wealth_distribution");

async function printStats() {
  await printConsensusDistribution(1, "day");
  await printConsensusDistribution(2, "day");
  await printConsensusDistribution(4, "day");
  await printConsensusDistribution(1, "week");
  await printConsensusDistribution(1, "month");

  await printWealthDistribution();
}

printStats();