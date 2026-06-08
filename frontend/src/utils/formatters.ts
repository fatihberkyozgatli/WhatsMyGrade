export const formatGrade = (value: number | null, decimals: number = 2): string => {
  if (value === null) return 'N/A';
  return parseFloat(value.toFixed(decimals)).toString();
};

export const formatGradePercent = (value: number | null, decimals: number = 2): string => {
  const formatted = formatGrade(value, decimals);
  return formatted === 'N/A' ? formatted : `${formatted}%`;
};
