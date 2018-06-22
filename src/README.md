# Crypto-Stats

### Summary
Gathers decentralization statistics for various public cryptocurrency networks.<br/>
These are pretty raw metrics that are incapable of tell the full story on its own.<br/>

|Metric|Description|
|:---|:---|
|Total Nodes|The number of full nodes capable of producing and validating<br/>A higher number here gives better assurances that the network is unstoppable|
|Total Blocks|The amount of activity within the period|
|Total Producers|Unique addresses that managed to produce blocks<br/>A higher number here means that the network is harder to censor (your transactions will be published fairly and timely)|
|Total Validators|Unique addresses that participated in validation|
|No of top validators to attack|The minimum number of the top addresses needed for collusion<br/>A higher number here helps to guard against network attacks (e.g. double spends, network stoppage)|
|Wealth held by top 100 (%)|Percentage of wealth held by the top 100 addresses|
|No of top accounts to attack|The minimum number of the top addresses needed for collusion<br/>Similar to "No of validators to take over network" but relevant only to staking consensus and includes all potential validators|

### Why?
The key propositions of public DLT networks are that they are **trustless** and **permissionless**.<br/>
Without these properties, using private/consortium/trusted networks makes a lot more sense.<br/>

### Other Considerations
- A single entity can control multiple addresses<br/>
- Some consensus are easier/cheaper to game (e.g. buying votes)<br/>
- Some networks have higher barriers to entry in governance or in execution<br/>
- Some networks have claims/properties we assume to be true, but may not be so in practice<br/>
- Some of the wealthiest addresses are exchanges, but they still pose a potential threat if misbehaving<br/>
- While wealth inequality in non-staking networks should not directly affect the network, there are other economical concerns<br/>

---
## How to run
`npm i`<br/>
`npm start`<br/>

---
## Metrics

> |Name|Consensus|Total Nodes|Total Blocks|Total Producers|Total Validators|No of top validators to attack|Wealth held by top 100|No of top accounts to attack|
> |:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
> |[Qtum](../summaries/qtum.summary.md)|PoS|7228|4216|1225|1225|62|76.31%|22|

