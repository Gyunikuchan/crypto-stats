const consensus_distribution = require("./stats/consensus_distribution");
const wealth_distribution = require("./stats/wealth_distribution");

async function printStats() {
  console.log(`~~ consensus_distribution ~~`);
  await consensus_distribution.printConsensusDistribution(1, "day");
  console.log(``);
  await consensus_distribution.printConsensusDistribution(2, "day");
  console.log(``);
  await consensus_distribution.printConsensusDistribution(4, "day");
  console.log(``);
  await consensus_distribution.printConsensusDistribution(1, "week");
  console.log(``);
  await consensus_distribution.printConsensusDistribution(1, "month");
  console.log(``);

  console.log(`~~ wealth_distribution ~~`)
  await wealth_distribution.printWealthDistribution();
}

printStats();