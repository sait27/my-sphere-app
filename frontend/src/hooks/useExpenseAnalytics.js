import { useState, useEffect } from 'react';
import { expenseAPI } from '../api/expenses';

export const useExpenseAnalytics = (period) => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalytics = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const [analyticsRes, trendsRes] = await Promise.allSettled([
          expenseAPI.getAdvancedAnalytics(period),
          expenseAPI.getTrends(),
        ]);

        if (!isMounted) return;

        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value.data);
        }

        if (trendsRes.status === 'fulfilled') {
          setTrends(trendsRes.value.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [period]);

  return {
    analytics,
    trends,
    budgetAnalysis,
    loading
  };
};