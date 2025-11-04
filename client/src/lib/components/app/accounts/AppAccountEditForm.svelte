<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { cn, type UpdateProfileSchema } from '@/utils';
	import { AppAlertDialog } from '@/components';
	import { CountryList } from '@/constants';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Icon from '@iconify/svelte';
	import { Spinner } from '@/components/ui/spinner';
	import { Button } from '@/components/ui/button';
	import { handleSubmitLoading } from '@/stores';

	let {
		openform = $bindable(),
		form: updateForm,
		user
	}: {
		openform: boolean;
		user?: User | null;
		form: SuperValidated<UpdateProfileSchema>;
	} = $props();

	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const { form, errors, submitting, enhance } = superForm(updateForm, {
		resetForm: false,
		onUpdate(event) {
			if (event.result.type === 'failure') {
				handleSubmitLoading(false);
				errorMessage = event.result.data.error.message;
				return;
			}
			handleSubmitLoading(false);
			successMessage = event.result.data.message || 'Profile updated successfully';
			openform = false;
		},
		onError(event) {
			handleSubmitLoading(false);
			errorMessage = event.result.error.message || 'An error occurred';
		}
	});

	const isValidPhone = $derived.by(() => {
		const number = $form.phone?.trim();
		if (!number) {
			return false;
		}
		return CountryList.some((country) => new RegExp(country.regexPattern).test(number));
	});
	const validatePhone = () => {
		let number = $form.phone?.trim() || '';

		delete $errors.phone;

		if (!number) {
			$errors.phone = ['Phone number is required'];
			return;
		}

		// Normalize input - hapus spasi, dash, parentheses
		number = number.replace(/[\s\-\(\)]/g, '');

		// Case 1: Format internasional (dengan +)
		if (number.startsWith('+')) {
			const numberWithoutPlus = number.substring(1);

			// Cari country yang match berdasarkan dial_code
			const matchedCountry = CountryList.find((country) =>
				numberWithoutPlus.startsWith(country.dial_code.replace('+', ''))
			);

			if (matchedCountry) {
				const localNumber = numberWithoutPlus.substring(
					matchedCountry.dial_code.replace('+', '').length
				);
				const numberLength = localNumber.length;

				// Validasi panjang nomor
				if (numberLength < matchedCountry?.minLength || numberLength > matchedCountry?.maxLength) {
					$errors.phone = [
						`The phone number ${matchedCountry.name} must be ${matchedCountry.minLength}-${matchedCountry.maxLength} digits after the country code ${matchedCountry.dial_code}`
					];
					return;
				}

				// Validasi format angka (harus numeric)
				if (!/^\d+$/.test(localNumber)) {
					$errors.phone = ['The phone number must contain only numbers after the country code'];
					return;
				}

				// console.log(`Valid ${matchedCountry.name} number:`, number);
				return; // Valid international number
			} else {
				$errors.phone = ['The country code is not recognized or supported'];
				return;
			}
		}

		// Case 2: Format lokal Indonesia (default)
		const indonesiaPattern = /^(0?8[1-9][0-9]{6,10})$/;
		if (indonesiaPattern.test(number)) {
			const indonesiaCountry = CountryList.find((c) => c.code === 'ID');
			let cleanNumber = number;

			// Hapus leading zero jika ada
			if (cleanNumber.startsWith('0')) {
				cleanNumber = cleanNumber.substring(1);
			}

			// Validasi panjang untuk Indonesia
			const numberLength = cleanNumber.length;
			if (
				indonesiaCountry &&
				(numberLength < indonesiaCountry?.minLength || numberLength > indonesiaCountry?.maxLength)
			) {
				$errors.phone = [
					`The phone number in Indonesia must be ${indonesiaCountry?.minLength}-${indonesiaCountry?.maxLength} digits`
				];
				return;
			}

			$form.phone = '+62' + cleanNumber;
			// console.log('Auto-converted Indonesian local to international:', $form.phone);
			return;
		}

		// Case 3: Format numeric only (tanpa + atau 0)
		if (/^\d{8,15}$/.test(number)) {
			// Coba cari country berdasarkan pattern atau default ke Indonesia
			let matchedCountry = CountryList.find((country) => {
				const localNumber = number;
				return localNumber.length >= country.minLength && localNumber.length <= country.maxLength;
			});

			// Default ke Indonesia jika tidak ditemukan
			if (!matchedCountry) {
				matchedCountry = CountryList.find((c) => c.code === 'ID');
			}

			if (matchedCountry) {
				$form.phone = matchedCountry.dial_code + number;
				// console.log(`Auto-converted numeric to ${matchedCountry.name}:`, $form.phone);
				return;
			}
		}

		// Case 4: Invalid format
		$errors.phone = [
			'Invalid phone number format. Example:\n' +
				'• International: +628123456789\n' +
				'• Local Indonesia: 08123456789\n' +
				'• Numeric: 8123456789'
		];
	};
	const validatePhoneAdvanced = () => {
		let number = $form.phone?.trim();

		delete $errors.phone;

		if (!number) {
			$errors.phone = ['Phone number is required'];
			return;
		}

		// Normalize input
		number = number.replace(/[\s\-\(\)]/g, '');

		// Helper function untuk validasi country
		const validateCountryNumber = (countryCode: string, localNumber: string) => {
			const country = CountryList.find((c) => c.code === countryCode);
			if (!country) return false;

			const numberLength = localNumber.length;
			return (
				numberLength >= country.minLength &&
				numberLength <= country.maxLength &&
				/^\d+$/.test(localNumber)
			);
		};

		// 1. International format detection
		if (number.startsWith('+')) {
			const numberWithoutPlus = number.substring(1);

			for (const country of CountryList) {
				const countryCode = country.dial_code.replace('+', '');
				if (numberWithoutPlus.startsWith(countryCode)) {
					const localNumber = numberWithoutPlus.substring(countryCode.length);

					if (validateCountryNumber(country.code, localNumber)) {
						console.log(`Valid ${country.name} number:`, number);
						return true;
					} else {
						$errors.phone = [
							`The phone number ${country.name} must be ${country.minLength}-${country.maxLength} digits after ${country.dial_code}`
						];
						return false;
					}
				}
			}

			$errors.phone = ['The country code is not recognized or supported'];
			return false;
		}

		// 2. Indonesia local format detection
		const indonesiaPattern = /^(0?8[1-9][0-9]{6,10})$/;
		if (indonesiaPattern.test(number)) {
			let cleanNumber = number;
			if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);

			if (validateCountryNumber('ID', cleanNumber)) {
				$form.phone = '+62' + cleanNumber;
				console.log('Converted Indonesia local:', $form.phone);
				return true;
			}
		}

		// 3. Numeric only - try to detect country
		if (/^\d{8,15}$/.test(number)) {
			// Priority countries untuk detection
			const priorityCountries = ['ID', 'US', 'GB', 'IN', 'BR', 'NG', 'BD', 'PK', 'MX', 'PH'];

			for (const countryCode of priorityCountries) {
				const country = CountryList.find((c) => c.code === countryCode);
				if (country && validateCountryNumber(countryCode, number)) {
					$form.phone = country.dial_code + number;
					console.log(`Auto-detected as ${country.name}:`, $form.phone);
					return true;
				}
			}

			// Fallback: cari semua countries
			for (const country of CountryList) {
				if (validateCountryNumber(country.code, number)) {
					$form.phone = country.dial_code + number;
					console.log(`Fallback detected as ${country.name}:`, $form.phone);
					return true;
				}
			}
		}

		// 4. Invalid format
		$errors.phone = [
			'Invalid phone number format. Example:\n' +
				'• International: +628123456789\n' +
				'• Local Indonesia: 08123456789\n' +
				'• Numeric: 8123456789'
		];
		return false;
	};
</script>

<form method="POST" action="?/profile" class="space-y-6 px-2 py-5 md:px-4 md:py-6" use:enhance>
	<Field.Group
		class="rounded-lg border-t border-neutral-200 bg-neutral-50 px-2 py-5 shadow-xl md:px-4 md:py-6 dark:border-neutral-700 dark:bg-neutral-900"
	>
		<Field.Field>
			<Field.Label for="full_name">
				Name <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.full_name}
					name="full_name"
					type="text"
					class="ps-10"
					placeholder="Enter your full name"
					aria-invalid={!!$errors.full_name}
					autocomplete="name"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.full_name}
				<Field.Error>{$errors.full_name}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="username">
				Username <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.username}
					name="username"
					type="text"
					class="ps-10"
					placeholder="Enter your username"
					aria-invalid={!!$errors.username}
					autocomplete="username"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.username}
				<Field.Error>{$errors.username}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="email">
				Email <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="mdi:email" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.email}
					name="email"
					type="email"
					class="ps-10"
					placeholder="Enter your email"
					aria-invalid={!!$errors.email}
					autocomplete="email"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.email}
				<Field.Error>{$errors.email}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="phone">
				Phone <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="mdi:phone" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.phone}
					name="phone"
					type="tel"
					class="ps-10"
					placeholder="Enter your phone number"
					aria-invalid={!!$errors.phone}
					autocomplete="tel"
					disabled={$submitting}
					onblur={validatePhone}
					oninput={() => {
						if ($errors.phone) {
							delete $errors.phone;
						}
					}}
				/>
			</div>
			{#if $errors.phone}
				<Field.Error>{$errors.phone}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field orientation="horizontal" class="mt-6 justify-end pb-4">
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Please wait...' : 'Update Profile'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>

{#if errorMessage}
	<AppAlertDialog
		open={true}
		type="error"
		title="Error"
		message={errorMessage || 'An error occurred'}
		onclose={() => {
			errorMessage = null;
		}}
	/>
{/if}

{#if successMessage}
	<AppAlertDialog
		open={true}
		type="success"
		title="Success"
		message={successMessage || 'Profile updated successfully'}
		onclose={() => {
			successMessage = null;
		}}
	/>
{/if}
