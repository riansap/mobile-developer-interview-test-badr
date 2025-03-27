export const formatToRupiah = (
    value: number,
    options: Partial<{
        maximumFractionDigits: number;
        showCurrency: boolean;
    }> = {},
): string => {
    const { maximumFractionDigits = 0, showCurrency = true } = options;

    return value.toLocaleString('id-ID', {
        style: showCurrency ? 'currency' : 'decimal',
        maximumFractionDigits, // Menentukan jumlah digit desimal maksimum
        currency: 'IDR',
    });
};