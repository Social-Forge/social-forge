import type { RequestEvent } from '@sveltejs/kit';
import type { UpdateTenantSchema } from '@/utils';

export const createTenantHelper = (event: RequestEvent): TenantServer => {
	const { apiHandler } = event.locals;

	const updateInfo = async (payload: UpdateTenantSchema) => {
		return await apiHandler.authRequest<Tenant>('PUT', `/tenants/protected/info/${payload.id}`, {
			name: payload.name,
			slug: payload.slug,
			sub_domain: payload.subdomain,
			description: payload.description
		});
	};

	const uploadLogo = async (file: File) => {
		const formData = new FormData();
		formData.append('logo', file);

		return await apiHandler.multipartAuthRequest<{ logo_url: string }>(
			'POST',
			'/tenants/protected/logo',
			formData
		);
	};
	return {
		uploadLogo,
		updateInfo
	};
};
