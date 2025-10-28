import {
	isPageLoading,
	isFormSubmitting,
	isManualSubmission,
	isPageReloading,
	forceResetProgress
} from '$lib/stores';

export function debugProgressState() {
	const states = {
		isPageLoading: false,
		isFormSubmitting: false,
		isManualSubmission: false,
		isPageReloading: false
	};

	isPageLoading.subscribe((val) => (states.isPageLoading = val))();
	isFormSubmitting.subscribe((val) => (states.isFormSubmitting = val))();
	isManualSubmission.subscribe((val) => (states.isManualSubmission = val))();
	isPageReloading.subscribe((val) => (states.isPageReloading = val))();

	const hasAnyActive = Object.values(states).some(Boolean);

	return states;
}
export function forceResetWithLog() {
	const beforeStates = debugProgressState();

	forceResetProgress();

	setTimeout(() => {
		debugProgressState();
	}, 100);

	return beforeStates;
}
export function setupAutoReset() {
	let stuckTimer: ReturnType<typeof setTimeout> | null = null;

	const checkStuck = () => {
		const states = debugProgressState();
		const hasActive = Object.values(states).some(Boolean);

		if (hasActive) {
			if (!stuckTimer) {
				stuckTimer = setTimeout(() => {
					forceResetWithLog();
					stuckTimer = null;
				}, 8000); // 8 seconds
			}
		} else {
			if (stuckTimer) {
				clearTimeout(stuckTimer);
				stuckTimer = null;
			}
		}
	};

	// Check every 2 seconds
	const interval = setInterval(checkStuck, 2000);

	// Return cleanup function
	return () => {
		clearInterval(interval);
		if (stuckTimer) {
			clearTimeout(stuckTimer);
		}
	};
}
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
	(window as any).debugProgress = debugProgressState;
	(window as any).forceResetProgress = forceResetWithLog;
	(window as any).setupAutoReset = setupAutoReset;
}
