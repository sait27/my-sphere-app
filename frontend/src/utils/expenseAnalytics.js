export const getSpendingPatternAverages = (patterns) => {
  if (!patterns || !patterns.by_day_of_week || !patterns.weekend_vs_weekday) {
    return null;
  }

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekends = ['Saturday', 'Sunday'];

  const numWeekdaysWithExpenses = Object.keys(patterns.by_day_of_week).filter(day => weekdays.includes(day)).length;
  const numWeekendDaysWithExpenses = Object.keys(patterns.by_day_of_week).filter(day => weekends.includes(day)).length;

  const weekdayTotal = patterns.weekend_vs_weekday.weekday || 0;
  const weekendTotal = patterns.weekend_vs_weekday.weekend || 0;

  const weekday_average = weekdayTotal / Math.max(1, numWeekdaysWithExpenses);
  const weekend_average = weekendTotal / Math.max(1, numWeekendDaysWithExpenses);

  return {
    weekday_average,
    weekend_average
  };
};

export const calculatePercentage = (value, total) => {
  return total ? (value / total) * 100 : 0;
};

export const getCategoryColor = (index) => {
  return `hsl(${index * 60}, 70%, 60%)`;
};