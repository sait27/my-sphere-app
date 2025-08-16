import jsPDF from 'jspdf';
import 'jspdf-autotable';

// CSV Export Functions
export const exportToCSV = (data, filename, headers) => {
  try {
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export CSV file');
  }
};

export const exportExpensesToCSV = (expenses) => {
  const headers = [
    'Date',
    'Amount',
    'Category',
    'Vendor',
    'Description',
    'Payment Method'
  ];

  const data = expenses.map(expense => ({
    'Date': expense.transaction_date ? new Date(expense.transaction_date).toLocaleDateString() : '',
    'Amount': `$${parseFloat(expense.amount || 0).toFixed(2)}`,
    'Category': expense.category || 'Uncategorized',
    'Vendor': expense.vendor || '',
    'Description': expense.description || '',
    'Payment Method': expense.payment_method || 'Not specified'
  }));

  const filename = `expenses_${new Date().toISOString().split('T')[0]}`;
  return exportToCSV(data, filename, headers);
};

export const exportListsToCSV = (lists) => {
  const headers = [
    'List Name',
    'Type',
    'Items Count',
    'Completed Items',
    'Completion Rate',
    'Created Date',
    'Last Updated'
  ];

  const data = lists.map(list => {
    const completedItems = list.items?.filter(item => item.is_completed).length || 0;
    const totalItems = list.items?.length || 0;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      'List Name': list.name || '',
      'Type': list.list_type || 'checklist',
      'Items Count': totalItems,
      'Completed Items': completedItems,
      'Completion Rate': `${completionRate}%`,
      'Created Date': list.created_at ? new Date(list.created_at).toLocaleDateString() : '',
      'Last Updated': list.updated_at ? new Date(list.updated_at).toLocaleDateString() : ''
    };
  });

  const filename = `lists_${new Date().toISOString().split('T')[0]}`;
  return exportToCSV(data, filename, headers);
};

export const exportTodosToCSV = (todos) => {
  const headers = [
    'Title',
    'Description',
    'Priority',
    'Status',
    'Due Date',
    'Created Date',
    'Completed Date'
  ];

  const data = todos.map(todo => ({
    'Title': todo.title || '',
    'Description': todo.description || '',
    'Priority': todo.priority || 'medium',
    'Status': todo.is_completed ? 'Completed' : 'Pending',
    'Due Date': todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '',
    'Created Date': todo.created_at ? new Date(todo.created_at).toLocaleDateString() : '',
    'Completed Date': todo.completed_at ? new Date(todo.completed_at).toLocaleDateString() : ''
  }));

  const filename = `todos_${new Date().toISOString().split('T')[0]}`;
  return exportToCSV(data, filename, headers);
};

// PDF Export Functions
export const exportToPDF = (title, data, columns, filename) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Add table
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey] || '')),
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { top: 40, left: 14, right: 14 }
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};

export const exportExpensesToPDF = (expenses) => {
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Amount', dataKey: 'amount' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Vendor', dataKey: 'vendor' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Payment Method', dataKey: 'paymentMethod' }
  ];

  const data = expenses.map(expense => ({
    date: expense.transaction_date ? new Date(expense.transaction_date).toLocaleDateString() : '',
    amount: `$${parseFloat(expense.amount || 0).toFixed(2)}`,
    category: expense.category || 'Uncategorized',
    vendor: expense.vendor || '',
    description: expense.description || '',
    paymentMethod: expense.payment_method || 'Not specified'
  }));

  const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  const title = `Expenses Report - Total: $${total.toFixed(2)}`;
  const filename = `expenses_${new Date().toISOString().split('T')[0]}`;
  
  return exportToPDF(title, data, columns, filename);
};

export const exportListsToPDF = (lists) => {
  const columns = [
    { header: 'List Name', dataKey: 'name' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Items', dataKey: 'itemsCount' },
    { header: 'Completed', dataKey: 'completedItems' },
    { header: 'Progress', dataKey: 'completionRate' },
    { header: 'Created', dataKey: 'createdDate' }
  ];

  const data = lists.map(list => {
    const completedItems = list.items?.filter(item => item.is_completed).length || 0;
    const totalItems = list.items?.length || 0;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      name: list.name || '',
      type: list.list_type || 'checklist',
      itemsCount: totalItems,
      completedItems: completedItems,
      completionRate: `${completionRate}%`,
      createdDate: list.created_at ? new Date(list.created_at).toLocaleDateString() : ''
    };
  });

  const title = `Lists Report - ${lists.length} Lists`;
  const filename = `lists_${new Date().toISOString().split('T')[0]}`;
  
  return exportToPDF(title, data, columns, filename);
};

export const exportTodosToPDF = (todos) => {
  const columns = [
    { header: 'Title', dataKey: 'title' },
    { header: 'Priority', dataKey: 'priority' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Due Date', dataKey: 'dueDate' },
    { header: 'Created', dataKey: 'createdDate' }
  ];

  const data = todos.map(todo => ({
    title: todo.title || '',
    priority: todo.priority || 'medium',
    status: todo.is_completed ? 'Completed' : 'Pending',
    dueDate: todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '',
    createdDate: todo.created_at ? new Date(todo.created_at).toLocaleDateString() : ''
  }));

  const completedCount = todos.filter(todo => todo.is_completed).length;
  const title = `Tasks Report - ${completedCount}/${todos.length} Completed`;
  const filename = `todos_${new Date().toISOString().split('T')[0]}`;
  
  return exportToPDF(title, data, columns, filename);
};

// Comprehensive data export
export const exportAllData = async (userData) => {
  try {
    const { expenses = [], lists = [], todos = [] } = userData;
    
    // Create a comprehensive PDF report
    const doc = new jsPDF();
    
    // Title page
    doc.setFontSize(24);
    doc.text('MY SPHERE - Complete Data Export', 14, 30);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 45);
    doc.text(`Total Expenses: ${expenses.length}`, 14, 55);
    doc.text(`Total Lists: ${lists.length}`, 14, 65);
    doc.text(`Total Tasks: ${todos.length}`, 14, 75);
    
    let yPosition = 90;
    
    // Summary statistics
    if (expenses.length > 0) {
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      doc.text(`Total Expenses Amount: $${totalExpenses.toFixed(2)}`, 14, yPosition);
      yPosition += 10;
    }
    
    if (lists.length > 0) {
      const totalListItems = lists.reduce((sum, list) => sum + (list.items?.length || 0), 0);
      doc.text(`Total List Items: ${totalListItems}`, 14, yPosition);
      yPosition += 10;
    }
    
    if (todos.length > 0) {
      const completedTodos = todos.filter(todo => todo.is_completed).length;
      doc.text(`Completed Tasks: ${completedTodos}/${todos.length}`, 14, yPosition);
    }
    
    // Add new page for detailed data
    doc.addPage();
    
    // Add expenses table if exists
    if (expenses.length > 0) {
      doc.setFontSize(16);
      doc.text('Expenses', 14, 20);
      
      doc.autoTable({
        head: [['Date', 'Amount', 'Category', 'Vendor', 'Description']],
        body: expenses.slice(0, 50).map(expense => [
          expense.transaction_date ? new Date(expense.transaction_date).toLocaleDateString() : '',
          `$${parseFloat(expense.amount || 0).toFixed(2)}`,
          expense.category || '',
          expense.vendor || '',
          expense.description || ''
        ]),
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 85, 105] }
      });
    }
    
    // Save the comprehensive report
    doc.save(`my_sphere_complete_export_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw new Error('Failed to export complete data');
  }
};
