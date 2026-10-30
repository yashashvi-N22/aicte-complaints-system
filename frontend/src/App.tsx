import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ReviewerPage } from './pages/ReviewerPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AuditPage } from './pages/AuditPage';
import { LoginPage } from './pages/LoginPage';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);

  const handleOpenComplaint = (id: number) => {
    setSelectedComplaintId(id);
    setActiveTab('complaint_detail');
  };

  const handleBackToComplaints = () => {
    setSelectedComplaintId(null);
    setActiveTab('complaints');
  };

  const handleFilterByDepartment = (deptId: number) => {
    // Navigate to complaints page
    setActiveTab('complaints');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-[#1f2937]">
      <Header
        activeTab={activeTab === 'complaint_detail' ? 'complaints' : activeTab}
        setActiveTab={(tab) => {
          setSelectedComplaintId(null);
          setActiveTab(tab);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateComplaint={handleOpenComplaint}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'institutions' && (
          <InstitutionsPage onNavigateComplaint={handleOpenComplaint} />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsPage
            onOpenComplaint={handleOpenComplaint}
            onNavigateSubmit={() => setActiveTab('submit')}
          />
        )}

        {activeTab === 'complaint_detail' && selectedComplaintId && (
          <ComplaintDetailPage
            complaintId={selectedComplaintId}
            onBack={handleBackToComplaints}
            onNavigatePrimary={handleOpenComplaint}
          />
        )}

        {activeTab === 'submit' && (
          <SubmitComplaintPage onSuccessNavigate={handleOpenComplaint} />
        )}

        {activeTab === 'reviewer' && (
          <ReviewerPage onOpenComplaint={handleOpenComplaint} />
        )}

        {activeTab === 'departments' && (
          <DepartmentsPage onFilterByDepartment={handleFilterByDepartment} />
        )}

        {activeTab === 'audit' && <AuditPage />}

        {activeTab === 'login' && (
          <LoginPage onSuccessNavigate={() => setActiveTab('dashboard')} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
