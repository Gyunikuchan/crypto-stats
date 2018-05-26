import * as _ from "lodash";
import * as moment from "moment";

import logger from "../utils/logger";
import { AuditService } from "./audit.service";
import { ProducerService } from "./producer.service";

export interface Account {
	id: string;
	alias?: string;
	wealth: number;
}

export interface Block {
	height: number;
	producer: string;
	validators: string[];
	time: moment.Moment;
}

export abstract class StatsManager {
	public readonly auditService: AuditService;
	public readonly producerService: ProducerService;

	public readonly start: moment.Moment;
	public readonly end: moment.Moment;
	public readonly name: string;
	public readonly consensus: string;

	public accounts: Account[] = [];			// Sorted by amount (descending)
	public blocks: Block[] = [];					// Sorted by time (ascending)
	public totalNodeCount: number;
	public totalWealth: number;

	constructor(
		options: {
			start: moment.Moment,
			end: moment.Moment,
			name: string,
			consensus: string,
		},
		services: {
			auditService?: AuditService,
			producerService?: ProducerService,
		}) {
		// Options
		this.start = options.start;
		this.end = options.end;
		this.name = options.name;
		this.consensus = options.consensus;

		// Services
		this.auditService = services.auditService || new AuditService();
		this.producerService = services.producerService || new ProducerService();

		logger.debug(options, `Initialized StatsManager`);
	}

	// =============================================================================
	// General
	// =============================================================================

	protected abstract async onLoad();

	public async load() {
		logger.debug(`Loading stats`);
		await this.onLoad();
		this.auditService.auditAccounts(this);
		this.auditService.auditBlocks(this);
	}

	public getAlias(accountId: string) {
		for (const account of this.accounts) {
			if (account.id === accountId)
				return account.alias;
		}
	}

	public getAliasOrId(accountId: string) {
		return this.getAlias(accountId) || accountId;
	}

	// =============================================================================
	// Producer stats
	// =============================================================================

	public getProducerStats(start: moment.Moment, end: moment.Moment, fractionalToTakeOver: number) {
		const blocks = this.getBlocks(start, end);
		return this.producerService.getStats(blocks, fractionalToTakeOver);
	}

	// =============================================================================
	// Wealth stats
	// =============================================================================

	public getAccumulatedWealthForAccountCount(accountsCount: number) {
		let accumWealth = 0;

		for (let i = 0; i < this.accounts.length; ++i) {
			if (i === accountsCount)
				break;

			const account = this.accounts[i];
			accumWealth += account.wealth;
		}

		return accumWealth;
	}

	public getAccumulatedWealthPercentageForAccountCount(accountsCount: number) {
		return this.getAccumulatedWealthForAccountCount(accountsCount) / this.totalWealth;
	}

	public getNoTopAccountsToTakeOverWealth(fractionalToTakeOver) {
		const wealthToTakeOver = Math.floor(this.totalWealth * fractionalToTakeOver);
		let noOfAccounts = 0;
		let wealthAccum = 0;

		for (const account of this.accounts) {
			++noOfAccounts;
			wealthAccum += account.wealth;

			logger.debug(`Account #${noOfAccounts} holds ${account.wealth}, totalling ${wealthAccum}`);
			if (wealthAccum >= wealthToTakeOver)
				break;
		}

		return {
			moreThan: noOfAccounts === this.accounts.length,
			noOfAccounts,
		};
	}

	// =============================================================================
	// Helpers
	// =============================================================================

	protected getBlocks(start: moment.Moment, end: moment.Moment) {
		// FIXME: Could be optimized with binary search for partition
		const periodBlocks = this.blocks.filter((block) => {
			if (block.time.isBefore(start))
				return false;

			if (block.time.isAfter(end))
				return false;

			return true;
		});

		logger.debug(`Got ${periodBlocks.length} blocks between ${start.toString()} to ${end.toString()}`);
		return periodBlocks;
	}
}
