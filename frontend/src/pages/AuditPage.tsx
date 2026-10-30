import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { Pagination } from '../components/Pagination';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(false);

  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, entityFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        page,
        page_size: pageSize,
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-gray-300">
        <h2 className="text-xl font-bold text-[#002855] flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-green-700" />
          <span>Statutory Governance Audit Trail & Compliance Register</span>
        </h2>
        <p className="text-xs text-gray-600">
          Permanent chronological log of all administrative actions, status mutations, user authentications, and duplicate adjudications
        </p>
      </div>

      {/* Filter box */}
      <div className="bg-white border border-gray-300 p-3 shadow-xs flex flex-wrap gap-3 text-xs items-center">
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Filter by Action</label>
          <input
            type="text"
            placeholder="e.g. STATUS, LOGIN, ASSIGNED..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 border border-gray-300 rounded-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Entity Type</label>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 border border-gray-300 rounded-xs bg-white"
          >
            <option value="">All Entities</option>
            <option value="COMPLAINT">COMPLAINT</option>
            <option value="INSTITUTION">INSTITUTION</option>
            <option value="USER">USER</option>
            <option value="DUPLICATE_SUGGESTION">DUPLICATE_SUGGESTION</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>

        <button
          onClick={() => {
            setActionFilter('');
            setEntityFilter('');
            setPage(1);
          }}
          className="mt-3.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-xs"
        >
          Reset Filters
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-300 shadow-xs">
        <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
          Total Audit Records Logged: <span className="text-[#002855] font-bold">{total}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Timestamp (IST)</th>
                <th>User / Actor</th>
                <th>Role</th>
                <th>Action Code</th>
                <th>Entity Target</th>
                <th>IP Address</th>
                <th>Operational Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id}>
                    <td className="text-center text-gray-500 font-mono">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="font-mono text-gray-700 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="font-semibold text-gray-900">{log.user_name || 'System'}</td>
                    <td>
                      <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-mono rounded-xs">
                        {log.user_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-blue-900">{log.action}</td>
                    <td>
                      <span className="text-gray-700">
                        {log.entity_type} {log.entity_id && `#${log.entity_id}`}
                      </span>
                    </td>
                    <td className="font-mono text-gray-500 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="text-gray-800 max-w-md">{log.details || 'N/A'}</td>
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
