import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/axiosConfig';
import EditExpenseModal from '../components/EditExpenseModal';
import CategoryPieChart from '../components/CategoryPieChart';

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [expenseText, setExpenseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);

  const fetchExpenses = async () => {
    try {
      const response = await apiClient.get('/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!expenseText) return alert('Please enter an expense.');
    try {
      await apiClient.post('/expenses/', { text: expenseText });
      setExpenseText('');
      fetchExpenses();
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense.');
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await apiClient.delete(`/expenses/${expenseId}/`);
        fetchExpenses();
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense.');
      }
    }
  };

  const handleUpdateExpense = async (updatedExpenseData) => {
    try {
      await apiClient.put(`/expenses/${updatedExpenseData.expense_id}/`, updatedExpenseData);
      alert('Expense updated successfully!');
      setIsEditModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense.');
    }
  };

  const handleOpenEditModal = (expense) => {
    setCurrentExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentExpense(null);
  };

  const filteredAndSortedExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.raw_text.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount_desc':
            return b.amount - a.amount;
          case 'date_desc':
          default:
            return new Date(b.transaction_date) - new Date(a.transaction_date);
        }
      });
  }, [expenses, searchTerm, sortBy]);

  const totalAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  }, [filteredAndSortedExpenses]);
  
  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-white">Expense Ledger</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 h-80 flex items-center justify-center">
              {expenses.length > 0 ? (
                <CategoryPieChart expenses={filteredAndSortedExpenses} />
              ) : (
                <p className="text-slate-400">Your spending chart will appear here once you add expenses.</p>
              )}
          </div>
          <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 flex flex-col justify-center">
              <h3 className="text-slate-400 text-sm">Total for Displayed Expenses</h3>
              <p className="text-5xl font-bold text-white mt-2">₹{totalAmount.toFixed(2)}</p>
              <p className="text-slate-400 text-sm mt-4">{filteredAndSortedExpenses.length} transactions shown.</p>
          </div>
      </div>
      <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 mb-8">
        <h3 className="font-bold text-lg mb-4 text-white">Log a New Expense</h3>
        <form onSubmit={handleExpenseSubmit} className="flex items-center gap-4">
          <input type="text" value={expenseText} onChange={(e) => setExpenseText(e.target.value)} placeholder="e.g., paid 300 for dinner at Paradise" className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white" />
          <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">Log</button>
        </form>
      </div>

      <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 mb-8">
        <div className="flex justify-between items-center">
          <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg w-1/2" />
          <div className="flex gap-2">
            <button onClick={() => setSortBy('date_desc')} className={`px-4 py-2 rounded-lg text-sm font-bold ${sortBy === 'date_desc' ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Sort by Date</button>
            <button onClick={() => setSortBy('amount_desc')} className={`px-4 py-2 rounded-lg text-sm font-bold ${sortBy === 'amount_desc' ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Sort by Amount</button>
          </div>
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
        <ul>
          {filteredAndSortedExpenses.map(expense => (
            <li key={expense.expense_id} className="flex justify-between items-center py-3 border-b border-slate-700 last:border-b-0">
              <div className="flex items-center">
                <span className="mr-4 text-slate-500 font-mono text-sm">{expense.display_id}</span>
                <div>
                  <p className="font-semibold text-white">{expense.vendor || expense.category}</p>
                  <p className="text-sm text-slate-400">{expense.raw_text}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-2">
                  <p className="font-bold text-lg text-white">₹{parseFloat(expense.amount).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{expense.transaction_date}</p>
                </div>
                <button onClick={() => handleOpenEditModal(expense)} className="p-2 text-slate-500 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full" title="Edit Expense">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
                <button onClick={() => handleDelete(expense.expense_id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full" title="Delete Expense">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateExpense}
        expense={currentExpense}
      />
    </>
  );
}

export default ExpensesPage;