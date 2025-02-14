import { Stats } from './types';

export class BenchmarkResults {
	private executionTimeStats: Stats;
	private operationsPerSecondStats: Stats;
	private usedMemoryStats: Stats;
	private errors: unknown[] = [];

	constructor(executionTimeStats: Stats, operationsPerSecondStats: Stats, usedMemoryStats: Stats) {
		this.executionTimeStats = executionTimeStats;
		this.operationsPerSecondStats = operationsPerSecondStats;
		this.usedMemoryStats = usedMemoryStats;
	}

	addErrors(errors: unknown[]): void {
		this.errors.push(...errors);
	}

	getErrors(): unknown[] {
		return this.errors;
	}

	getExecutionTimeStats(): Stats {
		return this.executionTimeStats;
	}

	getOperationsPerSecondStats(): Stats {
		return this.operationsPerSecondStats;
	}

	getUsedMemoryStats(): Stats {
		return this.usedMemoryStats;
	}
}
