import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Copy,
  TrendingUp,
  BarChart2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface DashboardPageProps {
  onNavigateComplaint: (id: number) => void;
  onNavigateTab: (tab: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#0284c7',
  'Under Review': '#d97706',
  Assigned: '#6366f1',
  'In Progress': '#ca8a04',
  'Pending Institution': '#ea580c',
  Resolved: '#16a34a',
  Rejected: '#dc2626',
  Duplicate: '#9333ea',
  Closed: '#475569',
};

const PIE_PALETTE = ['#002855', '#0284c7', '#16a34a', '#d97706', '#ea580c', '#9333ea', '#dc2626', '#475569'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateComplaint,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardAnalytics();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#002855] border-t-transparent rounded-full mb-2"></div>
        <div>Loading AICTE Integrated Dashboard Metrics...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs">
        <strong>Error loading dashboard:</strong> {error || 'Data unavailable'}
        <button
          onClick={loadDashboard}
          className="ml-4 px-2.5 py-1 bg-red-700 text-white rounded font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#002855]">
            National Technical Grievance Redressal Monitoring Overview
          </h2>
          <p className="text-xs text-gray-600">
            Real-time status tracking, bureau workload distribution, and duplicate resolution analytics
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: <span className="font-semibold text-gray-700">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top Level Metric Panels (Government Rectangular Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Filed</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_complaints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">All registered grievances</div>
        </div>

        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Triage / Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.pending_complaints + stats.under_review_complaints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Awaiting bureau routing</div>
        </div>

        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">In Investigation</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800">{stats.assigned_complaints + stats.in_progress_complaints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Active bureau scrutiny</div>
        </div>

        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Resolved Cases</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700">{stats.resolved_complaints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Redressal order issued</div>
        </div>

        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">Duplicates</span>
            <Copy className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{stats.duplicate_complaints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Linked duplicate filings</div>
        </div>

        <div className="bg-white border border-gray-300 p-3 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">Avg Resolution</span>
            <TrendingUp className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avg_resolution_days} <span className="text-xs font-normal text-gray-500">days</span></div>
          <div className="text-[10px] text-gray-500 mt-0.5">Turnaround timeframe</div>
        </div>
      </div>

      {/* Primary Visualizations Row (Professional, Restrained Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4" />
              <span>Grievances by Category Distribution</span>
            </h3>
            <span className="text-[11px] text-gray-500">Classified AICTE Heads</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.category_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#4b5563' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} complaints`, 'Total']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#002855" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 6-Month Inflow vs Resolution Trend */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Monthly Inflow vs Resolution Trends (2026)</span>
            </h3>
            <span className="text-[11px] text-gray-500">6-Month Trajectory</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#4b5563' }} />
                <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="submitted" name="Grievances Received" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resolved" name="Cases Resolved" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Visualizations & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide">
              Case Status Breakdown
            </h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.status_breakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                  paddingAngle={2}
                >
                  {stats.status_breakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] max-h-24 overflow-y-auto">
            {stats.status_breakdown.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[s.name] || PIE_PALETTE[idx % PIE_PALETTE.length] }}
                ></span>
                <span className="truncate text-gray-700">{s.name}:</span>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Bureau Workload Table */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide flex items-center space-x-1.5">
              <Building2 className="w-4 h-4" />
              <span>AICTE Bureau Workload & Performance</span>
            </h3>
            <button
              onClick={() => onNavigateTab('departments')}
              className="text-xs text-blue-700 hover:underline flex items-center space-x-1"
            >
              <span>View all bureaus</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gov-table border border-gray-200">
              <thead>
                <tr>
                  <th>Bureau / Cell Name</th>
                  <th>Code</th>
                  <th className="text-center">Total Assigned</th>
                  <th className="text-center">In Progress</th>
                  <th className="text-center">Resolved</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.department_workload.map((d) => (
                  <tr key={d.department_id}>
                    <td className="font-semibold text-gray-900">{d.name}</td>
                    <td className="font-mono text-gray-600">{d.code}</td>
                    <td className="text-center font-bold">{d.total_assigned}</td>
                    <td className="text-center text-amber-700 font-semibold">{d.in_progress}</td>
                    <td className="text-center text-green-700 font-semibold">{d.resolved}</td>
                    <td>
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px]">
                        Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid: State Distribution & Top Institution Grievance Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Institutions by Complaints */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide">
              Institutions with Active Case Representations
            </h3>
            <button
              onClick={() => onNavigateTab('institutions')}
              className="text-xs text-blue-700 hover:underline flex items-center space-x-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gov-table border border-gray-200">
              <thead>
                <tr>
                  <th>AICTE ID</th>
                  <th>Institution Name</th>
                  <th>State</th>
                  <th className="text-right">Complaints</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_institutions_by_complaints.map((inst) => (
                  <tr key={inst.id}>
                    <td className="font-mono font-medium text-blue-900">{inst.aicte_id}</td>
                    <td className="font-medium text-gray-900">{inst.name}</td>
                    <td className="text-gray-600">{inst.state}</td>
                    <td className="text-right font-bold text-gray-900">{inst.complaint_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Breakdown */}
        <div className="bg-white border border-gray-300 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wide">
              State-wise Grievance Distribution
            </h3>
            <span className="text-[11px] text-gray-500">Geographic Spread</span>
          </div>

          <div className="space-y-2.5 mt-2">
            {stats.state_breakdown.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-700">
                  <span className="font-medium">{s.name}</span>
                  <span>{s.count} cases ({s.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 border border-gray-200 rounded-xs overflow-hidden">
                  <div
                    className="bg-[#002855] h-full"
                    style={{ width: `${Math.min(s.percentage * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
