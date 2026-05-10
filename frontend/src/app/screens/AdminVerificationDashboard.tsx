import React, { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, XCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GuideDocument {
  id: number;
  document_type: string;
  file: string;
  uploaded_at: string;
}

interface GuideApplication {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  guide_verification_status: 'pending' | 'approved' | 'rejected';
  guide_verification_reason: string;
  guide_requested_at: string;
  documents: GuideDocument[];
}

export default function AdminVerificationDashboard() {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<GuideApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/admin/guide-applications/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle DRF ViewSet responses (paginated or flat)
        const apps = Array.isArray(data) ? data : (data.results || []);
        setApplications(apps);
        if (apps.length > 0) setSelectedApp(apps[0]);
      }
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!selectedApp) return;
    
    if (action === 'reject' && !reviewReason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/guide-applications/${selectedApp.id}/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ action, reason: reviewReason })
      });

      if (response.ok) {
        alert(`Application ${action}d successfully`);
        fetchApplications();
        setReviewReason('');
      } else {
        alert('Verification failed');
      }
    } catch (error) {
      console.error('Failed to verify application', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30 flex items-center"><CheckCircle size={14} className="mr-1"/> Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30 flex items-center"><XCircle size={14} className="mr-1"/> Rejected</span>;
      default: return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm border border-yellow-500/30 flex items-center"><Clock size={14} className="mr-1"/> Pending</span>;
    }
  };

  const getDocTypeName = (type: string) => {
    switch(type) {
      case 'id_passport': return 'ID / Passport';
      case 'certification': return 'Tour Guide Certification';
      case 'insurance': return 'Public Liability Insurance';
      default: return 'Other Document';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a1913] flex items-center justify-center text-white">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a1913] text-gray-200 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d2119] border-r border-green-900/30 hidden md:flex flex-col p-6 glass-panel">
        <div className="flex items-center space-x-3 mb-10 text-green-400">
          <Shield size={28} />
          <h1 className="text-xl font-bold tracking-wider">GuideVerify</h1>
        </div>
        <nav className="space-y-4">
          <Link to="/admin" className="flex items-center space-x-3 text-gray-400 hover:text-green-400 transition-colors py-2">
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3 text-white bg-green-900/40 p-3 rounded-xl border border-green-700/50">
            <span className="font-medium">Verification</span>
          </div>
          <Link to="/" className="flex items-center space-x-3 text-gray-400 hover:text-green-400 transition-colors py-2 mt-8">
            <span>Exit Admin</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">
        
        {/* Applications List */}
        <div className="w-full md:w-1/2 lg:w-2/5 border-r border-green-900/30 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">Guide Applications</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Search applications..." 
                className="w-full bg-[#0d2119] border border-green-900/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {applications.map(app => (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${selectedApp?.id === app.id ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[#0d2119] border-transparent hover:border-green-900/50'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{app.full_name}</h3>
                    <p className="text-sm text-gray-400">@{app.username}</p>
                  </div>
                  {getStatusBadge(app.guide_verification_status)}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-4">
                  <Clock size={14} className="mr-1"/>
                  Requested: {new Date(app.guide_requested_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="text-center text-gray-500 mt-10">No applications found.</div>
            )}
          </div>
        </div>

        {/* Detail Review Panel */}
        {selectedApp ? (
          <div className="w-full md:w-1/2 lg:w-3/5 p-8 flex flex-col h-full overflow-y-auto bg-[#081510] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-white">Application Review</h2>
            </div>

            {/* Applicant Header */}
            <div className="bg-[#0d2119] p-6 rounded-2xl border border-green-900/30 mb-8 flex items-center space-x-6">
              <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 text-3xl font-bold border border-green-500/30">
                {selectedApp.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedApp.full_name}</h3>
                <div className="text-gray-400 space-y-1 text-sm">
                  <p>{selectedApp.email}</p>
                  <p>{selectedApp.phone}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="mr-2 text-green-500" size={20} /> Submitted Documents
            </h4>
            <div className="space-y-4 mb-10">
              {selectedApp.documents && selectedApp.documents.length > 0 ? (
                selectedApp.documents.map(doc => (
                  <div key={doc.id} className="bg-[#0d2119] p-4 rounded-xl border border-green-900/30 flex justify-between items-center group hover:border-green-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#081510] rounded-lg flex items-center justify-center text-green-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{getDocTypeName(doc.document_type)}</p>
                        <p className="text-xs text-green-500/70 mt-1">Uploaded successfully</p>
                      </div>
                    </div>
                    <a href={doc.file} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-900/30 hover:bg-green-800/50 text-green-400 rounded-lg text-sm font-medium transition-colors">
                      View
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[#0d2119] rounded-xl border border-red-900/30 text-red-400 text-center">
                  No documents submitted.
                </div>
              )}
            </div>

            {/* Review Section */}
            {selectedApp.guide_verification_status === 'pending' && (
              <div className="bg-[#0d2119] p-6 rounded-2xl border border-green-900/30 mt-auto">
                <h4 className="text-lg font-semibold text-white mb-4">Reviewer Comments</h4>
                <textarea 
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Provide reason for Approval/Rejection..."
                  className="w-full h-32 bg-[#081510] border border-green-900/50 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none mb-6"
                />
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleVerify('reject')}
                    className="flex-1 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-xl font-medium transition-colors"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => handleVerify('approve')}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] rounded-xl font-medium transition-all"
                  >
                    Approve Guide
                  </button>
                </div>
              </div>
            )}
            
            {selectedApp.guide_verification_status !== 'pending' && (
              <div className="bg-[#0d2119] p-6 rounded-2xl border border-green-900/30 mt-auto text-center">
                <p className="text-gray-400 mb-2">This application has already been processed.</p>
                <div className="inline-block">
                  {getStatusBadge(selectedApp.guide_verification_status)}
                </div>
                {selectedApp.guide_verification_reason && (
                  <p className="mt-4 text-sm text-gray-300 italic border-l-2 border-green-500/50 pl-4 text-left">
                    "{selectedApp.guide_verification_reason}"
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <Shield size={64} className="mb-4 opacity-20" />
            <p className="text-xl">Select an application to review</p>
          </div>
        )}
      </main>
    </div>
  );
}
