import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast'; // <-- 1. IMPORT TOAST

function SettingsPage() {
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // <-- 2. ADD SAVING STATE

  useEffect(() => {
    const fetchCurrentBudget = async () => {
      try {
        const response = await apiClient.get('/budgets/current/');
        setBudget(response.data.amount);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log("No budget set for this month yet.");
        } else {
          console.error('Failed to fetch budget:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentBudget();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!budget || parseFloat(budget) <= 0) {
      toast.error('Please enter a valid budget amount.'); // <-- USE TOAST
      return;
    }
    
    setIsSaving(true); // <-- 3. SET SAVING TO TRUE
    try {
      await apiClient.post('/budgets/current/', {
        amount: budget
      });
      toast.success('Budget saved successfully!'); // <-- USE TOAST
    } catch (error) {
      console.error('Failed to save budget:', error);
      toast.error('Failed to save budget. Please try again.'); // <-- USE TOAST
    } finally {
      setIsSaving(false); // <-- 4. SET SAVING TO FALSE
    }
  };

  if (isLoading) {
    return <h2 className="text-3xl font-bold text-white">Loading Settings...</h2>;
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-white">Settings</h2>
      
      <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 max-w-lg">
        <h3 className="font-bold text-lg mb-4 text-white">Monthly Budget</h3>
        <p className="text-slate-400 mb-6 text-sm">
          Set your total spending limit for the current month. This will be used to power your "Budget Orb" on the dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="budget" className="block text-slate-400 text-sm font-bold mb-2">
            Current Month's Budget (₹)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              id="budget"
              step="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 50000"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
            {/* --- 5. UPDATED BUTTON --- */}
            <button
              type="submit"
              disabled={isSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default SettingsPage;