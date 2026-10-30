import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Mail, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface DepartmentsPageProps {
  onFilterByDepartment: (deptId: number) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ onFilterByDepartment }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#002855]">AICTE Bureaus, Technical Cells & Divisions</h2>
          <p className="text-xs text-gray-600">
            Designated institutional bodies responsible for grievance inquiry, statutory approvals, and policy compliance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-xs text-gray-500">
            Loading AICTE bureau directories...
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border-2 border-gray-300 p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                  <span className="font-mono text-xs font-bold text-blue-900">{dept.code}</span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold rounded-xs">
                    Operational Bureau
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#002855] mt-2 leading-tight">{dept.name}</h3>
                <p className="text-gray-600 text-xs mt-1.5 leading-relaxed line-clamp-3">
                  {dept.description || 'Statutory AICTE administrative bureau.'}
                </p>

                {dept.contact_email && (
                  <div className="mt-2 text-[11px] text-gray-500 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span>{dept.contact_email}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-xs">
                    <div className="font-bold text-amber-900">{dept.active_complaints_count}</div>
                    <div className="text-[10px] text-gray-600">Active Grievances</div>
                  </div>
                  <div className="p-1.5 bg-green-50 border border-green-200 rounded-xs">
                    <div className="font-bold text-green-900">{dept.resolved_complaints_count}</div>
                    <div className="text-[10px] text-gray-600">Resolved Cases</div>
                  </div>
                </div>

                <button
                  onClick={() => onFilterByDepartment(dept.id)}
                  className="w-full py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-xs flex items-center justify-center space-x-1"
                >
                  <span>View Bureau Queue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
