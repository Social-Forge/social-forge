import type { RequestEvent } from '@sveltejs/kit';

export const createUserHelper = (event: RequestEvent): ServerUser => {
	const { apiHandler } = event.locals;

	const currentUser = async () => {
		try {
			const response = await apiHandler.authRequest<User>('GET', '/user/me');
			if (!response.success) {
				return null;
			}
			return response.data;
		} catch (error) {
			return null;
		}
	};
	const logout = async () => {
		return await apiHandler.authRequest('POST', '/user/logout');
	};
	const uploadAvatar = async (file: File) => {
		const formData = new FormData();
		formData.append('avatar', file);

		return await apiHandler.multipartAuthRequest<{ avatar_url: string }>(
			'POST',
			'/user/avatar',
			formData
		);
	};

	return {
		currentUser,
		logout,
		uploadAvatar
	};
};
