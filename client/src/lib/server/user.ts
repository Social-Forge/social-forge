import type { RequestEvent } from '@sveltejs/kit';
import type { UpdateProfileSchema, UpdatePasswordSchema, ActivatedTwoFactorSchema } from '@/utils';

export const createUserHelper = (event: RequestEvent): ServerUser => {
	const { apiHandler } = event.locals;

	const currentUser = async () => {
		try {
			const response = await apiHandler.authRequest<User>('GET', '/user/protected/me');
			if (!response.success) {
				return null;
			}
			return response.data;
		} catch (error) {
			return null;
		}
	};
	const logout = async () => {
		return await apiHandler.authRequest('POST', '/user/protected/logout');
	};
	const uploadAvatar = async (file: File) => {
		const formData = new FormData();
		formData.append('avatar', file);

		return await apiHandler.multipartAuthRequest<{ avatar_url: string }>(
			'POST',
			'/user/protected/avatar',
			formData
		);
	};
	const updateProfile = async (data: UpdateProfileSchema) => {
		return await apiHandler.authRequest<User>('PUT', '/user/protected/profile', data);
	};
	const changePassword = async (data: UpdatePasswordSchema) => {
		return await apiHandler.authRequest('PUT', '/user/protected/password', data);
	};
	const enableTwoFactor = async (status: string) => {
		const body = { status };
		return await apiHandler.authRequest<{ qr_code?: string; secret?: string }>(
			'POST',
			'/user/protected/two-factor/enable',
			body
		);
	};
	const verifyTwoFactor = async (data: ActivatedTwoFactorSchema) => {
		return await apiHandler.authRequest('POST', '/user/protected/two-factor/verify', data);
	};

	return {
		currentUser,
		logout,
		uploadAvatar,
		updateProfile,
		changePassword,
		enableTwoFactor,
		verifyTwoFactor
	};
};
