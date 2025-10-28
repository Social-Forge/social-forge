import { tick } from 'svelte';

interface NavigationOptions {
	maxWaitTime?: number;
	checkInterval?: number;
	selectors?: string[];
}

export class SmartNavigation {
	private static instance: SmartNavigation;
	private observers: MutationObserver[] = [];
	private activeNavigation: string | null = null;

	static getInstance() {
		if (!SmartNavigation.instance) {
			SmartNavigation.instance = new SmartNavigation();
		}
		return SmartNavigation.instance;
	}

	async waitForPageReady(options: NavigationOptions = {}): Promise<void> {
		const {
			maxWaitTime = 3000,
			checkInterval = 50,
			selectors = ['main', '[data-content]', '.content', '#content']
		} = options;

		return new Promise((resolve) => {
			const startTime = Date.now();
			let resolved = false;

			const resolve_ = () => {
				if (!resolved) {
					resolved = true;
					resolve();
				}
			};

			tick().then(() => {
				const checkContent = () => {
					if (resolved) return;

					const elapsed = Date.now() - startTime;
					if (elapsed > maxWaitTime) {
						resolve_();
						return;
					}
					const hasContent = selectors.some((selector) => {
						const elements = document.querySelectorAll(selector);
						return (
							elements.length > 0 &&
							Array.from(elements).some((el) => el.textContent?.trim() || el.children.length > 0)
						);
					});

					if (hasContent) {
						resolve_();
					} else {
						setTimeout(checkContent, checkInterval);
					}
				};
				setTimeout(checkContent, 10);
			});
			setTimeout(resolve_, maxWaitTime);
		});
	}
	observeContentChanges(callback: () => void): () => void {
		if (!browser) return () => {};

		const observer = new MutationObserver((mutations) => {
			const hasSignificantChanges = mutations.some((mutation) => {
				return (
					mutation.type === 'childList' &&
					(mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
				);
			});

			if (hasSignificantChanges) {
				callback();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: false
		});

		this.observers.push(observer);

		return () => {
			observer.disconnect();
			const index = this.observers.indexOf(observer);
			if (index > -1) {
				this.observers.splice(index, 1);
			}
		};
	}

	isNavigationSlow(startTime: number, threshold: number = 2000): boolean {
		return Date.now() - startTime > threshold;
	}

	cleanup() {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers = [];
		this.activeNavigation = null;
	}

	setActiveNavigation(id: string) {
		this.activeNavigation = id;
	}

	isNavigationActive(id: string): boolean {
		return this.activeNavigation === id;
	}

	clearActiveNavigation(id: string) {
		if (this.activeNavigation === id) {
			this.activeNavigation = null;
		}
	}
}

const browser = typeof window !== 'undefined';
export const smartNavigation = SmartNavigation.getInstance();
export async function waitForPageReady(options?: NavigationOptions): Promise<void> {
	return smartNavigation.waitForPageReady(options);
}
