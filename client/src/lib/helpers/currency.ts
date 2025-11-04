export function formatCurrency(value: number): string {
	return value.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
}
export const formatBalance = (balance: string | number | null | undefined): string => {
	if (!balance) return '0.00';

	const amount = typeof balance === 'string' ? parseFloat(balance) : balance;

	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount || 0);
};
export const formatBalanceWithCurrency = (balance: string | number | null | undefined): string => {
	const formatted = formatBalance(balance);
	return `USD ${formatted}`;
};
export const formatBalanceShort = (balance: string | number | null | undefined): string => {
	return formatBalance(balance);
};
export const formatBalanceWithSymbol = (balance: string | number | null | undefined): string => {
	const formatted = formatBalance(balance);
	return `$ ${formatted}`;
};
export const formatBalanceCompact = (balance: string | number | null | undefined): string => {
	if (!balance) return '0';

	const amount = typeof balance === 'string' ? parseFloat(balance) : balance;

	if (amount >= 1000000) {
		return `USD ${(amount / 1000000).toFixed(1)}`;
	} else if (amount >= 1000) {
		return `USD ${(amount / 1000).toFixed(1)}K`;
	}

	return formatBalanceWithCurrency(balance);
};
