import React, { useState, useEffect } from 'react';
import { issueAPI, userAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORY_LABELS = {
  asset: 'Asset',
  infrastructure: 'Infrastructure',
  academic: 'Academic',
  conduct: 'Conduct',
  general: 'General',
};

const ManageIssues = ({ onBack, isReadOnly = false }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [expandedIssueDetails, setExpandedIssueDetails] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [commentText, setCommentText] = useState({});
  const [users, setUsers] = useState([]);
  const [resolutionProof, setResolutionProof] = useState({});
  const [uploadingProof, setUploadingProof] = useState({});

  useEffect(() => {
    fetchIssues();
    fetchUsers();
  }, [filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await issueAPI.getAllIssues(params);
      setIssues(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ role: 'faculty' });
      setUsers(response.data.data || []);
    } catch (_) {}
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { status: newStatus });
      setSuccess('Status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchIssues();
      if (expandedIssueId === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleAssign = async (issueId, userId) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { assignedTo: userId || null });
      fetchIssues();
      if (expandedIssueId === issueId) {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText[issueId]?.trim()) return;
    try {
      await issueAPI.addComment(issueId, { text: commentText[issueId] });
      setCommentText(prev => ({ ...prev, [issueId]: '' }));
      fetchIssues();
      const response = await issueAPI.getIssueById(issueId);
      setExpandedIssueDetails(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleUploadResolutionProof = async (issueId) => {
    if (!resolutionProof[issueId]) {
      setError('Please select a proof image');
      return;
    }
    setUploadingProof(prev => ({ ...prev, [issueId]: true }));
    try {
      const formData = new FormData();
      formData.append('proof', resolutionProof[issueId]);
      await issueAPI.uploadResolutionProof(issueId, formData);
      setResolutionProof(prev => ({ ...prev, [issueId]: null }));
      setError('');
      setSuccess('Resolution proof uploaded successfully');
      const response = await issueAPI.getIssueById(issueId);
      setExpandedIssueDetails(response.data.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUploadingProof(prev => ({ ...prev, [issueId]: false }));
    }
  };

  const toggleExpandCard = async (issueId) => {
    if (expandedIssueId === issueId) {
      setExpandedIssueId(null);
      setExpandedIssueDetails(null);
    } else {
      try {
        const response = await issueAPI.getIssueById(issueId);
        setExpandedIssueId(issueId);
        setExpandedIssueDetails(response.data.data);
      } catch (err) {
        setError('Failed to load issue details');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700 border border-blue-300',
      'in-progress': 'bg-amber-100 text-amber-700 border border-amber-300',
      resolved: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 border border-gray-300',
      normal: 'bg-blue-100 text-blue-700 border border-blue-300',
      high: 'bg-red-100 text-red-700 border border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (priority) => {
    const labels = { low: 'Low', normal: 'Normal', high: 'High' };
    return labels[priority] || priority;
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      open: 'border-l-blue-500',
      'in-progress': 'border-l-amber-500',
      resolved: 'border-l-emerald-500',
    };
    return colors[status] || 'border-l-gray-500';
  };

  const getCategoryColor = (category) => {
    const colors = {
      asset: 'bg-orange-100 text-orange-700',
      infrastructure: 'bg-purple-100 text-purple-700',
      academic: 'bg-indigo-100 text-indigo-700',
      conduct: 'bg-pink-100 text-pink-700',
      general: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const filterButtons = [
    { label: 'All Issues', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Issues</h1>
        <p className="text-gray-500 mb-6 text-sm">Review, assign, and resolve reported issues</p>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === btn.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          ✅ {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No issues found</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {issues.map(issue => (
            <div
              key={issue._id}
              className={`bg-white rounded-xl shadow-sm border-l-4 transition-all ${getStatusBorderColor(issue.status)} ${
                expandedIssueId === issue._id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md border border-gray-200'
              }`}
            >
              {/* COLLAPSED VIEW */}
              <div
                onClick={() => toggleExpandCard(issue._id)}
                className="p-6 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                      {getPriorityLabel(issue.priority)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(issue.category)}`}>
                      {CATEGORY_LABELS[issue.category] || issue.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Reported By</p>
                    <p className="text-gray-700 font-medium">{issue.createdBy?.name || '—'}</p>
                  </div>
                  {issue.category === 'asset' && (
                    <div>
                      <p className="text-gray-500">Asset</p>
                      <p className="text-gray-700 font-medium">{issue.assetType} — {issue.room}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-700 font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="text-center text-gray-400 text-sm mt-3">
                  {expandedIssueId === issue._id ? '▼ Click to collapse' : '▶ Click to expand'}
                </div>
              </div>

              {/* EXPANDED VIEW */}
              {expandedIssueId === issue._id && expandedIssueDetails && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Full Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Full Description</h3>
                    <p className="text-gray-700 leading-relaxed">{expandedIssueDetails.description}</p>
                  </div>

                  {/* Asset Details */}
                  {expandedIssueDetails.category === 'asset' && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                      <p className="font-semibold text-amber-800 mb-2">Asset Details</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-amber-700">
                        <span>Type: <strong>{expandedIssueDetails.assetType}</strong></span>
                        <span>Block: <strong>{expandedIssueDetails.block}</strong></span>
                        <span>Room: <strong>{expandedIssueDetails.room}</strong></span>
                        <span>Qty: <strong>{expandedIssueDetails.quantity}</strong> ({expandedIssueDetails.issueType})</span>
                      </div>
                    </div>
                  )}

                  {/* Academic Details */}
                  {expandedIssueDetails.category === 'academic' && (
                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-sm">
                      <p className="font-semibold text-indigo-800 mb-1">Subject: {expandedIssueDetails.subject}</p>
                      {expandedIssueDetails.facultyName && <p className="text-indigo-700">Faculty: {expandedIssueDetails.facultyName}</p>}
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-1">Reported By</p>
                      <p className="text-gray-900">{expandedIssueDetails.createdBy?.name || '—'}</p>
                      <p className="text-gray-600 text-sm">{expandedIssueDetails.createdBy?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold mb-1">Created</p>
                      <p className="text-gray-700">{new Date(expandedIssueDetails.createdAt).toLocaleString()}</p>
                    </div>
                    {expandedIssueDetails.resolvedAt && (
                      <div>
                        <p className="text-gray-500 text-xs font-semibold mb-1">Resolved At</p>
                        <p className="text-emerald-600">{new Date(expandedIssueDetails.resolvedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isReadOnly && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {expandedIssueDetails.status === 'open' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'in-progress'); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                          → In Progress
                        </button>
                      )}
                      {expandedIssueDetails.status !== 'resolved' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(issue._id, 'resolved'); }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                          ✓ Resolve
                        </button>
                      )}
                    </div>
                  )}

                  {/* Assign To */}
                  <div className="mb-6">
                    <p className="text-gray-500 text-xs font-semibold mb-2">Assign To</p>
                    <select
                      value={expandedIssueDetails.assignedTo?._id || expandedIssueDetails.assignedTo || ''}
                      onChange={(e) => handleAssign(issue._id, e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                        isReadOnly
                          ? 'bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Proof Section */}
                  <div className="border-t border-gray-300 pt-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Proof</h3>
                    {expandedIssueDetails.proofImage ? (
                      <img
                        src={`${API_BASE}/${expandedIssueDetails.proofImage}`}
                        alt="Issue proof"
                        className="w-full max-w-md rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.open(`${API_BASE}/${expandedIssueDetails.proofImage}`, '_blank')}
                      />
                    ) : (
                      <p className="text-gray-500 text-sm italic">No proof uploaded</p>
                    )}

                    {/* Upload resolution proof (when resolved and no proof yet) */}
                    {!isReadOnly && expandedIssueDetails.status === 'resolved' && !expandedIssueDetails.proofImage && (
                      <div className="mt-4 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setResolutionProof(prev => ({ ...prev, [issue._id]: e.target.files?.[0] || null }))}
                          className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none file:mr-3 file:py-1 file:bg-blue-600 file:text-white file:rounded file:border-0 file:cursor-pointer"
                        />
                        <button
                          onClick={() => handleUploadResolutionProof(issue._id)}
                          disabled={!resolutionProof[issue._id] || uploadingProof[issue._id]}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                        >
                          {uploadingProof[issue._id] ? 'Uploading…' : 'Upload Proof'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-gray-300 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Comments ({expandedIssueDetails.comments?.length || 0})
                    </h3>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {expandedIssueDetails.comments && expandedIssueDetails.comments.length > 0 ? (
                        expandedIssueDetails.comments.map((c, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-blue-600 text-xs font-semibold mb-1">{c.user?.name || 'User'}</p>
                            <p className="text-gray-700 text-sm">{c.text}</p>
                            <p className="text-gray-500 text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No comments yet</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[issue._id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [issue._id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(issue._id)}
                      />
                      <button
                        onClick={() => handleAddComment(issue._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Collapse Button */}
                  <button
                    onClick={() => toggleExpandCard(issue._id)}
                    className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-all font-semibold"
                  >
                    ▲ Collapse
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageIssues;
