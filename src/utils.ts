export function getSixDigitsRoundedAbs(value: number): number {
	return Math.round(Math.abs(value) * 1_000_000) / 1_000_000;
}
