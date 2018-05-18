import * as _ from "lodash";

import logger from "../utils/logger";

export interface Account {
	id: string;
	amount: number;
}

export abstract class AccountManager {
	protected accounts: Account[] = [];	// Sorted by amount (descending)
	protected totalAmount: number = 0;

	/**
	 * Load top accounts and sort them by amount (ascending)
	 */
	public abstract async load();

	public getAccount(index: number) {
		return this.accounts[index];
	}

	public getAccumulatedAmountForAccountsCount(accountsCount: number) {
		let accumAmount = 0;

		for (let i = 0; i < this.accounts.length; ++i) {
			if (i >= accountsCount)
				break;

			const account = this.accounts[i];
			accumAmount += account.amount;
		}

		return accumAmount;
	}

	public getAccumulatedWealthPercentageForAccountsCount(accountsCount: number) {
		return this.getAccumulatedAmountForAccountsCount(accountsCount) / this.totalAmount;
	}

	public getNoAccountFor50PercentWealth() {
		const percent50 = Math.floor(this.totalAmount * 0.5);

		let noOfAddresses = 0;
		let amountAccum = 0;
		for (const account of this.accounts) {
			++noOfAddresses;
			amountAccum += account.amount;

			logger.debug(`Account #${noOfAddresses} holds ${account.amount}, totalling ${amountAccum}`);
			if (amountAccum > percent50)
				break;
		}

		return {
			noOfAddresses,
			moreThan: noOfAddresses === this.accounts.length,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected audit() {
		// Check for bad id
		const failedIdCheck = _.some(this.accounts, (account) => !account);
		if (failedIdCheck)
			throw new Error("Bad account id detected");

		// Check for unique ids
		const unique = _.uniqBy(this.accounts, (account) => account.id);
		if (unique.length !== this.accounts.length)
			throw new Error("Duplicate account detected");
	}
}
