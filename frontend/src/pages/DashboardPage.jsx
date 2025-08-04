// src/pages/DashboardPage.jsx

import { useState } from 'react';
import axios from 'axios';

function DashboardPage() {
  const [expenseText, setExpenseText] = useState('');

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!expenseText) {
      alert('Please enter an expense.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/expenses/', {
        text: expenseText,
      });

      console.log('Expense added successfully:', response.data);
      alert('Expense added successfully!');
      setExpenseText(''); // Clear the input field

    } catch (error) {
      console.error('Failed to add expense:', error.response ? error.response.data : error.message);
      alert('Failed to add expense.');
    }
  };

  return (
    <div>
      <h2>My Sphere Dashboard</h2>
      <form onSubmit={handleExpenseSubmit}>
        <label htmlFor="expense">Log a new expense:</label>
        <input
          type="text"
          id="expense"
          value={expenseText}
          onChange={(e) => setExpenseText(e.target.value)}
          placeholder="e.g., coffee for 150 rs at Starbucks"
          style={{ width: '300px', margin: '10px' }}
        />
        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
}

export default DashboardPage;