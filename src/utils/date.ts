export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isOverdue = (expectedReturn: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(expectedReturn);
  expected.setHours(0, 0, 0, 0);
  return expected < today;
};

export const getCurrentDate = (): Date => {
  return new Date();
};

export const formatDateForInput = (date: Date): string => {
  return new Date(date).toISOString().split('T')[0];
};

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};
