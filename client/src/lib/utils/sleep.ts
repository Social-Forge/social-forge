export function sleep(durationMs: number): Promise<void> {
	return new Promise((res) => setTimeout(res, durationMs));
}
