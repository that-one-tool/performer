/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { randomUUID } from 'crypto';
import { BenchmarkResults } from './benchmarkResults';
import { MetricsHandler } from './metricsHandler';
import { MetricsRecorder } from './metricsRecorder';

export class Performer {
	private static readonly DEFAULT_MAX_ITERATIONS = 10;
	private static readonly DEFAULT_MAX_TOTAL_TIME_MS = 1_000;
	private static readonly DEFAULT_RANDOM_ARRAY_SIZE = 1_000;

	private readonly functionsReferences = new Map<Function, string>();
	private readonly metricsHandler = new MetricsHandler();

	constructor() {
		if (typeof performance === 'undefined') {
			throw new Error('Performance API is not available');
		}

		if (typeof process === 'undefined') {
			throw new Error('Process API is not available');
		}
	}

	/**
	 * Benchmark a synchronous function
	 *
	 * @param {Function} func The function to benchmark
	 * @param {number} maxIterations The max number of run of the function
	 * @param {number} maxTotalDurationMs The max total duration of the benchmark
	 * @returns {BenchmarkResults} The benchmark results
	 */
	benchmarkFunction(
		func: Function,
		maxIterations: number = Performer.DEFAULT_MAX_ITERATIONS,
		maxTotalDurationMs: number = Performer.DEFAULT_MAX_TOTAL_TIME_MS,
	): BenchmarkResults {
		const instrumented = this.functionsReferences.has(func) ? func : this.getInstrumentedAndReferencedFunction(func, false);

		const errors: unknown[] = [];
		let i = 0;
		let timeMs = 0;

		const start = performance.now();

		do {
			let res;

			try {
				res = instrumented();
			} catch (error) {
				errors.push(error);
			}

			if (res?.then) {
				throw new Error('Function is asynchronous. Use `benchmarkAsyncFunction` instead');
			}

			i++;
			timeMs = performance.now() - start;
		} while (i < maxIterations && timeMs < maxTotalDurationMs);

		return this.prepareBenchmarkResults(instrumented, errors);
	}

	/**
	 * Benchmark an asynchronous function
	 *
	 * @param {Function} func The asynchronous function to benchmark
	 * @param {number} maxIterations The max number of run of the function
	 * @param {number} maxTotalDurationMs The max total duration of the benchmark
	 * @returns {Promise<BenchmarkResults>} A promise resolving to the benchmark results
	 */
	async benchmarkAsyncFunction(
		func: Function,
		maxIterations: number = Performer.DEFAULT_MAX_ITERATIONS,
		maxTotalDurationMs: number = Performer.DEFAULT_MAX_TOTAL_TIME_MS,
	): Promise<BenchmarkResults> {
		const instrumented = this.functionsReferences.has(func) ? func : this.getInstrumentedAndReferencedFunction(func, true);

		const errors = [];
		let i = 0;
		let timeMs = 0;

		const start = performance.now();

		do {
			try {
				await instrumented();
			} catch (error) {
				errors.push(error);
			}

			i++;
			timeMs = performance.now() - start;
		} while (i < maxIterations && timeMs < maxTotalDurationMs);

		return this.prepareBenchmarkResults(instrumented, errors);
	}

	/**
	 * Clear all references and metrics recorded
	 */
	clear(): void {
		this.functionsReferences.clear();
		this.metricsHandler.clear();
	}

	/**
	 * Create an array of custom values and of given size
	 *
	 * @param {Function} generatorFunction The function to use to generate the array values
	 * @param {number} size The size of the array (optional - default to 1000)
	 * @returns The generated array
	 */
	static createCustomArray<T>(generatorFunction: Function, size: number = Performer.DEFAULT_RANDOM_ARRAY_SIZE): T[] {
		if (typeof generatorFunction !== 'function') {
			throw new Error('generatorFunction must be a function');
		}

		return Performer.createArrayUsingGeneratorFunction(generatorFunction, size);
	}

	/**
	 * Create an array of random numbers and of given size
	 *
	 * @description Values are generated using the built-in Math.random method
	 * @param {number} size The size of the array (optional - default to 1000)
	 * @returns The generated array
	 */
	static createRandomNumberArray(size: number = Performer.DEFAULT_RANDOM_ARRAY_SIZE): number[] {
		return Performer.createArrayUsingGeneratorFunction(Math.random, size);
	}

	/**
	 * Create an array of random strings and of given size
	 *
	 * @description Values are generated using the built-in randomUUID method
	 * @param {number} size The size of the array (optional - default to 1000)
	 * @returns The generated array
	 */
	static createRandomStringArray(size: number = Performer.DEFAULT_RANDOM_ARRAY_SIZE): string[] {
		return Performer.createArrayUsingGeneratorFunction(randomUUID, size);
	}

	// == PRIVATE METHODS ==

	private static createArrayUsingGeneratorFunction<T>(generatorFunction: Function, size: number): T[] {
		const arr = [];

		for (let i = 0; i < size; i++) {
			arr.push(generatorFunction());
		}

		return arr;
	}

	private getFunctionReference(func: Function): string {
		const reference = this.functionsReferences.get(func);

		if (!reference) {
			throw new Error('Function reference not found');
		}

		return reference;
	}

	private getFunctionBenchmarkResults(func: Function): BenchmarkResults {
		const reference = this.getFunctionReference(func);
		return this.metricsHandler.getBenchmarkResultsForReference(reference);
	}

	private getInstrumentedAndReferencedFunction(func: Function, isAsync: boolean): Function {
		if (typeof func !== 'function') {
			throw new Error('Entity must be a function');
		}

		const reference = randomUUID();

		const intrumented = isAsync
			? this.makeInstrumentedAsyncFunction(this, reference, func)
			: this.makeInstrumentedFunction(this, reference, func);

		this.functionsReferences.set(intrumented, reference);

		return intrumented;
	}

	private makeInstrumentedAsyncFunction(thisPerfomer: Performer, reference: string, func: Function): Function {
		return async function (...args: unknown[]) {
			const metrics = new MetricsRecorder();
			let result;

			try {
				result = await func(...args);
			} catch (error) {
				metrics.end();
				thisPerfomer.metricsHandler.saveMetrics(reference, metrics);

				throw error;
			}

			metrics.end();
			thisPerfomer.metricsHandler.saveMetrics(reference, metrics);

			return result;
		};
	}

	private makeInstrumentedFunction(thisPerfomer: Performer, reference: string, func: Function): Function {
		return function (...args: unknown[]) {
			const metrics = new MetricsRecorder();
			let result;

			try {
				result = func(...args);
			} catch (error) {
				metrics.end();
				thisPerfomer.metricsHandler.saveMetrics(reference, metrics);

				throw error;
			}

			metrics.end();
			thisPerfomer.metricsHandler.saveMetrics(reference, metrics);

			return result;
		};
	}

	private prepareBenchmarkResults(instrumentedFunc: Function, errors: unknown[]): BenchmarkResults {
		const results = this.getFunctionBenchmarkResults(instrumentedFunc);

		if (errors.length) {
			results.addErrors(errors);
		}

		return results;
	}
}
