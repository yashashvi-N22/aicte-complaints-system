import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Building,
} from 'lucide-react';
import { api } from '../services/api';

export const Header: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({
  activeTab,
  setActiveTab,
}) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');

  useEffect(() => {
    if (user) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-700 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">Administrator</span>;
      case 'REVIEWER':
        return <span className="bg-purple-700 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">Reviewer</span>;
      case 'DEPT_OFFICER':
        return <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">Bureau Officer</span>;
      case 'INST_REP':
        return <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">Institution Rep</span>;
      default:
        return null;
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-300">
      {/* Top Utility Accessibility Bar (Government Standard) */}
      <div className="bg-[#1f2937] text-white text-xs py-1 px-4 flex flex-wrap items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-gray-300">भारत सरकार | Government of India</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">शिक्षा मंत्रालय | Ministry of Education</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-amber-400 font-medium">Toll-Free Grievance Helpline: 011-29581000</span>
          <span className="text-gray-500">|</span>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Font:</span>
            <button
              onClick={() => setFontSize('normal')}
              className={`px-1 py-0.5 border ${fontSize === 'normal' ? 'bg-gray-600 text-white' : 'text-gray-400'} border-gray-600`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-1 py-0.5 border ${fontSize === 'large' ? 'bg-gray-600 text-white' : 'text-gray-400'} border-gray-600`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('larger')}
              className={`px-1 py-0.5 border ${fontSize === 'larger' ? 'bg-gray-600 text-white' : 'text-gray-400'} border-gray-600`}
            >
              A+
            </button>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">English</span>
        </div>
      </div>

      {/* Mandatory Prototype Disclaimer Bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between font-medium">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-600 text-white px-1.5 py-0.5 text-[10px] font-bold uppercase rounded">Notice</span>
          <span>
            <strong>Demonstration prototype — not an official AICTE service.</strong> This portal simulates the AICTE Integrated Institution Complaint Monitoring & Status Dashboard.
          </span>
        </div>
        <div className="text-amber-800 text-[11px]">
          Demo Academic Year: 2026-2027
        </div>
      </div>

      {/* Main Branding Section */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Official AICTE emblem */}
          <div className="shrink-0 flex items-center justify-center p-1 bg-white border border-gray-200 rounded-xs shadow-xs">
            <img
              src="/aicte-logo.png"
              alt="Official AICTE Emblem"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png";
              }}
            />
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
              अखिल भारतीय तकनीकी शिक्षा परिषद | All India Council for Technical Education
            </h2>
            <h1 className="text-lg md:text-xl font-bold text-[#002855] leading-tight">
              Integrated Institution Complaint Monitoring & Status Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Statutory Body under Ministry of Education, Government of India
            </p>
          </div>
        </div>

        {/* User Account & Quick Role Switcher */}
        {user ? (
          <div className="flex items-center space-x-3 shrink-0">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-medium text-gray-700 rounded-sm"
                title="Switch demo persona for testing"
              >
                <span>Switch Role Persona</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-300 shadow-lg z-50 text-xs">
                  <div className="p-2 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
                    Switch Active Persona (Instant Auth)
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { quickSwitchRole('admin'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col"
                    >
                      <span className="font-semibold text-red-800">1. Administrator</span>
                      <span className="text-gray-500 text-[10px]">Dr. Narendra K. Verma (Full Admin)</span>
                    </button>
                    <button
                      onClick={() => { quickSwitchRole('reviewer'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col border-t border-gray-100"
                    >
                      <span className="font-semibold text-purple-800">2. Reviewer</span>
                      <span className="text-gray-500 text-[10px]">Dr. Arvind Singh (Duplicate Triage Desk)</span>
                    </button>
                    <button
                      onClick={() => { quickSwitchRole('officer_approval'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col border-t border-gray-100"
                    >
                      <span className="font-semibold text-blue-800">3. Approval Bureau Officer</span>
                      <span className="text-gray-500 text-[10px]">Smt. Priya Sundaram (Approvals Bureau)</span>
                    </button>
                    <button
                      onClick={() => { quickSwitchRole('officer_faculty'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col border-t border-gray-100"
                    >
                      <span className="font-semibold text-blue-800">4. Faculty Bureau Officer</span>
                      <span className="text-gray-500 text-[10px]">Shri Manoj Deshpande (Pay Scales)</span>
                    </button>
                    <button
                      onClick={() => { quickSwitchRole('rep_delhi'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col border-t border-gray-100"
                    >
                      <span className="font-semibold text-green-800">5. Inst. Rep (Delhi Tech Acad)</span>
                      <span className="text-gray-500 text-[10px]">Prof. Rajesh Sharma (Complainant)</span>
                    </button>
                    <button
                      onClick={() => { quickSwitchRole('rep_mumbai'); setShowRoleMenu(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex flex-col border-t border-gray-100"
                    >
                      <span className="font-semibold text-green-800">6. Inst. Rep (Mumbai Inst)</span>
                      <span className="text-gray-500 text-[10px]">Dr. Sunita Deshmukh (Complainant)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 relative rounded-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-300 shadow-lg z-50 text-xs">
                  <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Alerts & Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-blue-700 hover:underline text-[11px]"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-3 text-center text-gray-400">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`p-2.5 ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                          <div className="font-medium text-gray-900">{n.title}</div>
                          <div className="text-gray-600 text-[11px] mt-0.5">{n.message}</div>
                          <div className="text-gray-400 text-[10px] mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="border-l border-gray-300 pl-3 flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900 flex items-center justify-end space-x-1.5">
                  <span>{user.full_name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="text-[11px] text-gray-500">
                  {user.institution_name || user.department_name || user.designation || user.username}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 rounded-sm ml-1"
                title="Logout from session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('login')}
            className="px-4 py-2 bg-[#002855] text-white text-xs font-semibold hover:bg-[#001f42] border border-[#001f42] rounded-sm flex items-center space-x-1"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Official Portal Login</span>
          </button>
        )}
      </div>

      {/* Tricolor Government Border Stripe */}
      <div className="w-full flex h-1">
        <div className="w-1/3 bg-[#f37021]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* Utilitarian Navigation Menu Bar */}
      <nav className="bg-[#002855] text-white text-xs font-medium border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center space-x-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2.5 transition-colors border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
            }`}
          >
            Dashboard & Analytics
          </button>

          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-3.5 py-2.5 transition-colors border-b-2 ${
              activeTab === 'institutions'
                ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
            }`}
          >
            Institution Directory
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3.5 py-2.5 transition-colors border-b-2 ${
              activeTab === 'complaints'
                ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
            }`}
          >
            Grievance Monitoring Desk
          </button>

          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3.5 py-2.5 transition-colors border-b-2 ${
              activeTab === 'submit'
                ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
            }`}
          >
            + File New Grievance
          </button>

          {(user?.role === 'ADMIN' || user?.role === 'REVIEWER') && (
            <button
              onClick={() => setActiveTab('reviewer')}
              className={`px-3.5 py-2.5 transition-colors border-b-2 ${
                activeTab === 'reviewer'
                  ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                  : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
              }`}
            >
              Duplicate Reviewer Desk
            </button>
          )}

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-2.5 transition-colors border-b-2 ${
              activeTab === 'departments'
                ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
            }`}
          >
            Bureaus & Cells
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2.5 transition-colors border-b-2 ${
                activeTab === 'audit'
                  ? 'border-amber-400 bg-[#001f42] font-semibold text-white'
                  : 'border-transparent text-gray-200 hover:bg-[#003875] hover:text-white'
              }`}
            >
              Audit Trail & Governance Logs
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
