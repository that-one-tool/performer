/* eslint-disable @typescript-eslint/dot-notation */

import assert from 'node:assert';
import { after, describe, it } from 'node:test';
import { Performer } from '../src';

class TestClass {
	private initialArray: string[] = [];

	constructor() {
		for (let i = 0; i < 1000; i++) {
			this.initialArray.push(`user-uuid-${i}`);
		}
	}

	add(a: number, b: number): number {
		return a + b;
	}

	loop(): void {
		const res: Record<string, string | undefined> = {};

		for (let i = 0; i < this.initialArray.length; i++) {
			res[`${i}`] = this.initialArray[i];
		}
	}

	reduce(): void {
		this.initialArray.reduce((obj, val, i) => {
			return { ...obj, [i]: val };
		}, {});
	}

	async asyncFunction(): Promise<void> {
		return Promise.resolve();
	}
}

function testFunction(a: number, b: number): number {
	return a + b;
}

async function testAsyncFunction(a: number, b: number): Promise<number> {
	return Promise.resolve(a + b);
}

describe('Performer', () => {
	const performer = new Performer();

	after(() => {
		performer.clear();
	});

	describe('Benchmark sync/async functions', () => {
		it('should return benchmark results - add class method', () => {
			const test = new TestClass();
			const results = performer.benchmarkFunction(() => test.add(1, 2), 10);

			assert.ok(results);
		});

		it('should return benchmark results - asyncFunction class method', async () => {
			const test = new TestClass();
			const results = await performer.benchmarkAsyncFunction(async () => await test.asyncFunction(), 10, 1_000);

			assert.ok(results);
		});

		it('should return benchmark results - testFunction', () => {
			const results = performer.benchmarkFunction(testFunction, 10, 1_000);

			assert.ok(results);
		});

		it('should return benchmark results - testAsyncFunction', async () => {
			const results = await performer.benchmarkAsyncFunction(testAsyncFunction, 10, 1_000);

			assert.ok(results);
		});

		it('should compare benchmark results - loop vs. reduce', () => {
			const test = new TestClass();
			const loopResults = performer.benchmarkFunction(() => test.loop(), 10);
			const reduceResults = performer.benchmarkFunction(() => test.reduce(), 10);

			assert.ok(loopResults.getExecutionTimeStats().avg < reduceResults.getExecutionTimeStats().avg);
			assert.ok(loopResults.getOperationsPerSecondStats().avg > reduceResults.getOperationsPerSecondStats().avg);
			assert.ok(loopResults.getUsedMemoryStats().avg < reduceResults.getUsedMemoryStats().avg);
		});

		it('should return thrown errors of synchronous function', () => {
			const results = performer.benchmarkFunction(() => {
				throw new Error('Test error');
			}, 2);

			assert.ok(results.getErrors().length === 2);
		});

		it('should return thrown errors of asynchronous function', async () => {
			const results = await performer.benchmarkAsyncFunction(async () => {
				await Promise.reject(new Error('Test error'));
			}, 2);

			assert.ok(results.getErrors().length === 2);
			assert.ok(results.getErrors()[0] instanceof Error && (results.getErrors()[0] as Error).message === 'Test error');
		});

		it('should throw when using benchmarkFunction with an asynchronous function', () => {
			assert.throws(() =>
				performer.benchmarkFunction(async () => {
					return Promise.resolve();
				}),
			);
		});
	});

	describe('clear', () => {
		it('should clear function references', () => {
			performer.benchmarkFunction(testFunction, 1);

			assert.ok(performer['functionsReferences'].size > 0);

			performer.clear();

			assert.ok(performer['functionsReferences'].size === 0);
		});
	});

	describe('createCustomArray', () => {
		it('should create a valid array with custom values of the given size', () => {
			const result = Performer.createCustomArray(() => 'uuid-X', 10);

			assert.ok(result.length === 10);
			assert.ok(result.every((value) => value === 'uuid-X'));
		});

		it('should throw when passed generatorFunction is not a function', () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
			assert.throws(() => Performer.createCustomArray({} as Function, 10));
		});
	});

	describe('createRandomNumberArray', () => {
		it('should create a valid random numbers array of the given size', () => {
			const result = Performer.createRandomNumberArray(3);

			assert.ok(result.length === 3);
			assert.ok(result[0] >= 0 && result[0] <= 1);
			assert.ok(result[1] >= 0 && result[1] <= 1);
			assert.ok(result[2] >= 0 && result[2] <= 1);
		});
	});

	describe('createRandomStringArray', () => {
		it('should create a valid random strings array of the given size', () => {
			const result = Performer.createRandomStringArray();

			assert.ok(result.length === Performer['DEFAULT_RANDOM_ARRAY_SIZE']);
			assert.ok(result[0].length === 36);
		});
	});

	describe('getFunctionReference', () => {
		it('should throw when function is not referenced', () => {
			const test = new TestClass();

			assert.throws(() => performer['getFunctionReference'](() => test.add(1, 2)), {
				message: 'Function reference not found',
			});
		});
	});

	describe('getInstrumentedAndReferencedFunction', () => {
		it('should throw when entity passed is not a function', () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
			assert.throws(() => performer['getInstrumentedAndReferencedFunction']({} as Function, false), {
				message: 'Entity must be a function',
			});
		});
	});
});
