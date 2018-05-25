# Crypto-Stats
## Summary
Gathers decentralization statistics for various cryptocurrency projects<br/>
Disclaimer: These are just numbers and is incapable of tell the full story on its own<br/>
<br/>
### Explanation
**Total Blocks**: Activity in this period<br/>
**Total Nodes**: The number of full nodes capable of producing and validating<br/>
**Total Producers**: Unique addresses that managed to produce blocks<br/>
**Total Validators**: Unique addresses that participated in validation (lower means it is easier to censor)<br/>
**No of validators to take over network**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)<br/>
**Wealth held by top 100 (%)**: Percentage of wealth held by the top 100 addresses<br/>
**No of accounts to take over network with wealth**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)<br/>

## How to run
`npm i`<br/>
`npm start`<br/>

## Results
Date: May 26th 2018<br/>
Period: 1 week (Sat May 26 2018 02:13:47 GMT+0800 - Sat May 26 2018 02:23:47 GMT+0800)<br/>
> |Name|Total Blocks|Total Nodes|Total Producers|Total Validators|No of validators to take over network|Wealth held by top 100 (%)|No of accounts to take over network with wealth|
> |:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
> |[Ethereum](results/ethereum.results.md)|41|16457|7|7|2|34.518|-|
> |[Qtum](results/qtum.results.md)|4|6701|4|4|3|73.035|24|
> |[Neo](results/neo.results.md)|15|7*|1|7*|5|?|?|
> *Not dynamically calculated
