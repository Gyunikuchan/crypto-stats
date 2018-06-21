export interface NetworkInfo {
	name: string;
	summary: string;
	consensus: string;
	website: string;
	sources: string[];
	percentToAttack: number;	// 0 - 100
	nodeCount: number;				// Full participating nodes only
}
