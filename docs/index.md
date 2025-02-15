# Introducing Performer

## Table of contents

- [Introducing Performer](#introducing-performer)
  - [Table of contents](#table-of-contents)
  - [Objective](#objective)
  - [Usage](#usage)
  - [Benchmark: Arguments and Results](#benchmark-arguments-and-results)
    - [Arguments](#arguments)
    - [Results](#results)
  - [Utilities](#utilities)
    - [Create arrays for use in benchmarks](#create-arrays-for-use-in-benchmarks)
  - [Real world example](#real-world-example)
  - [Contribute](#contribute)
  - [Keywords](#keywords)

## Objective

Performer aims at catching regressions you could introduce in your code, as well as check the performances in the first place. By using Performer in your unit tests, you can create performance regression tests, that will help you to avoid missing code changes that might harm your code performances very quickly. Using Performer in this case will allow you to **safely refactor** or **reliably optimize** your code without the risk of introducing changes that might affect performances that you could miss before going live on production.

Performer is meant to **benchmark code you control**: to get the most reliable results, you must make sure to properly mock any external service that you code is using (e.g. database calls, etc.).

When benchmarking a function, it will be instrumented so it can track **Execution time** in ms (also converted to **Operations per second**) and **Memory usage** in MB. Statistics are computed from these metrics: **samples**, **min**, **max**, **sum**, **avg** and **stdDev** (standard deviation).
You can then use these stats as you want in your tests to ensure your code's performance is watched and validated.

Performer does not use any dependency, and solely rely on Performance and Process APIs. It has been thought to be run in Node.js in unit tests, and is not recommend for use in production code or in the browser.

Performance has been inspired by tools like [JSPerf](https://jsperf.app/) and [Benchmark.js](https://benchmarkjs.com/) (which are very often used sporadically only), as well as **professional experience**, leading to its creation to bring more complete and exploitable benchmarking into code testing, in order to improve code robustness and complete experienced code reviews.

## Usage

- Install Performer (as a dev dependency)

```sh
npm i -D @that-one-tool/performer
```

- Import and create a Performer instance

```typescript
// ESM
import { Performer } from '@that-one-tool/performer';

// CJS
const { Performer } = require('@that-one-tool/performer');

...
// Before the test suits
const performer = new Performer();
```

**Note:** A Performer instance must be created since it must retain recorded metrics during benchmarks.

- Benchmark a function

```typescript
// Benchmark a synchronous function (add), running it 10 times max (default) in a 1000ms max (default) time frame
const results = performer.benchmarkFunction(add(1, 2));

// Benchmark an asynchronous class (foo) method (bar), running it 50 times in a 2000ms max time frame
const results = performer.benchmarkAsyncFunction(() => foo.bar(), 50, 2000);
```

- Use benchmark results

```typescript
// Check the code is executing under 10ms on average
assert.ok(results.getExecutionTimeStats().avg < 10);
```

- Clear Performer after a test suit

```typescript
// Between test suits
performer.clear();
```

## Benchmark: Arguments and Results

### Arguments

Both `benchmarkFunction` and `benchmarkAsyncFunction` take the same input arguments:

- `func` [required] the function to run (for a class method, wrap the function call in an anonymous function to preserve `this` binding)
- `maxIterations` [optional - default `10`] the maximum number of iterations of the benchmark before stopping it
- `maxTotalDurationMs` [optional - default `1000`] the maximum total benchmark duration before stopping it (note: this max time can be exceeded given the tested function's execution time)

**Note:** Trying to use `benchmarkFunction` with an asynchronous function will result in an error to be thrown.

### Results

The benchmark results are returned as an instance of the class `BenchmarkResults`, with the three following methods callable:

- `getExecutionTimeStats()`
- `getOperationsPerSecondStats()`
- `getUsedMemoryStats()`

Each of these methods returns a `Stats` object, with the following members:

- `samples` (the number of samples used to compute the stats, equals to the number of iterations run)
- `min` (the minimum value among the samples)
- `max` (the maximum value among the samples)
- `sum` (the sum of all the samples)
- `avg` (the average value of the samples)
- `stdDev` (the standard deviation of the samples)

`BenchmarkResults` also exposes the method `getErrors()`, from which you can get an array of the errors thrown during the benchmark.

## Utilities

### Create arrays for use in benchmarks

The `Performer` class exposes 3 static methods to create arrays that can then be used in benchmarks:

```typescript
// To create an array of a given size (size is optional, default to 1000 items) which values are created by the generator function you provide
createCustomArray(generatorFunction, size): T[]
// Example
const arr = createCustomArray(() => { id: randomUUID() });

// To create a random numbers array of a given size (size is optional, default to 1000 items)
createRandomNumberArray(size): number[]

// To create a random strings (UUIDv4) array of a given size (size is optional, default to 1000 items)
createRandomStringArray(size): string[]
```

## Real world example

Once upon a time, a seemingly harmless refactor was attempted. In order to zip 2 arrays into a key/value pair object, a `zip` utility function was developed, relying on the `reduce` built-in function. Even though `reduce` might help to improve readability, an incorrect usage can lead to huge performance impact.

The introduced code was the following:

```typescript
return arrayA.reduce((obj, val, i) => {
	return { ...obj, [arrayA[i]]: arrayB[i] };
}, {});
```

Luckily, advised reviewer catched this before it was merged into the code base. The use of reduce here in addition to the spread operator on an ever growing object leads to copying over and over the data, overloading the memory and using a lot of CPU. Instead of using a simple for loop, taking about 1ms (and just a couple of kB) for 1500 string entries, this code takes about 150ms (plus about 6MB of memory) for the same 1500 entries. When this code lies in a script intended for high performance, this can become really harmful (and expensive).

By adding a simple performance test of the code, which breaks when the code takes more than `X`ms to run, or more than `Y`MB of memory is used, this simple change can be catched even before going into review (since the difference is really important).

## Contribute

Please feel free to suggest improvements, features or bug fix through Git issues. Pull Requests for that are also more than welcome.

## Keywords

`performance` `speed` `memory` `cpu` `benchmark` `measurement` `validation` `test` `regression`
