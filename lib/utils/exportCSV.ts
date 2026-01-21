export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTransactionsToCSV(transactions: any[], filename = 'transactions.csv') {
  const exportData = transactions.map(t => ({
    Date: t.date.toDate ? t.date.toDate().toLocaleDateString() : t.date,
    Vendor: t.vendor,
    Category: t.category,
    Amount: t.amount,
    Notes: t.noteForMembers || '',
    'Receipt URL': t.receiptUrl || ''
  }));

  exportToCSV(exportData, filename);
}

export function exportSummariesToCSV(summaries: any[], filename = 'monthly_summaries.csv') {
  const exportData = summaries.map(s => ({
    Month: s.month,
    'Starting Balance': s.startingBalance,
    Income: s.incomeTotal,
    Expenses: s.expenseTotal,
    'Ending Balance': s.endingBalance,
    Notes: s.notes || ''
  }));

  exportToCSV(exportData, filename);
}
