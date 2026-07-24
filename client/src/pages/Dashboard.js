import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Timer,
  Flame,
  CalendarClock,
  Plus,
  Play,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { financeApi, productivityApi } from '../services/api';

const CATEGORY_COLORS = {
  Food: '#548a62',
  Transport: '#dc8d20',
  Books: '#74a780',
  Entertainment: '#e6a638',
  Shopping: '#9dc4a5',
  Health: '#c06f18',
  Education: '#3f6f4c',
  Other: '#a1a1aa',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const StatCard = ({ icon: Icon, label, value, accent = 'sage', sub }) => (
  <div className="card p-4">
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          accent === 'sage'
            ? 'bg-sage-600/10 text-sage-600 dark:text-sage-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
    <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {value}
    </p>
    {sub && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
  </div>
);

const SkeletonCard = () => (
  <div className="card p-4">
    <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
    <div className="mt-3 h-6 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    <div className="mt-2 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finance, setFinance] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [financeRes, productivityRes, txRes] = await Promise.all([
          financeApi.getSummary(),
          productivityApi.getSummary(),
          financeApi.getTransactions(),
        ]);
        setFinance(financeRes.data);
        setProductivity(productivityRes.data);
        setTransactions(txRes.data.transactions.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const focusHours = productivity ? (productivity.todaysFocusMinutes / 60).toFixed(1) : '0.0';

  const pieData = finance?.spendingByCategory?.length
    ? finance.spendingByCategory
    : [{ category: 'No spending yet', total: 1 }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Good to see you, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{today}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/finance')} className="btn-secondary">
            <Plus size={16} /> Add transaction
          </button>
          <button onClick={() => navigate('/focus')} className="btn-secondary">
            <Play size={16} /> Start focus session
          </button>
          <button onClick={() => navigate('/activities')} className="btn-primary">
            <Trophy size={16} /> Add activity
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Month's Balance"
              value={formatCurrency((finance?.monthIncome || 0) - (finance?.monthExpenses || 0))}
              sub={`${formatCurrency(finance?.monthExpenses)} spent this month`}
            />
            <StatCard
              icon={Timer}
              label="Daily Focus Hours"
              value={`${focusHours}h`}
              accent="amber"
              sub={`${productivity?.todaysCompletedSessions || 0} sessions today`}
            />
            <StatCard
              icon={Flame}
              label="Current Streak"
              value={`${productivity?.currentStreak || 0} days`}
              accent="amber"
              sub="Keep it going"
            />
            <StatCard
              icon={CalendarClock}
              label="Upcoming Activities"
              value={productivity?.upcomingActivities?.length || 0}
              sub="Planned & ongoing"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Finance summary + chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Weekly spending
            </h2>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <TrendingUp size={13} className="text-sage-600" /> Income{' '}
                {formatCurrency(finance?.monthIncome)}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown size={13} className="text-amber-600" /> Expenses{' '}
                {formatCurrency(finance?.monthExpenses)}
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finance?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f4620" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#fafafa',
                  }}
                />
                <Bar dataKey="amount" fill="#e6a638" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Spending by category
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={CATEGORY_COLORS[entry.category] || '#a1a1aa'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            {(finance?.spendingByCategory || []).map((entry) => (
              <span key={entry.category} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[entry.category] || '#a1a1aa' }}
                />
                {entry.category}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent transactions */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recent transactions
            </h2>
            <button onClick={() => navigate('/finance')} className="text-xs font-medium text-sage-600 hover:underline dark:text-sage-400">
              View all
            </button>
          </div>
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">No transactions yet. Add your first one.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((t) => (
                <li key={t._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {t.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t.category} · {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      t.type === 'income' ? 'text-sage-600 dark:text-sage-400' : 'text-zinc-500'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming activities */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Upcoming activities
            </h2>
            <button onClick={() => navigate('/activities')} className="text-xs font-medium text-sage-600 hover:underline dark:text-sage-400">
              View all
            </button>
          </div>
          {!productivity?.upcomingActivities?.length ? (
            <p className="py-6 text-center text-sm text-zinc-400">Nothing scheduled. Plan your next activity.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {productivity.upcomingActivities.map((a) => (
                <li key={a._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {a.title}
                    </p>
                    <p className="text-xs text-zinc-500">{a.activityType}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
