import { goto } from '$app/navigation';
import { page } from '$app/state';

export class QueryHelper {
	/**
	 * Build query string from pagination params
	 */
	static buildQueryString(params: QueryParams): string {
		const searchParams = new URLSearchParams();

		// Basic pagination
		if (params.page > 1) searchParams.set('page', params.page.toString());
		if (params.limit !== 10) searchParams.set('limit', params.limit.toString());

		// Search and filters
		if (params.search) searchParams.set('search', params.search);
		if (params.status) searchParams.set('status', params.status);
		if (params.sort_by) searchParams.set('sort_by', params.sort_by);
		if (params.order_by && params.order_by !== 'desc')
			searchParams.set('order_by', params.order_by);

		// Boolean filters
		if (params.include_deleted) searchParams.set('include_deleted', 'true');
		if (params.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
		if (params.is_verified !== undefined)
			searchParams.set('is_verified', params.is_verified.toString());

		// IDs
		if (params.tenant_id) searchParams.set('tenant_id', params.tenant_id);
		if (params.user_id) searchParams.set('user_id', params.user_id);
		if (params.division_id) searchParams.set('division_id', params.division_id);

		// Extra parameters
		if (params.extra) {
			Object.entries(params.extra).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					searchParams.set(`extra.${key}`, value.toString());
				}
			});
		}

		return searchParams.toString();
	}
	/**
	 * Parse query string to pagination params
	 */
	static parseQueryString(url: URL): Partial<QueryParams> {
		const params: Partial<QueryParams> = {};
		const searchParams = url.searchParams;

		// Basic pagination
		const page = searchParams.get('page');
		const limit = searchParams.get('limit');

		if (page) params.page = parseInt(page);
		if (limit) params.limit = parseInt(limit);

		// Filters
		params.search = searchParams.get('search') || undefined;
		params.status = searchParams.get('status') || undefined;
		params.sort_by = searchParams.get('sort_by') || undefined;
		params.order_by = (searchParams.get('order_by') as 'asc' | 'desc') || undefined;

		// Boolean filters
		const include_deleted = searchParams.get('include_deleted');
		const is_active = searchParams.get('is_active');
		const is_verified = searchParams.get('is_verified');

		if (include_deleted) params.include_deleted = include_deleted === 'true';
		if (is_active) params.is_active = is_active === 'true';
		if (is_verified) params.is_verified = is_verified === 'true';

		// IDs
		params.tenant_id = searchParams.get('tenant_id') || undefined;
		params.user_id = searchParams.get('user_id') || undefined;
		params.division_id = searchParams.get('division_id') || undefined;

		// Extra parameters
		const extra: Record<string, any> = {};
		searchParams.forEach((value, key) => {
			if (key.startsWith('extra.')) {
				const extraKey = key.replace('extra.', '');
				extra[extraKey] = value;
			}
		});

		if (Object.keys(extra).length > 0) {
			params.extra = extra;
		}

		return params;
	}
	/**
	 * Navigate with pagination params
	 */
	static async navigateWithParams(
		params: QueryParams,
		basePath: string = page.url.pathname || '/'
	): Promise<void> {
		const queryString = this.buildQueryString(params);
		const url = queryString ? `${basePath}?${queryString}` : basePath;

		await goto(url, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}
	/**
	 * Calculate pagination meta from response
	 */
	static calculateMeta(page: number, limit: number, totalRows: number) {
		const totalPages = Math.ceil(totalRows / limit);

		return {
			page,
			limit,
			total_rows: totalRows,
			total_pages: totalPages,
			has_prev: page > 1,
			has_next: page < totalPages
		};
	}
}
