import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Institution, ComplaintCategory, ComplaintPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface SubmitComplaintPageProps {
  onSuccessNavigate: (complaintId: number) => void;
}

export const SubmitComplaintPage: React.FC<SubmitComplaintPageProps> = ({ onSuccessNavigate }) => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInsts, setLoadingInsts] = useState(false);

  // Form Fields
  const [selectedInstId, setSelectedInstId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('APPROVAL_AFFILIATION');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  useEffect(() => {
    if (user?.role === 'INST_REP' && user.institution_id) {
      setSelectedInstId(user.institution_id);
    } else {
      setLoadingInsts(true);
      api
        .getInstitutions({ page_size: 100 })
        .then((res) => setInstitutions(res.items))
        .catch(() => {})
        .finally(() => setLoadingInsts(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const instId = user?.role === 'INST_REP' ? user.institution_id : Number(selectedInstId);
    if (!instId) {
      setError('Please select the institution for which this grievance is being filed.');
      return;
    }

    if (description.length < 30) {
      setError('Please provide a substantive grievance description (minimum 30 characters) for official inquiry.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createComplaint({
        institution_id: instId,
        title,
        description,
        category,
        priority,
        reference_number: referenceNumber || undefined,
        academic_year: academicYear,
      });
      setSubmittedResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white border-2 border-green-600 p-6 shadow-sm text-xs">
        <div className="flex items-center space-x-3 text-green-700 mb-4 pb-3 border-b border-green-200">
          <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-green-900 leading-tight">
              Grievance Registered Successfully on Central AICTE Portal
            </h2>
            <div className="text-[11px] text-green-800">
              Statutory Acknowledgement Receipt Issued
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-4 border border-gray-200 mb-5">
          <div className="flex justify-between items-center py-1 border-b border-gray-200">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Case Tracking Number</span>
            <span className="font-mono text-base font-bold text-blue-900">{submittedResult.complaint_id}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-200">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Institution</span>
            <span className="font-semibold text-gray-800">{submittedResult.institution_name}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-200">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Category & Priority</span>
            <span>
              {submittedResult.category.replace('_', ' ')} •{' '}
              <strong className="text-amber-800">{submittedResult.priority}</strong>
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-200">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Initial Status</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-xs">
              SUBMITTED (Pending Central Triage)
            </span>
          </div>

          {submittedResult.potential_duplicate_count > 0 && (
            <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-900 mt-2">
              <strong>Notice:</strong> Automated similarity analysis flagged{' '}
              {submittedResult.potential_duplicate_count} potential previous grievance match(es). AICTE Reviewer Desk has been alerted for deduplication triage.
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onSuccessNavigate(submittedResult.id)}
            className="flex-1 py-2 bg-[#002855] text-white font-semibold hover:bg-[#001f42] rounded-xs flex items-center justify-center space-x-1.5"
          >
            <span>View Case File</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSubmittedResult(null);
              setTitle('');
              setDescription('');
              setReferenceNumber('');
            }}
            className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 font-medium rounded-xs"
          >
            Submit Another Grievance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-gray-300">
        <h2 className="text-xl font-bold text-[#002855]">Formal Grievance Submission Form</h2>
        <p className="text-xs text-gray-600">
          Official statutory grievance representation under AICTE Regulations 2026. Every submission is recorded in the permanent audit trail.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs">
          <strong>Validation Error:</strong> {error}
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-5 shadow-xs space-y-4 text-xs">
        {/* Institution Selection */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Target AICTE Institution *
          </label>
          {user?.role === 'INST_REP' ? (
            <div className="p-2.5 bg-gray-50 border border-gray-300 font-medium text-gray-900 rounded-xs flex items-center justify-between">
              <div>
                <div className="font-bold">{user.institution_name || 'My Institution'}</div>
                <div className="text-[11px] text-gray-500">Locked to your authenticated institution account</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full p-2 border border-gray-300 rounded-xs bg-white text-xs focus:border-[#002855]"
            >
              <option value="">Select AICTE Approved Institution...</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.aicte_id} - {i.state})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Grievance Classification / Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full p-2 border border-gray-300 rounded-xs bg-white text-xs focus:border-[#002855]"
            >
              <option value="APPROVAL_AFFILIATION">Approval & Affiliation (EoA / New Course)</option>
              <option value="FACULTY_STAFF">Faculty & Staff Welfare (7th CPC / Pay / Service)</option>
              <option value="STUDENT_FEES">Student Welfare, Admissions & Capitation Fees</option>
              <option value="INFRASTRUCTURE">Infrastructure & Safety Deficiencies</option>
              <option value="ANTI_RAGGING">Ragging & Harassment Prevention</option>
              <option value="FUNDS_SCHOLARSHIP">Grants, Research Funds & Scholarships (Pragati/Saksham)</option>
              <option value="EXAM_CURRICULUM">Curriculum Compliance & Examination Conduct</option>
              <option value="GOVERNANCE_CORRUPTION">Governance & Financial Misappropriation</option>
              <option value="OTHER">Other Administrative Matters</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Severity / Priority Level *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
              className="w-full p-2 border border-gray-300 rounded-xs bg-white text-xs focus:border-[#002855]"
            >
              <option value="LOW">Low (General Query / Clarification)</option>
              <option value="MEDIUM">Medium (Standard Administrative Matter)</option>
              <option value="HIGH">High (Impacting Academic Session / Approvals)</option>
              <option value="URGENT">Urgent (Immediate Safety, Ragging or Legal Deadline)</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Grievance Subject / Concise Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Delay in EoA Scrutiny Verification for B.Tech CSE Intake increment..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-xs text-xs focus:border-[#002855]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Reference Number */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              External Reference / Application ID (if any)
            </label>
            <input
              type="text"
              placeholder="e.g. APP-2026-9018, COURT-ORD-112, etc."
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xs text-xs focus:border-[#002855]"
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Academic Session *</label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xs text-xs focus:border-[#002855]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-gray-700">
              Detailed Grievance Representation Particulars *
            </label>
            <span className="text-[10px] text-gray-400">
              {description.length} characters (min 30)
            </span>
          </div>
          <textarea
            rows={6}
            required
            placeholder="State the facts chronologically, quoting specific AICTE guidelines, inspection dates, regulatory circulars, or withheld approvals. Please include dates, personnel names, and financial amounts where applicable."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xs text-xs focus:border-[#002855] leading-relaxed"
          />
        </div>

        {/* Declarations */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
          <div>
            <strong>Declaration:</strong> I hereby declare that the particulars furnished above are true and complete to the best of my knowledge and belief. I understand that submitting false or frivolous grievances is subject to action under AICTE Act regulations.
          </div>
        </div>

        <div className="pt-2 flex justify-end space-x-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[#002855] text-white font-bold hover:bg-[#001f42] rounded-xs disabled:opacity-50 text-xs flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Registering Grievance...' : 'Submit Grievance to AICTE'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
