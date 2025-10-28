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

	return {
		currentUser
	};
};
