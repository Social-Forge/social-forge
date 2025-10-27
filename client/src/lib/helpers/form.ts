import type { SubmitFunction } from '@sveltejs/kit';

export function formHeaderRequest(input: Parameters<SubmitFunction>[0]) {
	return new Promise<XMLHttpRequest>((resolve) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.onprogress = function (event) {
			// progress = Math.round((100 * event.loaded) / event.total);
		};

		xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
				// progress = 0;
				resolve(xhr);
			}
		};

		xhr.open('POST', input.action, true);
		xhr.send(input.formData);
	});
}
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}
export function serializeFormErrors(errors: any) {
	if (!errors) return null;

	return Object.fromEntries(
		Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value : [value]])
	);
}
