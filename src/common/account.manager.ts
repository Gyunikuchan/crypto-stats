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

	public getTotalAmount() {
		return this.totalAmount;
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
}
