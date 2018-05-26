# Crypto-Stats

### Summary
Gathers decentralization statistics for various public cryptocurrency networks.<br/>
These are pretty raw metrics that are incapable of tell the full story on its own.<br/>

|Metric|Description|
|:---|:---|
|Total Blocks|The amount of activity within the period|
|Total Nodes|The number of full nodes capable of producing and validating<br/>A higher number here gives better assurances that the network is unstoppable|
|Total Producers|Unique addresses that managed to produce blocks<br/>A higher number here means that the network is harder to censor (your transactions will be published fairly and timely)|
|Total Validators|Unique addresses that participated in validation|
|No of top validators to attack|The minimum number of the top addresses needed for collusion<br/>A higher number here helps to guard against network attacks (e.g. double spends, network stoppage)|
|Wealth held by top 100 (%)|Percentage of wealth held by the top 100 addresses|
|No of top accounts to attack|The minimum number of the top addresses needed for collusion<br/>Similar to "No of validators to take over network" but relevant only to staking consensus and includes all potential validators|

### Why?
The key propositions of a public DLT network is that it is **trustless** and **permissionless**.<br/>
Without these properties, using private/consortium/trusted networks makes a lot more sense.<br/>

### Other Considerations
- A single entity can control multiple addresses<br/>
- Some consensus are easier/cheaper to game (e.g. buying votes)<br/>
- Some networks have higher barriers to entry in governance or in execution<br/>
- Some networks have claims/properties we assume to be true, but may not be so in practice<br/>
- Some of the wealthiest addresses are exchanges, but they still poses a potential threat should they misbehave<br/>
- While wealth inequality in non-staking networks should not directly affect the network, there are other economical concerns<br/>

---
## How to run
`npm i`<br/>
`npm start`<br/>

---
## Results
### Period: 1 week (Sat May 19 2018 23:20:15 GMT+0800 - Sat May 26 2018 23:20:15 GMT+0800)

> |Name|Consensus|Total Blocks|Total Nodes|Total Producers|Total Validators|**No of top validators to attack**|Wealth held by top 100 (%)|**No of top accounts to attack**|
> |:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
> |[Ethereum](results/ethereum.results.md)|PoW|39528|15551|79|79|**3**|34.535|**-**|
> |[Qtum](results/qtum.results.md)|MPoS|4204|6787|1169|1169|**66**|73.102|**24**|
> |[NEO](results/neo.results.md)|dBFT|27297|7*|1|7*|**3**|70.355|**1**|

> *Not dynamically updated
