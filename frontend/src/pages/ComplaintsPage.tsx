import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Copy,
} from 'lucide-react';

interface ComplaintsPageProps {
  onOpenComplaint: (id: number) => void;
  onNavigateSubmit: () => void;
}

export const ComplaintsPage: React.FC<ComplaintsPageProps> = ({
  onOpenComplaint,
  onNavigateSubmit,
}) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [activeTabStatus, setActiveTabStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState<boolean>(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [page, activeTabStatus, selectedPriority, selectedCategory, selectedDepartment, filterDuplicatesOnly]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const statusParam = activeTabStatus === 'ALL' ? undefined : activeTabStatus;
      const deptParam = selectedDepartment ? Number(selectedDepartment) : undefined;
      const dupParam = filterDuplicatesOnly ? true : undefined;

      const data = await api.getComplaints({
        q: search || undefined,
        status: statusParam,
        priority: selectedPriority || undefined,
        category: selectedCategory || undefined,
        department_id: deptParam,
        is_duplicate: dupParam,
        page,
        page_size: pageSize,
      });

      setComplaints(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setActiveTabStatus('ALL');
    setSelectedPriority('');
    setSelectedCategory('');
    setSelectedDepartment('');
    setFilterDuplicatesOnly(false);
    setPage(1);
  };

  const statusTabs = [
    { label: 'All Cases', value: 'ALL' },
    { label: 'Submitted / Triage', value: 'SUBMITTED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Assigned to Bureau', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending Institution Reply', value: 'PENDING_INSTITUTION' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Duplicates', value: 'DUPLICATE' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#002855]">National Grievance Monitoring & Scrutiny Desk</h2>
          <p className="text-xs text-gray-600">
            {user?.role === 'INST_REP'
              ? `Displaying representations filed by: ${user.institution_name || 'your institution'}`
              : user?.role === 'DEPT_OFFICER'
              ? `Displaying grievances routed to bureau: ${user.department_name || 'your bureau'}`
              : 'Complete registry of institutional grievances, bureau assignments, and redressal orders'}
          </p>
        </div>

        <button
          onClick={onNavigateSubmit}
          className="px-3.5 py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>File New Grievance</span>
        </button>
      </div>

      {/* Status Segment Tabs (Government Dashboard Horizontal Tabs) */}
      <div className="flex flex-wrap border-b border-gray-300 bg-gray-50 text-xs">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTabStatus(tab.value);
              setPage(1);
            }}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors ${
              activeTabStatus === tab.value
                ? 'border-[#002855] bg-white text-[#002855] font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white border border-gray-300 p-3.5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Search by Tracking ID, Subject, or Institution
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. AICTE-2026-00010, EoA Scrutiny, Delhi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-3 py-1.5 pl-8 border border-gray-300 rounded-sm focus:outline-none focus:border-[#002855]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
            >
              <option value="">All Categories</option>
              <option value="APPROVAL_AFFILIATION">Approval & Affiliation</option>
              <option value="FACULTY_STAFF">Faculty & Staff Welfare</option>
              <option value="STUDENT_FEES">Student Welfare & Fees</option>
              <option value="INFRASTRUCTURE">Infrastructure Deficiencies</option>
              <option value="ANTI_RAGGING">Anti-Ragging / Harassment</option>
              <option value="FUNDS_SCHOLARSHIP">Grants & Scholarships</option>
              <option value="EXAM_CURRICULUM">Curriculum & Exams</option>
              <option value="GOVERNANCE_CORRUPTION">Governance & Corruption</option>
              <option value="OTHER">Other Issues</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent (Immediate)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium rounded-sm"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Grievance Register Table */}
      <div className="bg-white border border-gray-300 shadow-xs">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
          <span className="font-semibold text-gray-700">
            Total Cases in View: <span className="text-[#002855] font-bold">{total}</span>
          </span>
          <span className="text-gray-500 text-[11px]">
            Statutory AICTE Grievance Timelines Apply
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead>
              <tr>
                <th className="w-10 text-center">#</th>
                <th>Tracking ID</th>
                <th>Institution</th>
                <th>Grievance Title / Subject</th>
                <th>Category</th>
                <th className="text-center">Priority</th>
                <th>Assigned Bureau</th>
                <th className="text-center">Status</th>
                <th>Filing Date</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    Retrieving grievance records from secure database...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    No grievance records found matching the active criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="text-center text-gray-500 font-mono">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <div className="font-mono font-bold text-blue-900">{c.complaint_id}</div>
                      {c.is_duplicate && (
                        <span className="inline-flex items-center text-[10px] text-purple-700 font-semibold space-x-0.5">
                          <Copy className="w-2.5 h-2.5" />
                          <span>Duplicate</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900 max-w-xs truncate">
                        {c.institution_name || 'N/A'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {c.institution_state} {c.institution_aicte_id && `• ${c.institution_aicte_id}`}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900 max-w-sm line-clamp-2 leading-snug">
                        {c.title}
                      </div>
                      {c.reference_number && (
                        <div className="text-[10px] text-gray-500">
                          Ref: {c.reference_number} • Year: {c.academic_year}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-gray-700">{c.category.replace('_', ' ')}</span>
                    </td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold badge-priority-${c.priority}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <div className="text-gray-800 font-medium">
                        {c.assigned_department_name || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </div>
                      {c.assigned_officer_name && (
                        <div className="text-[10px] text-gray-500">
                          Officer: {c.assigned_officer_name}
                        </div>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold badge-status-${c.status}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-gray-600 text-[11px] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => onOpenComplaint(c.id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-[11px] font-semibold rounded-xs flex items-center space-x-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Open Case</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
