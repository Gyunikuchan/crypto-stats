const getConsensusDistribution = require("./stats/consensus_distribution");
const getWealthDistribution = require("./stats/wealth_distribution");

async function printStats() {
  console.log(`consensus_distribution: ${await getConsensusDistribution(1, "day")} addresses over 24 hours`);
  console.log(`consensus_distribution: ${await getConsensusDistribution(2, "day")} addresses over 48 hours`);
  console.log(`consensus_distribution: ${await getConsensusDistribution(4, "day")} addresses over 4 days`);
  console.log(`consensus_distribution: ${await getConsensusDistribution(7, "day")} addresses over 7 days`);
  console.log(`consensus_distribution: ${await getConsensusDistribution(1, "month")} addresses over a month`);
  console.log(`wealth_distribution: ${await getWealthDistribution()}% held by the top 100 addresses`);
}

printStats();