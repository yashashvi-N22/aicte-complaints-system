import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Institution, InstituteType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Power,
  Building,
  CheckCircle,
  XCircle,
  ExternalLink,
  X,
  FileText,
} from 'lucide-react';

interface InstitutionsPageProps {
  onNavigateComplaint: (id: number) => void;
}

export const InstitutionsPage: React.FC<InstitutionsPageProps> = ({ onNavigateComplaint }) => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Metadata for filter dropdowns
  const [statesList, setStatesList] = useState<{ state: string; districts: string[] }[]>([]);

  // Selected Profile Modal
  const [profileModal, setProfileModal] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Edit/Add Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Partial<Institution> | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getStatesAndDistricts().then(setStatesList).catch(() => {});
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [page, selectedState, selectedDistrict, selectedType, selectedStatus, sortBy, sortOrder]);

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const activeParam = selectedStatus === '' ? undefined : selectedStatus === 'active';
      const data = await api.getInstitutions({
        q: search || undefined,
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        institute_type: selectedType || undefined,
        is_active: activeParam,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      });
      setInstitutions(data.items);
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
    loadInstitutions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedType('');
    setSelectedStatus('');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const handleOpenProfile = async (id: number) => {
    setLoadingProfile(true);
    try {
      const profile = await api.getInstitutionProfile(id);
      setProfileModal(profile);
    } catch (err: any) {
      alert(err.message || 'Failed to load institution profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleToggleStatus = async (inst: Institution) => {
    if (!confirm(`Are you sure you want to ${inst.is_active ? 'deactivate' : 'activate'} ${inst.name}?`)) return;
    try {
      await api.toggleInstitutionStatus(inst.id);
      loadInstitutions();
      if (profileModal && profileModal.id === inst.id) {
        setProfileModal({ ...profileModal, is_active: !inst.is_active });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleOpenAddModal = () => {
    setEditingInst({
      aicte_id: '',
      name: '',
      code: '',
      institute_type: 'ENGINEERING',
      state: 'Delhi',
      district: 'New Delhi',
      address: '',
      pin_code: '',
      contact_email: '',
      contact_phone: '',
      website: '',
    });
    setModalError(null);
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (inst: Institution) => {
    setEditingInst({ ...inst });
    setModalError(null);
    setEditModalOpen(true);
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    setSubmitting(true);
    setModalError(null);
    try {
      if (editingInst.id) {
        await api.updateInstitution(editingInst.id, editingInst);
      } else {
        await api.createInstitution(editingInst);
      }
      setEditModalOpen(false);
      setEditingInst(null);
      loadInstitutions();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save institution');
    } finally {
      setSubmitting(false);
    }
  };

  const availableDistricts = statesList.find((s) => s.state === selectedState)?.districts || [];

  return (
    <div className="space-y-5">
      {/* Page Heading & Admin Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#002855]">AICTE Approved Institution Directory</h2>
          <p className="text-xs text-gray-600">
            Official repository of approved technical universities, polytechnics, and management institutes
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-sm flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Institution</span>
          </button>
        )}
      </div>

      {/* Utilitarian Filter Panel (Standard Gov Portal Form) */}
      <div className="bg-white border border-gray-300 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Box */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Search Institution (Name, AICTE ID, or Code)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Delhi Tech, 1-109283741, DTA-DEL-01..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs px-3 py-2 pl-9 border border-gray-300 rounded-sm focus:outline-none focus:border-[#002855]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State / UT</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('');
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
              >
                <option value="">All States & UTs</option>
                {statesList.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setPage(1);
                }}
                disabled={!selectedState}
                className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-sm bg-white disabled:bg-gray-100 focus:outline-none focus:border-[#002855]"
              >
                <option value="">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-gray-100">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discipline / Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
              >
                <option value="">All Disciplines</option>
                <option value="ENGINEERING">Engineering & Tech</option>
                <option value="MANAGEMENT">Management (MBA/PGDM)</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="POLYTECHNIC">Polytechnic / Diploma</option>
                <option value="ARCHITECTURE">Architecture & Planning</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Approval Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Approval</option>
                <option value="inactive">Suspended / Deactivated</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white focus:outline-none focus:border-[#002855]"
              >
                <option value="name">Institution Name</option>
                <option value="aicte_id">AICTE ID</option>
                <option value="created_at">Registration Date</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-sm"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium rounded-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-gray-300 shadow-xs">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
          <span className="font-semibold text-gray-700">
            Total Institutions Found: <span className="text-[#002855] font-bold">{total}</span>
          </span>
          <span className="text-gray-500 text-[11px]">Click 'View Profile' for full case records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>AICTE ID</th>
                <th>Institution Name</th>
                <th>Discipline</th>
                <th>State & District</th>
                <th className="text-center">Total Complaints</th>
                <th className="text-center">Pending / Resolved</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    Loading records from database...
                  </td>
                </tr>
              ) : institutions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No institutions match the filter criteria.
                  </td>
                </tr>
              ) : (
                institutions.map((inst, index) => (
                  <tr key={inst.id}>
                    <td className="text-center text-gray-500 font-mono">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="font-mono font-medium text-blue-900">{inst.aicte_id}</td>
                    <td>
                      <div className="font-bold text-gray-900">{inst.name}</div>
                      <div className="text-[11px] text-gray-500">Code: {inst.code || 'N/A'}</div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-[11px] rounded-xs">
                        {inst.institute_type}
                      </span>
                    </td>
                    <td>
                      <div className="text-gray-800 font-medium">{inst.state}</div>
                      <div className="text-[11px] text-gray-500">{inst.district}</div>
                    </td>
                    <td className="text-center font-bold text-gray-900">
                      {inst.total_complaints}
                    </td>
                    <td className="text-center">
                      <span className="text-amber-700 font-semibold">{inst.pending_complaints}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-green-700 font-semibold">{inst.resolved_complaints}</span>
                    </td>
                    <td className="text-center">
                      {inst.is_active ? (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold rounded-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold rounded-xs">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenProfile(inst.id)}
                          className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-[11px] font-medium rounded-xs flex items-center space-x-1"
                          title="View complete profile and history"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profile</span>
                        </button>

                        {user?.role === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(inst)}
                              className="p-1 text-gray-600 hover:text-blue-700 hover:bg-gray-100 border border-gray-300 rounded-xs"
                              title="Edit institution details"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(inst)}
                              className={`p-1 border rounded-xs ${
                                inst.is_active
                                  ? 'text-red-600 hover:bg-red-50 border-red-200'
                                  : 'text-green-600 hover:bg-green-50 border-green-200'
                              }`}
                              title={inst.is_active ? 'Deactivate Institution' : 'Activate Institution'}
                            >
                              <Power className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Institution Profile Modal Drawer */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002855] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#002855] text-white p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-amber-300 font-mono uppercase tracking-wider">
                  AICTE Institute Profile Record
                </span>
                <h3 className="text-base font-bold leading-tight">{profileModal.name}</h3>
              </div>
              <button
                onClick={() => setProfileModal(null)}
                className="text-gray-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 text-xs">
              {/* Institution Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 border border-gray-200">
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">Permanent AICTE ID</div>
                  <div className="font-mono font-bold text-blue-900">{profileModal.aicte_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">Discipline</div>
                  <div className="font-semibold">{profileModal.institute_type}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">State & District</div>
                  <div className="font-semibold">{profileModal.state}, {profileModal.district}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">Approval Status</div>
                  <div>
                    {profileModal.is_active ? (
                      <span className="text-green-700 font-bold">Active Approval</span>
                    ) : (
                      <span className="text-red-700 font-bold">Deactivated / Suspended</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-gray-500 text-[10px] uppercase">Campus Address</div>
                  <div className="text-gray-800">{profileModal.address} - PIN: {profileModal.pin_code}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">Official Email</div>
                  <div className="text-gray-800">{profileModal.contact_email}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] uppercase">Phone & Website</div>
                  <div className="text-gray-800">
                    {profileModal.contact_phone}
                    {profileModal.website && (
                      <a
                        href={profileModal.website}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-blue-700 underline inline-flex items-center"
                      >
                        Web <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Complaint Statistics Banner */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 border border-gray-200 bg-blue-50">
                  <div className="text-lg font-bold text-blue-900">{profileModal.total_complaints}</div>
                  <div className="text-[11px] text-gray-600">Total Grievances Filed</div>
                </div>
                <div className="p-2 border border-gray-200 bg-amber-50">
                  <div className="text-lg font-bold text-amber-800">{profileModal.pending_complaints}</div>
                  <div className="text-[11px] text-gray-600">Pending Under Triage/Bureau</div>
                </div>
                <div className="p-2 border border-gray-200 bg-green-50">
                  <div className="text-lg font-bold text-green-800">{profileModal.resolved_complaints}</div>
                  <div className="text-[11px] text-gray-600">Formally Resolved</div>
                </div>
              </div>

              {/* Historical Complaints Table */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wide text-xs mb-2 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Grievance Audit History ({profileModal.complaints?.length || 0})</span>
                </h4>

                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-left gov-table">
                    <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>Subject / Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Assigned Bureau</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileModal.complaints?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-gray-400">
                            No historical grievances filed for this institution.
                          </td>
                        </tr>
                      ) : (
                        profileModal.complaints?.map((c: any) => (
                          <tr key={c.id}>
                            <td className="font-mono text-blue-900 font-bold">{c.complaint_id}</td>
                            <td className="font-medium text-gray-900 max-w-xs truncate">{c.title}</td>
                            <td>{c.category}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold badge-priority-${c.priority}`}>
                                {c.priority}
                              </span>
                            </td>
                            <td>{c.assigned_department_name || 'Unassigned'}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold badge-status-${c.status}`}>
                                {c.status}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setProfileModal(null);
                                  onNavigateComplaint(c.id);
                                }}
                                className="text-blue-700 underline font-semibold text-[11px]"
                              >
                                View Case
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setProfileModal(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Institution Modal */}
      {editModalOpen && editingInst && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002855] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="bg-[#002855] text-white p-3 flex justify-between items-center">
              <h3 className="text-sm font-bold">
                {editingInst.id ? `Edit Institution: ${editingInst.name}` : 'Register New Technical Institution'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInstitution} className="p-4 space-y-3 text-xs">
              {modalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Permanent AICTE ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-998877665"
                    value={editingInst.aicte_id || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, aicte_id: e.target.value })}
                    disabled={!!editingInst.id}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Institution Code / Short Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DTA-DEL-01"
                    value={editingInst.code || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Full Official Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Institute of Information Technology"
                    value={editingInst.name || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discipline / Type *</label>
                  <select
                    value={editingInst.institute_type || 'ENGINEERING'}
                    onChange={(e) => setEditingInst({ ...editingInst, institute_type: e.target.value as InstituteType })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm bg-white"
                  >
                    <option value="ENGINEERING">ENGINEERING</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="PHARMACY">PHARMACY</option>
                    <option value="POLYTECHNIC">POLYTECHNIC</option>
                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                    <option value="APPLIED_ARTS">APPLIED_ARTS</option>
                    <option value="HOTEL_MANAGEMENT">HOTEL_MANAGEMENT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={editingInst.state || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, state: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={editingInst.district || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, district: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="6 digits PIN"
                    value={editingInst.pin_code || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, pin_code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Full Postal Address *</label>
                  <textarea
                    required
                    rows={2}
                    value={editingInst.address || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, address: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nodal Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="registrar@college.edu.in"
                    value={editingInst.contact_email || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, contact_email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nodal Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="022-12345678"
                    value={editingInst.contact_phone || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, contact_phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Official Website URL</label>
                  <input
                    type="url"
                    placeholder="https://www.institution.edu.in"
                    value={editingInst.website || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, website: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#002855] text-white font-semibold hover:bg-[#001f42] rounded-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
