const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async () => {
  const response = await axios.get("https://qtum.info/misc/rich-list");
  let $ = cheerio.load(response.data);
  const dataRows = $(`#app`).find(`tbody`).children();
  
  let richListPercentageSum = 0;
  dataRows.each((index, element) => {
    const percentage = element.children[3].children[0].data;
    richListPercentageSum += Number.parseFloat(percentage);
  });

  return richListPercentageSum;
}
