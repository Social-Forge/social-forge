import type { RequestEvent } from '@sveltejs/kit';
import type {
	RegisterSchema,
	LoginSchema,
	ForgotSchema,
	ResetPasswordSchema,
	VerifyTwoFactorSchema
} from '@/utils';

export const createAuthHelper = (event: RequestEvent): ServerAuth => {
	const { apiHandler } = event.locals;

	const register = async (value: RegisterSchema) => {
		return await apiHandler.publicRequest('POST', '/auth/register', value);
	};
	const login = async (value: LoginSchema) => {
		return await apiHandler.publicRequest<LoginResponse>('POST', '/auth/login', value);
	};
	const forgot = async (value: ForgotSchema) => {
		return await apiHandler.publicRequest('POST', '/auth/forgot', value);
	};
	const verifyEmail = async (token: string) => {
		return await apiHandler.publicRequest('POST', '/auth/verify-email', { token });
	};
	const resetPassword = async (value: ResetPasswordSchema) => {
		return await apiHandler.publicRequest('POST', '/auth/reset-password', value);
	};
	const verifyTwoFactor = async (value: VerifyTwoFactorSchema) => {
		return await apiHandler.publicRequest<LoginResponse>('POST', '/auth/verify-two-factor', value);
	};
	const refreshToken = async (refreshToken: string) => {
		return await apiHandler.publicRequest<LoginResponse>('POST', '/auth/refresh-token', {
			refresh_token: refreshToken
		});
	};
	return {
		register,
		login,
		forgot,
		verifyEmail,
		resetPassword,
		verifyTwoFactor,
		refreshToken
	};
};
