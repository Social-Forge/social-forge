export const formatNumber = (num: number) => {
	return new Intl.NumberFormat('id-ID').format(num);
};
export const formatWhatsApp = (number: string) => {
	if (!number) return '';
	// Format: +62 812-3456-7890
	return number.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, '+$1 $2-$3-$4');
};
export const isFormatInternationalWhatsappNumber = (value: string): boolean => {
	const number = value.trim();

	// Jika kosong, skip validasi (required handled oleh min(1))
	if (!number) return false;

	// Validasi format internasional dengan +
	const internationalRegex = /^\+\d{1,4}\d{6,14}$/;

	// Validasi format lokal Indonesia
	const localIndonesiaRegex = /^0?8[1-9][0-9]{6,10}$/;

	// Validasi format internasional tanpa +
	const internationalNoPlusRegex = /^\d{1,4}\d{6,14}$/;

	if (internationalRegex.test(number)) {
		// Format internasional valid
		return true;
	} else if (localIndonesiaRegex.test(number)) {
		// Format lokal Indonesia - valid tapi perlu konversi
		return true;
	} else if (internationalNoPlusRegex.test(number)) {
		// Format internasional tanpa + - valid tapi perlu konversi
		return true;
	} else {
		// Format tidak valid
		return false;
	}
};
