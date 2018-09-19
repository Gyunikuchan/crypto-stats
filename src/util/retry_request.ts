import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { delay } from "bluebird";
import logger from "src/util/logger";

export interface RetryOptions {
	retryTimes: number;
	interval: number;
	backOffFactor: number;
}

export class RetryRequest {
	public static async get(config: AxiosRequestConfig, retryOptions: RetryOptions = this.getDefaultRetryOptions()) {
		return await this.send({ ...config, method: "GET" }, retryOptions);
	}

	public static async post(config: AxiosRequestConfig, retryOptions: RetryOptions = this.getDefaultRetryOptions()) {
		return await this.send({ ...config, method: "POST" }, retryOptions);
	}

	public static async put(config: AxiosRequestConfig, retryOptions: RetryOptions = this.getDefaultRetryOptions()) {
		return await this.send({ ...config, method: "PUT" }, retryOptions);
	}

	public static async delete(config: AxiosRequestConfig, retryOptions: RetryOptions = this.getDefaultRetryOptions()) {
		return await this.send({ ...config, method: "DELETE" }, retryOptions);
	}

	public static async send(config: AxiosRequestConfig, retryOptions: RetryOptions = this.getDefaultRetryOptions()): Promise<AxiosResponse> {
		try {
			return await axios(config);
		} catch (error) {
			// No retry
			if (!retryOptions)
				throw error;

			// Retries exhausted
			if (retryOptions.retryTimes <= 0)
				throw error;

			// Retry
			--retryOptions.retryTimes;
			logger.debug(error, `Retrying after ${retryOptions.interval}ms (${retryOptions.retryTimes} left`);
			await delay(retryOptions.interval);
			retryOptions.interval *= retryOptions.backOffFactor;

			return await this.send(config, retryOptions);
		}
	}

	private static getDefaultRetryOptions(): RetryOptions {
		return {
			retryTimes: 3,
			interval: 3000,
			backOffFactor: 2,
		};
	}
}
