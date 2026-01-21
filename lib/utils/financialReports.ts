import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlySummary, Transaction } from '@/types/portal';

interface GenerateReportOptions {
  monthlySummaries: MonthlySummary[];
  transactions: Transaction[];
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
}

export function generateFinancialReport(options: GenerateReportOptions) {
  const { monthlySummaries, transactions, dateRange } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Date range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = dateRange 
    ? `${dateRange.start} to ${dateRange.end}`
    : 'All Time';
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, yPos);
  yPos += 8;

  if (monthlySummaries.length > 0) {
    const latestSummary = monthlySummaries[0];
    const totalIncome = monthlySummaries.reduce((sum, s) => sum + s.incomeTotal, 0);
    const totalExpenses = monthlySummaries.reduce((sum, s) => sum + Math.abs(s.expenseTotal), 0);
    const netIncome = totalIncome - totalExpenses;

    const summaryData = [
      ['Current Balance', `$${(latestSummary.endingBalance / 100).toFixed(2)}`],
      ['Total Income', `$${(totalIncome / 100).toFixed(2)}`],
      ['Total Expenses', `$${(totalExpenses / 100).toFixed(2)}`],
      ['Net Income', `$${(netIncome / 100).toFixed(2)}`],
      ['Number of Transactions', transactions.length.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Monthly Summaries
  if (monthlySummaries.length > 0 && yPos < 250) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Summaries', 14, yPos);
    yPos += 8;

    const monthlyData = monthlySummaries.slice(0, 12).map(s => [
      new Date(s.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      `$${(s.startingBalance / 100).toFixed(2)}`,
      `$${(s.incomeTotal / 100).toFixed(2)}`,
      `$${(Math.abs(s.expenseTotal) / 100).toFixed(2)}`,
      `$${(s.endingBalance / 100).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Starting', 'Income', 'Expenses', 'Ending']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Transactions (new page if needed)
  if (transactions.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 14, yPos);
    yPos += 8;

    const transactionData = transactions.slice(0, 50).map(t => {
      const date = t.date.toDate ? t.date.toDate() : t.date;
      const dateStr = date instanceof Date ? date.toLocaleDateString() : String(date);
      return [
        dateStr,
        t.vendor || '',
        t.category || '',
        `$${(Math.abs(t.amount) / 100).toFixed(2)}`,
        t.amount >= 0 ? 'Income' : 'Expense',
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Vendor', 'Category', 'Amount', 'Type']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    });
  }

  // Category Breakdown (new page if needed)
  if (monthlySummaries.length > 0 && monthlySummaries[0].categoryTotals) {
    if ((doc as any).lastAutoTable.finalY > 200) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', 14, yPos);
    yPos += 8;

    const categoryData = Object.entries(monthlySummaries[0].categoryTotals || {})
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .map(([category, total]) => [
        category,
        `$${(Math.abs(total) / 100).toFixed(2)}`,
        ((Math.abs(total) / Math.abs(monthlySummaries[0].expenseTotal)) * 100).toFixed(1) + '%',
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount', '% of Total']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Rotaract NYC Financial Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function exportTransactionDetailsCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Type', 'Notes', 'Receipt URL'];
  
  const csvData = transactions.map(t => {
    const date = t.date.toDate ? t.date.toDate() : t.date;
    const dateStr = date instanceof Date ? date.toLocaleDateString() : String(date);
    return [
      dateStr,
      t.vendor || '',
      t.category || '',
      (t.amount / 100).toFixed(2),
      t.amount >= 0 ? 'Income' : 'Expense',
      t.noteForMembers || '',
      t.receiptUrl || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      row.map(cell => {
        const str = String(cell);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions-detailed-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
