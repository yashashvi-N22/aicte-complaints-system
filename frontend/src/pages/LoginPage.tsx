import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccessNavigate: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessNavigate }) => {
  const { login, quickSwitchRole } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      onSuccessNavigate();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (target: 'admin' | 'reviewer' | 'officer_approval' | 'rep_delhi') => {
    setLoading(true);
    setError(null);
    try {
      await quickSwitchRole(target);
      onSuccessNavigate();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 bg-white border-2 border-[#002855] shadow-md text-xs">
      {/* Header */}
      <div className="bg-[#002855] text-white p-4 text-center">
        <div className="w-14 h-14 bg-white p-1 rounded-xs mx-auto mb-2 flex items-center justify-center shadow-xs">
          <img
            src="/aicte-logo.png"
            alt="Official AICTE Emblem"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png";
            }}
          />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Central Grievance Portal Authentication
        </h2>
        <p className="text-[11px] text-amber-200 mt-0.5">
          Integrated Technical Institution Monitoring System
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Notice */}
        <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed">
          <strong>Demonstration Prototype:</strong> Access is restricted to authorized personnel. Use the quick demo credentials below to evaluate each role's workflow.
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xs flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Username or Registered Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. admin or approval.officer@aicte-india.org"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-2.5 py-1.5 pl-8 border border-gray-300 rounded-xs focus:outline-none focus:border-[#002855]"
              />
              <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 pl-8 border border-gray-300 rounded-xs focus:outline-none focus:border-[#002855]"
              />
              <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#002855] text-white font-bold hover:bg-[#001f42] rounded-xs disabled:opacity-50 text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In to Official Portal'}
          </button>
        </form>

        {/* Quick Demo Evaluation Buttons */}
        <div className="pt-3 border-t border-gray-200">
          <div className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wide">
            Instant One-Click Demo Sign-in by Role:
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="p-2 border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 font-semibold rounded-xs text-left"
            >
              <div className="font-bold">1. Administrator</div>
              <div className="text-[10px] text-red-700">All permissions & audit</div>
            </button>

            <button
              onClick={() => handleQuickLogin('reviewer')}
              className="p-2 border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold rounded-xs text-left"
            >
              <div className="font-bold">2. Reviewer</div>
              <div className="text-[10px] text-purple-700">Duplicate triage desk</div>
            </button>

            <button
              onClick={() => handleQuickLogin('officer_approval')}
              className="p-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold rounded-xs text-left"
            >
              <div className="font-bold">3. Bureau Officer</div>
              <div className="text-[10px] text-blue-700">Approval Bureau cases</div>
            </button>

            <button
              onClick={() => handleQuickLogin('rep_delhi')}
              className="p-2 border border-green-300 bg-green-50 hover:bg-green-100 text-green-900 font-semibold rounded-xs text-left"
            >
              <div className="font-bold">4. Institution Rep</div>
              <div className="text-[10px] text-green-700">Delhi Tech Academy</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
