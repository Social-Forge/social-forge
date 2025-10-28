import { writable, derived } from 'svelte/store';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export const isLoading = writable(false);
export const isPageLoading = writable(false);
export const isFormSubmitting = writable(false);
export const isManualSubmission = writable(false);
export const isPageReloading = writable(false);
export const scrollLock = writable(false);
// State untuk tracking loading yang sedang aktif
let activeLoadingType: string | null = null;
let completionTimer: ReturnType<typeof setTimeout> | null = null;

export const loadProgress = tweened(0, {
	easing: cubicOut,
	duration: 200
});

export const opacity = tweened(0, { easing: cubicOut });

export const hasActiveLoading = derived(
	[isPageLoading, isFormSubmitting, isManualSubmission, isPageReloading],
	([$isPageLoading, $isFormSubmitting, $isManualSubmission, $isPageReloading]) => {
		return $isPageLoading || $isFormSubmitting || $isManualSubmission || $isPageReloading;
	}
);

function startLoading(type: string, initialProgress: number = 20) {
	if (completionTimer) {
		clearTimeout(completionTimer);
		completionTimer = null;
	}

	activeLoadingType = type;

	opacity.set(1, { duration: 0 });
	loadProgress.set(initialProgress, { duration: 300 });

	setTimeout(() => {
		if (activeLoadingType === type) {
			loadProgress.set(initialProgress + 30, { duration: 500 });
		}
	}, 400);

	setTimeout(() => {
		if (activeLoadingType === type) {
			loadProgress.set(initialProgress + 50, { duration: 800 });
		}
	}, 1000);
}

function completeLoading(type: string) {
	// Hanya complete jika type match dengan yang aktif
	if (activeLoadingType !== type) {
		return;
	}
	// Clear active type
	activeLoadingType = null;
	// Complete progress
	loadProgress.set(100, { duration: 200 });
	// Clear existing timer
	if (completionTimer) {
		clearTimeout(completionTimer);
	}
	// Reset after completion
	completionTimer = setTimeout(() => {
		// Double check tidak ada loading lain yang aktif
		hasActiveLoading.subscribe((hasActive) => {
			if (!hasActive) {
				loadProgress.set(0, { duration: 0 });
				opacity.set(0, { duration: 150 });
			}
		})();
		completionTimer = null;
	}, 400);
}

export function handlePageLoading(isNavigating: boolean) {
	if (isNavigating) {
		isPageLoading.set(true);
		startLoading('page', 15);
	} else {
		isPageLoading.set(false);
		completeLoading('page');
	}
}

export function handlePageReloading(isReloading: boolean) {
	if (isReloading) {
		isPageReloading.set(true);
		startLoading('reload', 10);
	} else {
		isPageReloading.set(false);
		completeLoading('reload');
	}
}

export function handleSubmitLoading(isSubmitting: boolean) {
	if (isSubmitting) {
		isFormSubmitting.set(true);
		isManualSubmission.set(false); // Clear manual submission
		startLoading('form', 25);
	} else {
		isFormSubmitting.set(false);
		completeLoading('form');
	}
}

export function handleManualSubmission(isSubmitting: boolean) {
	if (isSubmitting) {
		isManualSubmission.set(true);
		isFormSubmitting.set(false); // Clear form submission
		startLoading('manual', 30);
	} else {
		isManualSubmission.set(false);
		completeLoading('manual');
	}
}

export function forceResetProgress() {
	if (completionTimer) {
		clearTimeout(completionTimer);
		completionTimer = null;
	}

	activeLoadingType = null;
	isPageLoading.set(false);
	isFormSubmitting.set(false);
	isManualSubmission.set(false);
	isPageReloading.set(false);

	loadProgress.set(0, { duration: 0 });
	opacity.set(0, { duration: 0 });
}

export function disableScroll() {
	scrollLock.set(true);
	document.body.style.overflow = 'hidden';
}

export function enableScroll() {
	scrollLock.set(false);
	document.body.style.overflow = '';
}
