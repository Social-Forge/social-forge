declare global {
	interface PageMetaProps {
		path_url?: string;
		title?: string;
		description?: string;
		keywords?: string[];
		robots?: string | boolean;
		canonical?: string;
		graph_type?: string;
		is_homepage?: boolean;
	}
	// components
	interface CountryItem {
		name: string;
		code: string;
		emoji: string;
		unicode: string;
		image: string;
		dial_code: string;
		minLength: number;
		maxLength: number;
		regexPattern: string; // Regex pattern for phone number validation
	}
	interface TimezoneOption {
		zone: string;
		gmt: string;
		name: string;
	}
	interface ScrollAnimationConfig {
		threshold?: number;
		rootMargin?: string;
		animatedSelectors?: string[];
		autoInit?: boolean;
		isEnabled?: boolean;
	}
	interface ScrollAnimationState {
		isInitialized: boolean;
		isEnabled: boolean;
		observedElements: number;
		observer: IntersectionObserver | null;
	}
	type ToastMessage = {
		id: string;
		message: string;
		type: 'success' | 'error' | 'warning' | 'info';
		duration?: number;
	};
}

export {};
