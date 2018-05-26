# Crypto-Stats
## Summary
Gathers decentralization statistics for various cryptocurrency projects<br/>
These are pretty raw statistics and are incapable of tell the full story on its own<br/>
A single entity can control multiple addresses<br/>
Some consensus are easier/cheaper to game (e.g. buying votes)<br/>
Some projects have higher barriers to entry either in governance or in execution<br/>
<br/>
### Explanation
**Total Blocks**: Activity in this period<br/>
**Total Nodes**: The number of full nodes capable of producing and validating<br/>
**Total Producers**: Unique addresses that managed to produce blocks<br/>
**Total Validators**: Unique addresses that participated in validation (lower means it is easier to censor)<br/>
**No of validators to take over network**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)<br/>
**Wealth held by top 100 (%)**: Percentage of wealth held by the top 100 addresses<br/>
**No of accounts to take over network with wealth**: The minimum number of addresses needed for collusion (lower means it is easier to censor/attack)<br/>

---
## How to run
`npm i`<br/>
`npm start`<br/>

---
## Results
Date: May 26th 2018<br/>
Period: 1 week (Sat May 19 2018 12:57:51 GMT+0800 - Sat May 26 2018 12:57:51 GMT+0800)<br/>
> |Name|Consensus|Total Blocks|Total Nodes|Total Producers|Total Validators|No of validators to take over network|Wealth held by top 100 (%)|No of accounts to take over network with wealth|
> |:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
> |[Ethereum](results/ethereum.results.md)|PoW|39367|16160|79|79|3|34.503|-|
> |[Qtum](results/qtum.results.md)|MPoS|4214|6658|1181|1181|68|73.062|24|
> |[Neo](results/neo.results.md)|dBFT|27470|7*|1|7*|5|?|?|
> *Not dynamically updated
