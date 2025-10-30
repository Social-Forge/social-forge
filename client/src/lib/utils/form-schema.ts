import { string, z } from 'zod';

export const registerSchema = z
	.object({
		first_name: z
			.string({ error: 'First name is required' })
			.min(3, 'First name must be at least 3 characters long')
			.nonempty('First name is required'),
		last_name: z
			.string({ error: 'Last name is required' })
			.min(3, 'Last name must be at least 3 characters long')
			.nonempty('Last name is required'),
		email: z
			.string({ error: 'Email is required' })
			.email('Email is not valid')
			.nonempty('Email is required'),
		username: z
			.string({ error: 'Username is required' })
			.min(3, 'Username must be at least 3 characters long')
			.regex(/^[a-z0-9]+$/, 'Username must be lowercase letters and numbers only, without spaces')
			.nonempty('Username is required'),
		phone: z
			.string()
			.regex(
				/^\+\d{1,4}[\d\s-]{6,15}$/,
				'Phone must start with country code (e.g., +1) and contain only numbers, spaces, or dashes'
			)
			.transform((val) => (val ? val.replace(/[\s-]/g, '') : ''))
			.refine((val) => !val || /^\+\d{1,4}\d{4,13}$/.test(val), {
				message: 'Phone must start with country code and contain only numbers after cleaning'
			})
			.refine((val) => !val || val.length >= 8, {
				message: 'Phone must be at least 8 characters long'
			})
			.refine((val) => !val || val.length <= 16, {
				message: 'Phone must be at most 16 characters long'
			})
			.optional()
			.or(z.literal('')),

		password: z
			.string({ error: 'Password is required' })
			.min(1, { message: 'Password is required' })
			.min(6, { message: 'Password must be at least 6 characters long' })
			.regex(/[A-Z]/, {
				message: 'Password must contain at least one uppercase letter'
			})
			.regex(/[0-9]/, { message: 'Password must contain at least one number' })
			.transform((value) => value.replaceAll(/\s+/g, '')),

		confirm_password: z
			.string({ error: 'Confirm password is required' })
			.nonempty({ message: 'Confirm password is required' })
			.transform((value) => value.replaceAll(/\s+/g, ''))
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirm_password) {
			ctx.addIssue({
				path: ['confirm_password'],
				code: z.ZodIssueCode.custom,
				message: 'Password and confirm password must be the same'
			});
		}
	});
export const loginSchema = z.object({
	identifier: z
		.string({ error: 'Email or username is required' })
		.min(3, 'Email or username must be at least 3 characters long')
		.nonempty('Email or username is required'),
	password: z
		.string({ error: 'Password is required' })
		.min(1, { message: 'Password is required' })
		.min(6, { message: 'Password must be at least 6 characters long' })
		.transform((value) => value.replaceAll(/\s+/g, '')),
	remember_me: z.boolean().optional().default(false)
});
export const forgotSchema = z.object({
	email: z
		.string({ error: 'Email is required' })
		.email('Email is not valid')
		.min(3, 'Email must be at least 3 characters long')
		.nonempty('Email is required')
});
export const resetPasswordSchema = z
	.object({
		new_password: z
			.string()
			.min(6, 'Password must be at least 6 characters')
			.transform((value) => value.replaceAll(/\s+/g, '')),
		confirm_password: z
			.string()
			.nonempty('Confirm password is required')
			.transform((value) => value.replaceAll(/\s+/g, '')),
		token: z.string().nonempty('Token is required')
	})
	.superRefine((data, ctx) => {
		if (data.new_password != data.confirm_password) {
			ctx.addIssue({
				path: ['confirm_password'],
				code: z.ZodIssueCode.custom,
				message: 'Password and confirm password must be the same'
			});
		}
	});

export const verifyTwoFactorSchema = z.object({
	token: z.string().nonempty('Two factor authentication token is required'),
	otp: z.string().nonempty('One time password is required')
});
export const updateProfileSchema = z.object({
	full_name: z
		.string({ error: 'Full name is required' })
		.min(3, 'Full name must be at least 3 characters long')
		.nonempty('Full name is required'),
	email: z
		.string({ error: 'Email is required' })
		.email('Email is not valid')
		.nonempty('Email is required'),
	username: z
		.string({ error: 'Username is required' })
		.min(3, 'Username must be at least 3 characters long')
		.regex(/^[a-z0-9]+$/, 'Username must be lowercase letters and numbers only, without spaces')
		.nonempty('Username is required'),
	phone: z
		.string()
		.regex(
			/^\+\d{1,4}[\d\s-]{6,15}$/,
			'Phone must start with country code (e.g., +1) and contain only numbers, spaces, or dashes'
		)
		.transform((val) => (val ? val.replace(/[\s-]/g, '') : ''))
		.refine((val) => !val || /^\+\d{1,4}\d{4,13}$/.test(val), {
			message: 'Phone must start with country code and contain only numbers after cleaning'
		})
		.refine((val) => !val || val.length >= 8, {
			message: 'Phone must be at least 8 characters long'
		})
		.refine((val) => !val || val.length <= 16, {
			message: 'Phone must be at most 16 characters long'
		})
		.optional()
		.or(z.literal(''))
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotSchema = z.infer<typeof forgotSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type VerifyTwoFactorSchema = z.infer<typeof verifyTwoFactorSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
