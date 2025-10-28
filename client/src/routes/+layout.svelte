<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import { ProgressBar } from '@/components';
	import { userTenantStore } from '$lib/stores';
	import {
		setupAutoReset,
		handlePageLoading,
		handlePageReloading,
		handleSubmitLoading,
		handleManualSubmission,
		forceResetProgress,
		smartNavigation,
		waitForPageReady,
		isPageLoading,
		isPageReloading,
		isFormSubmitting,
		isManualSubmission
	} from '$lib/stores';
	import { ToastContent } from '$lib/components';

	let { data, children } = $props();
	const { userTenant: userTenantData } = $derived(data);

	const trackedMethods = ['post', 'patch', 'put', 'delete'];
	let originalFetch: typeof window.fetch;
	let activeIntervals = new Set<number>();
	let cleanupCallbacks = new Set<() => void>();
	let navigationTimeout: ReturnType<typeof setTimeout> | null = null;
	let formSubmissionTracker = new Map<HTMLFormElement, boolean>();
	let autoResetCleanup: (() => void) | null = null;
	let navigationStartTime: number = 0;
	let currentNavigationId: string | null = null;

	const waitForDOMReady = (): Promise<void> => {
		return new Promise((resolve) => {
			if (document.readyState === 'complete') {
				resolve();
			} else {
				const handler = () => {
					if (document.readyState === 'complete') {
						document.removeEventListener('readystatechange', handler);
						resolve();
					}
				};
				const safelyIntercept = () => {
					document.addEventListener('readystatechange', handler);
					setTimeout(resolve, 500);
				};
				safelyIntercept();
			}
		});
	};
	const setupInterceptors = () => {
		cleanupAll();
		originalFetch = window.fetch;
		const formCleanup = interceptFormSubmissions();
		const fetchCleanup = interceptFetchRequests();

		// const intervalId = window.setInterval(refreshSetting, 5 * 60 * 1000);
		// activeIntervals.add(intervalId);

		cleanupCallbacks.add(() => {
			formCleanup();
			fetchCleanup();
			// activeIntervals.delete(intervalId);
		});
	};
	const cleanupAll = () => {
		if (navigationTimeout) {
			clearTimeout(navigationTimeout);
			navigationTimeout = null;
		}

		activeIntervals.forEach((id) => clearInterval(id));
		cleanupCallbacks.forEach((fn) => fn());
		activeIntervals.clear();
		cleanupCallbacks.clear();
		formSubmissionTracker.clear();
		forceResetProgress();
	};
	function interceptFormSubmissions(): () => void {
		const submitHandler = (e: Event) => {
			const form = e.target as HTMLFormElement;
			if (trackedMethods.includes(form.method.toLowerCase())) {
				if (formSubmissionTracker.get(form)) {
					return;
				}

				formSubmissionTracker.set(form, true);
				handleSubmitLoading(true);

				const timeoutId = setTimeout(() => {
					formSubmissionTracker.delete(form);
					handleSubmitLoading(false);
				}, 10000); // 10 second timeout

				const completeSubmission = () => {
					clearTimeout(timeoutId);
					formSubmissionTracker.delete(form);
					handleSubmitLoading(false);
				};

				form.addEventListener('formdata', completeSubmission, { once: true });
				form.addEventListener('reset', completeSubmission, { once: true });
			}
		};

		document.addEventListener('submit', submitHandler);
		return () => {
			document.removeEventListener('submit', submitHandler);
			formSubmissionTracker.clear();
		};
	}
	function interceptFetchRequests(): () => void {
		const original = window.fetch;
		const pendingRequests = new Set<string>();

		window.fetch = async (input, init) => {
			const method = init?.method?.toLowerCase();
			let url: string;
			if (typeof input === 'string') {
				url = input;
			} else if (input instanceof URL) {
				url = input.href;
			} else if (input instanceof Request) {
				url = input.url;
			} else {
				url = 'unknown';
			}

			if (method && trackedMethods.includes(method)) {
				const requestKey = `${method}:${url}`;
				if (pendingRequests.has(requestKey)) {
					return original(input, init);
				}

				pendingRequests.add(requestKey);
				handleManualSubmission(true);

				try {
					const response = await original(input, init);
					return response;
				} finally {
					pendingRequests.delete(requestKey);

					setTimeout(() => {
						if (pendingRequests.size === 0) {
							handleManualSubmission(false);
						}
					}, 200);
				}
			}

			return original(input, init);
		};

		return () => {
			window.fetch = original;
			pendingRequests.clear();
		};
	}
	onMount(() => {
		if (!browser) return;

		const initializeApp = async () => {
			try {
				// Wait for DOM to be ready
				await waitForDOMReady();

				setupInterceptors();

				// Setup debug auto-reset for localhost
				if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
					autoResetCleanup = setupAutoReset();
				}
			} catch (error) {
				console.error('❌ App initialization failed:', error);
			}
		};

		// Initialize app
		initializeApp();

		// Return cleanup function for onMount
		return () => {
			cleanupAll();
			if (autoResetCleanup) {
				autoResetCleanup();
			}
		};
	});
	onDestroy(() => {
		cleanupAll();
		if (autoResetCleanup) {
			autoResetCleanup();
		}
		smartNavigation.cleanup();
	});
	$effect(() => {
		if (userTenantData) {
			userTenantStore.set(userTenantData);
		}
	});
	beforeNavigate(({ from, to, type }) => {
		if (navigationTimeout) {
			clearTimeout(navigationTimeout);
			navigationTimeout = null;
		}

		if (!from || !to) {
			// Full page reload
			handlePageReloading(true);
		} else if (from.url.pathname !== to.url.pathname) {
			// Route navigation
			navigationStartTime = Date.now();
			currentNavigationId = `nav-${navigationStartTime}`;

			smartNavigation.setActiveNavigation(currentNavigationId);
			handlePageLoading(true);

			let timeoutDuration = 8000;

			const targetRoute = to.url.pathname;
			if (targetRoute.includes('/admin')) {
				timeoutDuration = 10000;
			} else if (type === 'popstate') {
				timeoutDuration = 3000;
			} else if (type === 'link') {
				timeoutDuration = 6000;
			}

			navigationTimeout = setTimeout(() => {
				const elapsed = Date.now() - navigationStartTime;

				if (currentNavigationId && smartNavigation.isNavigationActive(currentNavigationId)) {
					smartNavigation.clearActiveNavigation(currentNavigationId);
					handlePageLoading(false);
					handlePageReloading(false);
				}
				navigationTimeout = null;
			}, timeoutDuration);
		}
	});

	afterNavigate(({ from, to, type }) => {
		if (navigationTimeout) {
			clearTimeout(navigationTimeout);
			navigationTimeout = null;
		}

		const navigationTime = Date.now() - navigationStartTime;
		const navId = currentNavigationId;

		if (!navId || !smartNavigation.isNavigationActive(navId)) {
			return;
		}

		waitForPageReady({
			maxWaitTime: smartNavigation.isNavigationSlow(navigationStartTime) ? 1000 : 2000,
			selectors: ['main', '[data-sveltekit-loaded]', '.content', '#app > *']
		})
			.then(() => {
				// Double check navigation is still active
				if (navId && smartNavigation.isNavigationActive(navId)) {
					smartNavigation.clearActiveNavigation(navId);

					const totalTime = Date.now() - navigationStartTime;
					setTimeout(() => {
						handlePageLoading(false);
						handlePageReloading(false);
					}, 50);
				}
			})
			.catch((error) => {
				if (navId) {
					smartNavigation.clearActiveNavigation(navId);
				}
				handlePageLoading(false);
				handlePageReloading(false);
			});
	});
</script>

<ModeWatcher />
<ProgressBar />
<ToastContent />
<main
	class="bg-background text-foreground scrollbar-primary min-h-screen overflow-x-hidden antialiased"
>
	{@render children?.()}
</main>
