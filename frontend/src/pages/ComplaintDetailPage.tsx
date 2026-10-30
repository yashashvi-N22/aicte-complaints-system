import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Complaint,
  ComplaintStatus,
  Department,
  DepartmentCoordination,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  User as UserIcon,
  Send,
  MessageSquare,
  ShieldAlert,
  Copy,
  Printer,
  FileCheck,
} from 'lucide-react';

interface ComplaintDetailPageProps {
  complaintId: number;
  onBack: () => void;
  onNavigatePrimary?: (id: number) => void;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({
  complaintId,
  onBack,
  onNavigatePrimary,
}) => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [coordinations, setCoordinations] = useState<DepartmentCoordination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Change State
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [statusComments, setStatusComments] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Bureau Assignment State
  const [assignDeptId, setAssignDeptId] = useState<number | ''>('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Coordination State
  const [coordTargetDept, setCoordTargetDept] = useState<number | ''>('');
  const [coordSubject, setCoordSubject] = useState('');
  const [coordMessage, setCoordMessage] = useState('');
  const [submittingCoord, setSubmittingCoord] = useState(false);
  const [replyCoordId, setReplyCoordId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadDetails();
    api.getDepartments().then(setDepartments).catch(() => {});
  }, [complaintId]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComplaint(complaintId);
      setComplaint(data);
      setNewStatus(data.status);

      const coords = await api.getCoordinations(complaintId);
      setCoordinations(coords);
    } catch (err: any) {
      setError(err.message || 'Error fetching complaint case file');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusComments.trim()) {
      alert('Official investigation / status remarks are mandatory for audit compliance.');
      return;
    }
    setUpdatingStatus(true);
    try {
      await api.updateComplaintStatus(complaintId, newStatus, statusComments);
      setStatusComments('');
      await loadDetails();
      alert('Case status updated and recorded in official audit timeline.');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignBureau = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDeptId) return;
    setAssigning(true);
    try {
      await api.assignComplaint(complaintId, Number(assignDeptId), undefined, assignInstructions);
      setAssignInstructions('');
      await loadDetails();
      alert('Grievance successfully assigned to bureau.');
    } catch (err: any) {
      alert(err.message || 'Failed to assign bureau');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateCoordination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordTargetDept || !coordSubject.trim() || !coordMessage.trim()) return;
    setSubmittingCoord(true);
    try {
      await api.createCoordination({
        complaint_id: complaintId,
        to_department_id: Number(coordTargetDept),
        subject: coordSubject,
        message: coordMessage,
      });
      setCoordSubject('');
      setCoordMessage('');
      setCoordTargetDept('');
      const coords = await api.getCoordinations(complaintId);
      setCoordinations(coords);
      alert('Inter-bureau coordination note transmitted.');
    } catch (err: any) {
      alert(err.message || 'Failed to send coordination query');
    } finally {
      setSubmittingCoord(false);
    }
  };

  const handleRespondCoordination = async (coordId: number) => {
    if (!replyMessage.trim()) return;
    try {
      await api.respondCoordination(coordId, replyMessage, true);
      setReplyMessage('');
      setReplyCoordId(null);
      const coords = await api.getCoordinations(complaintId);
      setCoordinations(coords);
    } catch (err: any) {
      alert(err.message || 'Failed to record response');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-gray-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#002855] border-t-transparent rounded-full mb-2"></div>
        <div>Loading official case file #{complaintId}...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs">
        <strong>Error:</strong> {error || 'Case file not found'}
        <button onClick={onBack} className="block mt-2 text-blue-700 underline font-semibold">
          Return to Grievance Desk
        </button>
      </div>
    );
  }

  const isOfficerOrAdmin = user?.role === 'ADMIN' || user?.role === 'DEPT_OFFICER' || user?.role === 'REVIEWER';
  const isReviewerOrAdmin = user?.role === 'ADMIN' || user?.role === 'REVIEWER';

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-300">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[#002855] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Grievance List</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded-sm flex items-center space-x-1"
          >
            <Printer className="w-3 h-3" />
            <span>Print Case File</span>
          </button>
        </div>
      </div>

      {/* Case Identity Banner */}
      <div className="bg-white border-2 border-[#002855] p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold text-blue-900">{complaint.complaint_id}</span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-xs badge-status-${complaint.status}`}>
                {complaint.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-xs badge-priority-${complaint.priority}`}>
                {complaint.priority} Priority
              </span>
              {complaint.is_duplicate && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-xs badge-status-DUPLICATE flex items-center space-x-1">
                  <Copy className="w-3 h-3" />
                  <span>Duplicate Case</span>
                </span>
              )}
            </div>
            <h1 className="text-base md:text-lg font-bold text-gray-900 mt-1">{complaint.title}</h1>
          </div>

          <div className="text-right text-xs text-gray-500">
            <div>Filing Date: <span className="font-semibold text-gray-800">{new Date(complaint.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
            <div>Academic Session: <span className="font-semibold text-gray-800">{complaint.academic_year}</span></div>
            {complaint.reference_number && (
              <div>Docket / App Ref: <span className="font-mono font-semibold text-blue-800">{complaint.reference_number}</span></div>
            )}
          </div>
        </div>

        {/* Institution & Bureau Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Representing Institution</span>
            <span className="font-bold text-gray-900">{complaint.institution_name}</span>
            <span className="text-gray-500 block text-[11px] font-mono">{complaint.institution_aicte_id} ({complaint.institution_state})</span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Grievance Category</span>
            <span className="font-semibold text-gray-800">{complaint.category.replace('_', ' ')}</span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Handling Bureau</span>
            <span className="font-semibold text-blue-900">
              {complaint.assigned_department_name || 'Triage Queue (Unassigned)'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Complainant Information</span>
            <span className="text-gray-800 font-medium">{complaint.complainant_name || 'Registered Nodal Head'}</span>
            <span className="text-gray-500 block text-[11px]">{complaint.complainant_email}</span>
          </div>
        </div>
      </div>

      {/* Linked Duplicate Notice Banner (if applicable) */}
      {complaint.is_duplicate && complaint.primary_complaint_id && (
        <div className="bg-purple-50 border-2 border-purple-300 p-3.5 text-xs text-purple-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Copy className="w-5 h-5 text-purple-700 shrink-0" />
            <div>
              <strong>Duplicate Filing Notice:</strong> This representation was adjudicated as a duplicate by the Grievance Review Desk. It is officially linked to Primary Case{' '}
              <span className="font-mono font-bold text-purple-950">{complaint.primary_complaint_code || `#${complaint.primary_complaint_id}`}</span>.
            </div>
          </div>
          {onNavigatePrimary && (
            <button
              onClick={() => onNavigatePrimary(complaint.primary_complaint_id!)}
              className="px-3 py-1 bg-purple-700 text-white font-semibold rounded-xs hover:bg-purple-800"
            >
              Open Primary Case
            </button>
          )}
        </div>
      )}

      {/* Main Content Grid: Case Description & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Case Statement & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Grievance Statement */}
          <div className="bg-white border border-gray-300 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-[#002855] tracking-wide mb-2 pb-1 border-b border-gray-200">
              Official Grievance Statement / Representation Particulars
            </h3>
            <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3.5 border border-gray-200 font-sans">
              {complaint.description}
            </div>

            {complaint.resolution_notes && (
              <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-xs">
                <div className="flex items-center space-x-1.5 text-green-900 font-bold text-xs mb-1">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                  <span>Official Resolution / Redressal Finding</span>
                </div>
                <div className="text-xs text-green-950 whitespace-pre-wrap">
                  {complaint.resolution_notes}
                </div>
                {complaint.resolution_date && (
                  <div className="text-[10px] text-green-800 mt-2">
                    Date of Final Order: {new Date(complaint.resolution_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chronological Status Audit Timeline (from complaint_status_history) */}
          <div className="bg-white border border-gray-300 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-[#002855] tracking-wide mb-3 pb-1 border-b border-gray-200 flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>Official Chronological Status History ({complaint.status_history?.length || 0})</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 text-xs">
              {complaint.status_history?.length === 0 ? (
                <div className="text-gray-400 py-2">No history logged yet.</div>
              ) : (
                complaint.status_history?.map((h) => (
                  <div key={h.id} className="relative">
                    {/* Timeline bullet */}
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 bg-[#002855] rounded-full border-2 border-white shadow-xs"></div>

                    <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          {h.from_status ? (
                            <>
                              <span className="font-semibold text-gray-700">{h.from_status}</span>
                              <span className="text-gray-400">→</span>
                            </>
                          ) : null}
                          <span className={`px-1.5 py-0.2 rounded font-bold badge-status-${h.to_status}`}>
                            {h.to_status}
                          </span>
                        </div>
                        <div className="text-gray-500 font-mono">
                          {new Date(h.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <p className="text-gray-800 text-xs whitespace-pre-wrap">{h.comments}</p>
                      <div className="text-[10px] text-gray-500 mt-1">
                        Recorded By: <span className="font-semibold text-gray-700">{h.changed_by_name}</span> ({h.changed_by_role || 'Officer'})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inter-Bureau Coordination Threads */}
          <div className="bg-white border border-gray-300 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
              <h3 className="text-xs font-bold uppercase text-[#002855] tracking-wide flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Inter-Bureau Technical Coordination ({coordinations.length})</span>
              </h3>
            </div>

            {coordinations.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-2">
                No cross-bureau coordination requests have been initiated for this case.
              </div>
            ) : (
              <div className="space-y-3">
                {coordinations.map((coord) => (
                  <div key={coord.id} className="border border-gray-200 bg-gray-50 p-3 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-blue-900">{coord.subject}</div>
                        <div className="text-[11px] text-gray-500">
                          From: <span className="font-semibold">{coord.from_department_name}</span> → To: <span className="font-semibold">{coord.to_department_name}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${coord.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {coord.status}
                      </span>
                    </div>

                    <p className="text-gray-800 bg-white p-2 border border-gray-200">{coord.message}</p>

                    {coord.response_message ? (
                      <div className="bg-green-50 p-2 border border-green-200 text-green-950 mt-1">
                        <div className="font-bold text-[11px] text-green-900">
                          Bureau Response from {coord.responded_by_name || 'Assigned Bureau Head'}:
                        </div>
                        <p className="mt-0.5">{coord.response_message}</p>
                      </div>
                    ) : (
                      isOfficerOrAdmin && (
                        <div>
                          {replyCoordId === coord.id ? (
                            <div className="space-y-1.5 mt-2">
                              <textarea
                                rows={2}
                                placeholder="Enter technical response..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                className="w-full text-xs p-2 border border-gray-300 rounded-xs"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleRespondCoordination(coord.id)}
                                  className="px-3 py-1 bg-[#002855] text-white text-[11px] font-semibold rounded-xs"
                                >
                                  Submit Technical Response
                                </button>
                                <button
                                  onClick={() => setReplyCoordId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 text-[11px] rounded-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyCoordId(coord.id);
                                setReplyMessage('');
                              }}
                              className="text-blue-700 underline text-[11px] font-semibold"
                            >
                              + Respond to this Coordination Query
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Initiate new coordination */}
            {isOfficerOrAdmin && (
              <form onSubmit={handleCreateCoordination} className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-xs">
                <div className="font-bold text-gray-800">Initiate New Cross-Bureau Coordination</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-0.5">Target Bureau</label>
                    <select
                      value={coordTargetDept}
                      onChange={(e) => setCoordTargetDept(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="w-full p-1.5 border border-gray-300 rounded-xs bg-white text-xs"
                    >
                      <option value="">Select Bureau / Cell</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-0.5">Query Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Verification of faculty salary records..."
                      value={coordSubject}
                      onChange={(e) => setCoordSubject(e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded-xs text-xs"
                    />
                  </div>
                </div>
                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide specific technical query for the target bureau..."
                    value={coordMessage}
                    onChange={(e) => setCoordMessage(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded-xs text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingCoord}
                  className="px-3.5 py-1 bg-[#002855] text-white text-xs font-semibold rounded-xs disabled:opacity-50"
                >
                  {submittingCoord ? 'Transmitting...' : 'Dispatch Coordination Note'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Official Action Controls (RBAC Enforced) */}
        <div className="space-y-6">
          {/* Action Panel 1: Status Change Workflow */}
          {isOfficerOrAdmin ? (
            <div className="bg-white border-2 border-gray-300 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase text-[#002855] tracking-wide mb-2 pb-1 border-b border-gray-200">
                Official Status Transition Workflow
              </h3>

              <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Update Case Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full p-2 border border-gray-300 rounded-xs bg-white font-medium text-xs focus:border-[#002855]"
                  >
                    <option value="SUBMITTED">SUBMITTED (Awaiting Triage)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW (Triage In Progress)</option>
                    <option value="ASSIGNED">ASSIGNED (Routed to Bureau)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Scrutiny Active)</option>
                    <option value="PENDING_INSTITUTION">PENDING INSTITUTION (Clarification Required)</option>
                    <option value="RESOLVED">RESOLVED (Redressal Order Issued)</option>
                    <option value="REJECTED">REJECTED (Non-actionable / Ineligible)</option>
                    <option value="CLOSED">CLOSED (Case Finalized)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Official Investigation Remarks / Findings *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter formal findings, statutory citations, or inquiry conclusions. These remarks are permanently audited and transmitted to the complainant."
                    value={statusComments}
                    onChange={(e) => setStatusComments(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xs text-xs focus:border-[#002855]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="w-full py-2 bg-[#002855] text-white font-semibold hover:bg-[#001f42] rounded-xs disabled:opacity-50 text-xs"
                >
                  {updatingStatus ? 'Recording Transition...' : 'Execute Status Transition'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Status Update Restricted:</span> As an Institution Representative, your role permits viewing case timelines and submitting replies. Only AICTE Officers or Administrators can alter status.
            </div>
          )}

          {/* Action Panel 2: Bureau Routing & Assignment (Reviewer & Admin) */}
          {isReviewerOrAdmin && (
            <div className="bg-white border-2 border-gray-300 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase text-[#002855] tracking-wide mb-2 pb-1 border-b border-gray-200">
                Bureau Assignment & Routing
              </h3>

              <form onSubmit={handleAssignBureau} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assign to Bureau</label>
                  <select
                    value={assignDeptId}
                    onChange={(e) => setAssignDeptId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full p-2 border border-gray-300 rounded-xs bg-white text-xs"
                  >
                    <option value="">Select Bureau...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Operational Directives</label>
                  <textarea
                    rows={3}
                    placeholder="Specific directives or timeframe for the bureau..."
                    value={assignInstructions}
                    onChange={(e) => setAssignInstructions(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xs text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assigning || !assignDeptId}
                  className="w-full py-2 bg-purple-900 text-white font-semibold hover:bg-purple-950 rounded-xs disabled:opacity-50 text-xs"
                >
                  {assigning ? 'Routing...' : 'Route to Bureau'}
                </button>
              </form>
            </div>
          )}

          {/* Bureau Assignment Log Details */}
          <div className="bg-white border border-gray-300 p-4 shadow-xs text-xs">
            <h3 className="font-bold uppercase text-gray-700 text-xs mb-2 pb-1 border-b border-gray-200">
              Active Bureau Assignment
            </h3>
            {complaint.assignments && complaint.assignments.length > 0 ? (
              <div className="space-y-2">
                {complaint.assignments.map((a) => (
                  <div key={a.id} className="p-2 bg-gray-50 border border-gray-200">
                    <div className="font-semibold text-blue-900">{a.department_name}</div>
                    <div className="text-gray-600 text-[11px]">
                      Assigned by: {a.assigned_by_name || 'Central Triage'} on {new Date(a.created_at).toLocaleDateString()}
                    </div>
                    {a.instructions && (
                      <div className="text-gray-800 text-[11px] mt-1 italic">"{a.instructions}"</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 italic">No formal bureau assignment recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
