const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

module.exports = async (amount, unit) => {
  const day = moment();
  const cutOffMoment = moment().subtract(amount, unit);
  const cutOffDay = moment(cutOffMoment).startOf("day");

  const results = {
    minerSet: new Set(),
    blockCount: 0
  }
  
  do {
    await addMinersForDay(results, day.format("YYYY-MM-DD"), cutOffMoment);
    day.subtract(1, "day");
  }
  while (!day.isBefore(cutOffDay))  // Day is after or equals to cutOffDay

  console.log(`consensus_distribution: ${results.minerSet.size} addresses over ${amount} ${unit} over ${results.blockCount} blocks`);
}

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
    const miner = element.children[3].children[0].children[0].children[0].data;

    // Stop when cut off is reached
    const blockTimeMoment = moment(blockTimeString);
    if (blockTimeMoment.isBefore(cutOffMoment)) {
      return;
    }

    results.minerSet.add(miner);
    ++results.blockCount;
  });
}
