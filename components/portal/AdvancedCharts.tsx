'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MonthlySummary, Transaction } from '@/types/portal';

interface AdvancedChartsProps {
  monthlySummaries: MonthlySummary[];
  transactions: Transaction[];
}

export function CashFlowChart({ monthlySummaries }: { monthlySummaries: MonthlySummary[] }) {
  const data = [...monthlySummaries]
    .reverse()
    .slice(-12)
    .map(summary => ({
      month: new Date(summary.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: summary.incomeTotal / 100,
      expenses: Math.abs(summary.expenseTotal) / 100,
      net: (summary.incomeTotal + summary.expenseTotal) / 100,
    }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Cash Flow Analysis (12 Months)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Legend />
          <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
          <Area type="monotone" dataKey="net" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNet)" name="Net" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VendorBreakdownChart({ transactions }: { transactions: Transaction[] }) {
  // Get top 10 vendors by total spent
  const vendorTotals: { [key: string]: number } = {};
  
  transactions.forEach(t => {
    if (t.amount < 0 && t.vendor) {
      vendorTotals[t.vendor] = (vendorTotals[t.vendor] || 0) + Math.abs(t.amount);
    }
  });

  const data = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([vendor, total]) => ({
      vendor: vendor.length > 20 ? vendor.substring(0, 20) + '...' : vendor,
      amount: total / 100,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Vendors by Spending</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="vendor" type="category" width={100} />
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Bar dataKey="amount" fill="#3b82f6" name="Total Spent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyComparisonChart({ monthlySummaries }: { monthlySummaries: MonthlySummary[] }) {
  // Compare current month with same month in previous years
  if (monthlySummaries.length === 0) return null;

  const currentMonth = monthlySummaries[0];
  const currentMonthNumber = new Date(currentMonth.month + '-01').getMonth();
  
  const sameMonths = monthlySummaries.filter(s => {
    const monthNum = new Date(s.month + '-01').getMonth();
    return monthNum === currentMonthNumber;
  }).slice(0, 3);

  if (sameMonths.length < 2) return null;

  const data = sameMonths.reverse().map(s => ({
    year: new Date(s.month + '-01').getFullYear().toString(),
    income: s.incomeTotal / 100,
    expenses: Math.abs(s.expenseTotal) / 100,
    net: (s.incomeTotal + s.expenseTotal) / 100,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Year-over-Year Comparison ({new Date(currentMonth.month + '-01').toLocaleDateString('en-US', { month: 'long' })})
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" stackId="a" />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryTrendChart({ monthlySummaries }: { monthlySummaries: MonthlySummary[] }) {
  if (monthlySummaries.length === 0) return null;

  // Get all categories across months
  const allCategories = new Set<string>();
  monthlySummaries.slice(0, 6).forEach(s => {
    if (s.categoryTotals) {
      Object.keys(s.categoryTotals).forEach(cat => allCategories.add(cat));
    }
  });

  const categories = Array.from(allCategories).slice(0, 5); // Top 5 categories
  if (categories.length === 0) return null;

  const data = [...monthlySummaries]
    .reverse()
    .slice(-6)
    .map(summary => {
      const dataPoint: any = {
        month: new Date(summary.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      };
      categories.forEach(cat => {
        dataPoint[cat] = summary.categoryTotals?.[cat] 
          ? Math.abs(summary.categoryTotals[cat]) / 100 
          : 0;
      });
      return dataPoint;
    });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Category Spending Trends (6 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Legend />
          {categories.map((cat, idx) => (
            <Area
              key={cat}
              type="monotone"
              dataKey={cat}
              stackId="1"
              stroke={colors[idx]}
              fill={colors[idx]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdvancedCharts({ monthlySummaries, transactions }: AdvancedChartsProps) {
  if (monthlySummaries.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
      
      <CashFlowChart monthlySummaries={monthlySummaries} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendorBreakdownChart transactions={transactions} />
        <MonthlyComparisonChart monthlySummaries={monthlySummaries} />
      </div>
      
      <CategoryTrendChart monthlySummaries={monthlySummaries} />
    </div>
  );
}
