const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

async function getConsensusDistribution(amount, unit) {
  const day = moment();
  const cutOffMoment = moment().subtract(amount, unit);
  const cutOffDay = moment(cutOffMoment).startOf("day");

  const results = {
    producers: new Map(),
    blockCount: 0
  }

  do {
    await addMinersForDay(results, day.format("YYYY-MM-DD"), cutOffMoment);
    day.subtract(1, "day");
  }
  while (!day.isBefore(cutOffDay))  // Day is after or equals to cutOffDay

  return results;
}

async function printConsensusDistribution(amount, unit) {
  const results = await getConsensusDistribution(amount, unit);
  console.log(`${results.producers.size} addresses over ${amount} ${unit} (${results.blockCount} blocks)`);

  const sortedProducers = [...results.producers.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedProducers[0]) console.log(`Producer #1: ${sortedProducers[0][1]} blocks`);
  if (sortedProducers[1]) console.log(`Producer #2: ${sortedProducers[1][1]} blocks`);
  if (sortedProducers[2]) console.log(`Producer #3: ${sortedProducers[2][1]} blocks`);
  if (sortedProducers[3]) console.log(`Producer #4: ${sortedProducers[3][1]} blocks`);
  if (sortedProducers[4]) console.log(`Producer #5: ${sortedProducers[4][1]} blocks`);
  if (sortedProducers[9]) console.log(`Producer #10: ${sortedProducers[9][1]} blocks`);
  if (sortedProducers[49]) console.log(`Producer #50: ${sortedProducers[49][1]} blocks`);
  if (sortedProducers[99]) console.log(`Producer #100: ${sortedProducers[49][1]} blocks`);
}

module.exports = {
  getConsensusDistribution,
  printConsensusDistribution
}

// =============================================================================
// Helpers
// =============================================================================

async function addMinersForDay(results, dateString, cutOffMoment) {
  const response = await axios.get("https://qtum.info/block", {
    params: {
      date: dateString
    }
  });
  let $ = cheerio.load(response.data);
  const dataRows = $(`#app`).find(`tbody`).children();

  dataRows.each((index, element) => {
    const blockTimeString = element.children[1].children[0].data;

    // Stop when cut off is reached
    const blockTimeMoment = moment(blockTimeString);
    if (blockTimeMoment.isBefore(cutOffMoment)) {
      return;
    }

    const miner = element.children[3].children[0].children[0].children[0].data;
    const minerCount = (results.producers.get(miner) || 0) + 1;

    results.producers.set(miner, minerCount);
    ++results.blockCount;
  });
}
