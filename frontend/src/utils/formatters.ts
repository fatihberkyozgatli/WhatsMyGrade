/**
 * Format grade: removes trailing zeros and unnecessary decimal places
 * Examples:
 * - 92.00 → "92"
 * - 93.40 → "93.4"
 * - 93.45 → "93.45"
 * - null → "N/A"
 * 
 * @param value The grade value to format
 * @param decimals Maximum decimal places to show (default 2)
 * @returns Formatted grade as string without trailing zeros
 */
export const formatGrade = (value: number | null, decimals: number = 2): string => {
  if (value === null) return 'N/A';
  return parseFloat(value.toFixed(decimals)).toString();
};

/**
 * Format grade with % symbol
 * Examples:
 * - 92.00 → "92%"
 * - 93.40 → "93.4%"
 * - 93.45 → "93.45%"
 * - null → "N/A"
 * 
 * @param value The grade value to format
 * @param decimals Maximum decimal places to show (default 2)
 * @returns Formatted grade with % symbol
 */
export const formatGradePercent = (value: number | null, decimals: number = 2): string => {
  const formatted = formatGrade(value, decimals);
  return formatted === 'N/A' ? formatted : `${formatted}%`;
};
