import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DuplicateSuggestion } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface ReviewerPageProps {
  onOpenComplaint: (id: number) => void;
}

export const ReviewerPage: React.FC<ReviewerPageProps> = ({ onOpenComplaint }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<DuplicateSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Adjudication Modal State
  const [adjudicatingItem, setAdjudicatingItem] = useState<DuplicateSuggestion | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [primaryChoice, setPrimaryChoice] = useState<number | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [statusFilter]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await api.getDuplicateSuggestions(statusFilter === 'ALL' ? undefined : statusFilter);
      setSuggestions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await api.triggerDuplicateScan();
      alert(
        `Automated scan completed across ${res.scanned_complaints_count} active complaints. Found ${res.new_duplicate_suggestions_found} new potential duplicate pairs.`
      );
      loadSuggestions();
    } catch (err: any) {
      alert(err.message || 'Scan error');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenAdjudicate = (item: DuplicateSuggestion) => {
    setAdjudicatingItem(item);
    setDecisionNotes('');
    // By default, earlier submitted complaint is designated Primary
    const c1Time = new Date(item.complaint_created_at).getTime();
    const c2Time = new Date(item.potential_created_at).getTime();
    setPrimaryChoice(c1Time <= c2Time ? item.complaint_id : item.potential_duplicate_id);
  };

  const handleExecuteDecision = async (status: 'CONFIRMED_DUPLICATE' | 'REJECTED_DUPLICATE') => {
    if (!adjudicatingItem) return;
    if (!decisionNotes.trim()) {
      alert('Reviewer decision notes / reason are required for official records.');
      return;
    }

    setSubmittingDecision(true);
    try {
      await api.reviewDuplicateSuggestion(
        adjudicatingItem.id,
        status,
        decisionNotes,
        primaryChoice || undefined
      );
      alert(
        status === 'CONFIRMED_DUPLICATE'
          ? 'Duplicate confirmed. Secondary grievance has been linked to Primary case and marked DUPLICATE.'
          : 'Duplicate suggestion rejected. Both grievances remain active independently.'
      );
      setAdjudicatingItem(null);
      loadSuggestions();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#002855] flex items-center space-x-2">
            <Copy className="w-5 h-5 text-purple-700" />
            <span>Grievance Deduplication & Reviewer Adjudication Desk</span>
          </h2>
          <p className="text-xs text-gray-600">
            Automated NLP similarity scoring detects repetitive representations and multi-party duplicate submissions for administrative triage
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="px-3.5 py-1.5 bg-purple-900 text-white text-xs font-semibold hover:bg-purple-950 rounded-xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Analyzing Text...' : 'Run Similarity Re-scan'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-300 bg-gray-50 text-xs">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'PENDING'
              ? 'border-purple-800 bg-white text-purple-900 font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending Review ({suggestions.filter((s) => s.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setStatusFilter('CONFIRMED_DUPLICATE')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'CONFIRMED_DUPLICATE'
              ? 'border-purple-800 bg-white text-purple-900 font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Confirmed Duplicates
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED_DUPLICATE')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'REJECTED_DUPLICATE'
              ? 'border-purple-800 bg-white text-purple-900 font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected Suggestions
        </button>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'ALL'
              ? 'border-purple-800 bg-white text-purple-900 font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Adjudications
        </button>
      </div>

      {/* Suggestion Cards / Rows */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-white border border-gray-200">
            Loading duplicate candidates...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-white border border-gray-200">
            No duplicate candidates found in this queue. Click "Run Similarity Re-scan" to analyze all open complaints.
          </div>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-gray-300 p-4 shadow-xs space-y-3 text-xs"
            >
              {/* Header metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-bold text-xs rounded-xs border border-purple-200">
                    Similarity Score: {(item.similarity_score * 100).toFixed(1)}% Match
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'CONFIRMED_DUPLICATE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    Status: {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500">
                  Detected on: {new Date(item.suggested_at).toLocaleDateString()}
                </div>
              </div>

              {/* Matched Keywords */}
              {item.matched_keywords && (
                <div className="text-[11px] text-gray-700 bg-gray-50 p-2 border border-gray-200">
                  <strong>Overlapping Terms:</strong>{' '}
                  <span className="font-mono text-purple-900">{item.matched_keywords}</span>
                </div>
              )}

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Complaint A */}
                <div className="border border-blue-200 bg-blue-50/40 p-3 rounded-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-sm">
                      {item.complaint_code}
                    </span>
                    <button
                      onClick={() => onOpenComplaint(item.complaint_id)}
                      className="text-blue-700 underline text-[11px] font-semibold flex items-center space-x-0.5"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="font-bold text-gray-900 leading-snug">{item.complaint_title}</div>
                  <div className="text-[11px] text-gray-600">
                    <strong>Institution:</strong> {item.complaint_institution_name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Filed on: {new Date(item.complaint_created_at).toLocaleDateString()} • {item.complaint_category}
                  </div>
                </div>

                {/* Complaint B */}
                <div className="border border-indigo-200 bg-indigo-50/40 p-3 rounded-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-900 text-sm">
                      {item.potential_code}
                    </span>
                    <button
                      onClick={() => onOpenComplaint(item.potential_duplicate_id)}
                      className="text-indigo-700 underline text-[11px] font-semibold flex items-center space-x-0.5"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="font-bold text-gray-900 leading-snug">{item.potential_title}</div>
                  <div className="text-[11px] text-gray-600">
                    <strong>Institution:</strong> {item.potential_institution_name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Filed on: {new Date(item.potential_created_at).toLocaleDateString()} • {item.potential_category}
                  </div>
                </div>
              </div>

              {/* Review Decision Outcome or Action Button */}
              {item.status === 'PENDING' ? (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleOpenAdjudicate(item)}
                    className="px-4 py-1.5 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] rounded-xs"
                  >
                    Adjudicate Duplicate Pair
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-50 border border-gray-200 text-[11px]">
                  <div>
                    <strong>Reviewer Decision:</strong> Reviewed by{' '}
                    <span className="font-semibold">{item.reviewed_by_name || 'Reviewer'}</span> on{' '}
                    {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : 'N/A'}
                  </div>
                  {item.review_notes && (
                    <div className="text-gray-700 mt-1 italic">"{item.review_notes}"</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Adjudication Modal */}
      {adjudicatingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002855] w-full max-w-xl shadow-2xl p-4 text-xs space-y-3">
            <div className="bg-[#002855] text-white p-2.5 -m-4 mb-2 flex justify-between items-center">
              <h3 className="font-bold text-sm">Adjudicate Potential Duplicate Candidate</h3>
              <button
                onClick={() => setAdjudicatingItem(null)}
                className="text-gray-300 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-gray-50 border border-gray-200 space-y-1">
              <div>
                <strong>Case A:</strong> {adjudicatingItem.complaint_code} - {adjudicatingItem.complaint_title}
              </div>
              <div>
                <strong>Case B:</strong> {adjudicatingItem.potential_code} - {adjudicatingItem.potential_title}
              </div>
              <div className="text-purple-900 font-semibold text-[11px]">
                Algorithm Match Confidence: {(adjudicatingItem.similarity_score * 100).toFixed(1)}%
              </div>
            </div>

            {/* Designate Primary */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                If confirmed, designate Primary Grievance Case:
              </label>
              <div className="space-y-1">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="primary_choice"
                    checked={primaryChoice === adjudicatingItem.complaint_id}
                    onChange={() => setPrimaryChoice(adjudicatingItem.complaint_id)}
                  />
                  <span>
                    Keep <strong>{adjudicatingItem.complaint_code}</strong> as Primary (Mark{' '}
                    {adjudicatingItem.potential_code} as Duplicate)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="primary_choice"
                    checked={primaryChoice === adjudicatingItem.potential_duplicate_id}
                    onChange={() => setPrimaryChoice(adjudicatingItem.potential_duplicate_id)}
                  />
                  <span>
                    Keep <strong>{adjudicatingItem.potential_code}</strong> as Primary (Mark{' '}
                    {adjudicatingItem.complaint_code} as Duplicate)
                  </span>
                </label>
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Official Reviewer Notes / Justification *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State the rationale for confirmation or rejection (e.g. 'Both cases involve the exact same fee dispute for the 2026 MBA round. Consolidating into primary file.')..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-xs text-xs focus:border-[#002855]"
              />
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAdjudicatingItem(null)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 font-medium rounded-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() => handleExecuteDecision('REJECTED_DUPLICATE')}
                className="px-3.5 py-1.5 bg-gray-700 text-white font-semibold hover:bg-gray-800 rounded-xs disabled:opacity-50"
              >
                Reject Duplicate (Keep Both Active)
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() => handleExecuteDecision('CONFIRMED_DUPLICATE')}
                className="px-4 py-1.5 bg-purple-900 text-white font-bold hover:bg-purple-950 rounded-xs disabled:opacity-50"
              >
                Confirm Duplicate & Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
