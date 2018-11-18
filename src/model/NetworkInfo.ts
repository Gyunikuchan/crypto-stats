export interface NetworkInfo {
	summary: string;
	consensus: string;
	website: string;
	sources: string[];
	percentToAttack: number;			// 0 - 100
	nodeCount: number;						// Full participating nodes only
	aliases: Map<string, string>;	// Address to alias
}
