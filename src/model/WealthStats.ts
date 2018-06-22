export interface AccountWealth {
	id: string;
	wealth: number;
}

export interface WealthStats {
	totalWealth: number;
	top10Wealth: number;
	top50Wealth: number;
	top100Wealth: number;
	topAccountsWealth: AccountWealth[];					// Sorted by wealth (descending)
	noTopAccountsToAttack?: number;							// Not always relevant
	noTopAccountsToAttackOverflow?: boolean;
}
