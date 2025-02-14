import { BenchmarkResults } from './benchmarkResults';
import { MetricsRecorder } from './metricsRecorder';
import { Stats } from './types';

export class MetricsHandler {
	private readonly referenceMetricsMap = new Map<string, MetricsRecorder[]>();

	constructor() {
		return;
	}

	clear(): void {
		this.referenceMetricsMap.clear();
	}

	getBenchmarkResultsForReference(reference: string): BenchmarkResults {
		const metrics = this.getMetricsForReference(reference);
		return this.prepareBenchmarkResultsFromMetrics(metrics);
	}

	saveMetrics(reference: string, metrics: MetricsRecorder): void {
		const referenceMetrics = this.referenceMetricsMap.get(reference) ?? [];
		referenceMetrics.push(metrics);
		this.referenceMetricsMap.set(reference, referenceMetrics);
	}

	// == PRIVATE METHODS ==

	private extractMetrics(metrics: MetricsRecorder[]): {
		executionTimeList: number[];
		operationsPerSecondList: number[];
		usedMemoryList: number[];
	} {
		const executionTimeList: number[] = [];
		const operationsPerSecondList: number[] = [];
		const usedMemoryList: number[] = [];

		for (const metric of metrics) {
			executionTimeList.push(metric.getExecutionTimeMs());
			operationsPerSecondList.push(metric.getOperationsPerSecond());
			usedMemoryList.push(metric.getUsedMemoryMB());
		}

		return { executionTimeList, operationsPerSecondList, usedMemoryList };
	}

	private getMetricsForReference(reference: string): MetricsRecorder[] {
		return this.referenceMetricsMap.get(reference) ?? [];
	}

	private getMetricStats(values: number[]): Stats {
		const samples = values.length;
		let min = Infinity;
		let max = -Infinity;
		let sum = 0;
		let avg = 0;
		let stdDev = 0;

		for (let i = 0; i < samples; i++) {
			const value = values[i];

			min = Math.min(min, value);
			max = Math.max(max, value);
			sum += value;
		}

		avg = sum / samples;

		for (let i = 0; i < samples; i++) {
			stdDev += Math.pow(values[i] - avg, 2);
		}

		stdDev = Math.sqrt(stdDev / (samples - 1));

		return { samples, min, max, sum, avg, stdDev };
	}

	private prepareBenchmarkResultsFromMetrics(metrics: MetricsRecorder[]): BenchmarkResults {
		const { executionTimeList, operationsPerSecondList, usedMemoryList } = this.extractMetrics(metrics);

		const executionTimeStats = this.getMetricStats(executionTimeList);
		const operationsPerSecondStats = this.getMetricStats(operationsPerSecondList);
		const usedMemoryStats = this.getMetricStats(usedMemoryList);

		return new BenchmarkResults(executionTimeStats, operationsPerSecondStats, usedMemoryStats);
	}
}
