import axios from "axios";
import * as cheerio from "cheerio";

export async function getWealthDistribution() {
	const response = await axios.get("https://qtum.info/misc/rich-list");
	const $ = cheerio.load(response.data);
	const dataRows = $(`#app`).find(`tbody`).children();

	let top10 = 0;
	let top50 = 0;
	let top100 = 0;
	let richListPercentageSum = 0;
	dataRows.each((index, element) => {
		const percentage = element.children[3].children[0].data;
		richListPercentageSum += Number.parseFloat(percentage);

		if (index === 9) top10 = richListPercentageSum;
		if (index === 49) top50 = richListPercentageSum;
		if (index === 99) top100 = richListPercentageSum;
	});

	return {
		top10,
		top50,
		top100,
	};
}

export async function printWealthDistribution() {
	const results = await getWealthDistribution();
	console.log(`${results.top10}% held by the top 10 addresses`);
	console.log(`${results.top50}% held by the top 50 addresses`);
	console.log(`${results.top100}% held by the top 100 addresses`);
}
