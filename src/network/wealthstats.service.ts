import { AccountWealth, WealthStats } from "src/model/WealthStats";
import logger from "src/util/logger";
import { NetworkManager } from "src/network/network.manager";

export abstract class WealthStatsService {
	protected networkManager: NetworkManager;

	// =============================================================================
	// Abstract
	// =============================================================================

	protected abstract async getWealthStatsFromSource(): Promise<WealthStats>;

	// =============================================================================
	// Public
	// =============================================================================

	public setNetworkManager(networkManager: NetworkManager) {
		this.networkManager = networkManager;
		return this;
	}

	public get name() {
		return this.networkManager.networkInfo.name;
	}

	public async getWealthStats(): Promise<WealthStats> {
		logger.info(`[${this.name}] Getting wealth stats`);
		return await this.getWealthStatsFromSource();
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected getTopWealth(topAccountsWealth: AccountWealth[], noOfAccounts: number): number {
		logger.info(`[${this.name}] Getting top ${noOfAccounts} account wealth`);
		let topWealthAccum = 0;

		for (let i = 0; i < noOfAccounts; ++i) {
			topWealthAccum += topAccountsWealth[i].wealth;
		}

		logger.debug(`[${this.name}] Got top ${noOfAccounts} account wealth: ${topWealthAccum}`);
		return topWealthAccum;
	}

	protected getNoTopAccountsToAttack(totalWealth: number, topAccountsWealth: AccountWealth[]) {
		logger.info(`[${this.name}] Getting number of top accounts to attack`);
		const wealthToAttack = Math.floor(totalWealth * (this.networkManager.networkInfo.percentToAttack / 100));

		let noTopAccountsToAttack = 0;
		let noTopAccountsToAttackOverflow = true;
		let wealthAccum = 0;

		for (const accountWealth of topAccountsWealth) {
			++noTopAccountsToAttack;
			wealthAccum += accountWealth.wealth;

			logger.debug(`Account #${noTopAccountsToAttack} holds ${accountWealth.wealth}, totalling ${wealthAccum}`);
			if (wealthAccum >= wealthToAttack) {
				noTopAccountsToAttackOverflow = false;
				break;
			}
		}

		const noTopAccountsToAttackString = (noTopAccountsToAttackOverflow ? `>${noTopAccountsToAttack}` : `${noTopAccountsToAttack}`);
		logger.info(`[${this.name}] Got number of top accounts to attack: ${noTopAccountsToAttackString}`);
		return {
			noTopAccountsToAttack,
			noTopAccountsToAttackOverflow,
		};
	}
}
