import * as _ from "lodash";

import { StatsManager } from "./stats.manager";
import logger from "../utils/logger";

export class AuditService {
	public auditAccounts(statsManager: StatsManager) {
		logger.debug(`Auditing accounts`);

		// Check for bad id
		const failedIdCheck = _.some(statsManager.accounts, (account) => !account);
		if (failedIdCheck)
			throw new Error("Bad account id detected");

		// Check for unique ids
		const unique = _.uniqBy(statsManager.accounts, (account) => account.id);
		if (unique.length !== statsManager.accounts.length)
			throw new Error(`Duplicate account detected: ${unique.length} - ${unique[0]}`);
	}

	public auditBlocks(statsManager: StatsManager) {
		logger.debug(`Auditing blocks`);

		// Loop blocks
		const startHeight = statsManager.blocks[0].height;
		for (let i = 1; i < statsManager.blocks.length; ++i) {
			const block = statsManager.blocks[i];

			// Check for running block heights
			const expectedBlockHeight = startHeight + i;
			if (block.height !== expectedBlockHeight)
				throw new Error(`Unexpected block height: expected=${expectedBlockHeight} got=${block.height}`);

			// Check for bad id
			if (!block.producer)
				throw new Error(`Bad account id detected: ${block.height}`);

			// Check for time constraints
			if (block.time.isBefore(statsManager.start))
				throw new Error(`Block found before start: ${block.height}`);

			if (block.time.isAfter(statsManager.end))
				throw new Error(`Block found after end: ${block.height}`);
		}

		// Check for unique block heights
		const unique = _.uniqBy(statsManager.blocks, (block) => block.height);
		if (unique.length !== statsManager.blocks.length)
			throw new Error(`Duplicate block detected: ${unique.length} - ${unique[0]}`);
	}
}
