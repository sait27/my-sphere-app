// src/pages/SettingsPage.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

function SettingsPage() {
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // This hook runs when the page loads to fetch the current budget, if it exists
  useEffect(() => {
    const fetchCurrentBudget = async () => {
      try {
        const response = await apiClient.get('/budgets/current/');
        setBudget(response.data.amount); // Pre-fill the form with the existing budget
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
      alert('Please enter a valid budget amount.');
      return;
    }

    try {
      await apiClient.post('/budgets/current/', {
        amount: budget
      });
      alert('Budget saved successfully!');
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget. Please try again.');
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
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Save Budget
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default SettingsPage;