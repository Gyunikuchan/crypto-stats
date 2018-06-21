export interface WealthStats {
	totalWealth: number;
	top10Wealth: number;
	top50Wealth: number;
	top100Wealth: number;
	topAccountsWealth: Array<{ id: string, wealth: number }>;	// Sorted by wealth (descending)
	noTopAccountsToAttack?: number;														// Not always relevant
	noTopAccountsToAttackOverflow?: boolean;
}
