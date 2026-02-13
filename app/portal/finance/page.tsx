'use client';

import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';

export default function FinancePage() {
  // Sample finance data
  const summary = {
    totalIncome: 15200,
    totalExpenses: 8400,
    balance: 6800,
  };

  const recentTransactions = [
    { id: '1', type: 'income' as const, description: 'Dues Payment - Sarah Chen', amount: 85, date: '2026-02-10', category: 'Dues' },
    { id: '2', type: 'income' as const, description: 'Networking Mixer Tickets', amount: 375, date: '2026-02-08', category: 'Events' },
    { id: '3', type: 'expense' as const, description: 'Meeting Room Rental', amount: 150, date: '2026-02-05', category: 'Venue' },
    { id: '4', type: 'income' as const, description: 'Donation - Anonymous', amount: 200, date: '2026-02-01', category: 'Donations' },
    { id: '5', type: 'expense' as const, description: 'Service Project Supplies', amount: 320, date: '2026-01-28', category: 'Service' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Club financial overview and transaction history.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Income" value={`$${summary.totalIncome.toLocaleString()}`} />
        <StatCard label="Total Expenses" value={`$${summary.totalExpenses.toLocaleString()}`} />
        <StatCard label="Balance" value={`$${summary.balance.toLocaleString()}`} />
      </div>

      {/* Chart placeholder */}
      <Card padding="md">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Monthly Overview</h3>
        <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
          <p className="text-sm text-gray-400">📊 Finance charts will render here with live data</p>
        </div>
      </Card>

      {/* Transactions */}
      <Card padding="none">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {tx.type === 'income' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="gray">{tx.category}</Badge>
                    <span className="text-xs text-gray-400">{tx.date}</span>
                  </div>
                </div>
              </div>
              <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
