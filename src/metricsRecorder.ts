import { getSixDigitsRoundedAbs } from './utils';

export class MetricsRecorder {
	private timeStart: number;
	private timeEnd = 0;
	private memoryStart: number;
	private memoryEnd = 0;

	constructor() {
		this.timeStart = performance.now();
		this.memoryStart = process.memoryUsage().heapUsed;
	}

	end(): void {
		this.timeEnd = performance.now();
		this.memoryEnd = process.memoryUsage().heapUsed;
	}

	getExecutionTimeMs(): number {
		return getSixDigitsRoundedAbs(this.timeEnd - this.timeStart);
	}

	getOperationsPerSecond(): number {
		return getSixDigitsRoundedAbs(1_000 / this.getExecutionTimeMs());
	}

	getUsedMemoryMB(): number {
		return getSixDigitsRoundedAbs(this.memoryEnd - this.memoryStart) / 1_000_000;
	}
}
