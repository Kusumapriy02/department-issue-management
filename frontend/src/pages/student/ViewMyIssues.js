import React, { useState, useEffect } from 'react';
import { issueAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORY_LABELS = {
  asset: 'Asset',
  infrastructure: 'Infrastructure',
  academic: 'Academic',
  conduct: 'Conduct',
  general: 'General',
};

const ViewMyIssues = ({ onBack }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await issueAPI.getMyIssues(params);
      setIssues(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText.trim()) return;
    try {
      await issueAPI.addComment(issueId, { text: commentText });
      setCommentText('');
      fetchIssues();
      const response = await issueAPI.getIssueById(issueId);
      setSelectedIssue(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (priority) => {
    const labels = { low: 'Low', normal: 'Normal', high: 'High' };
    return labels[priority] || priority;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Issues</h1>
          <p className="text-gray-500 text-sm">Track and manage your reported issues</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Resolved', value: 'resolved' },
        ].map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilterStatus(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === btn.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {btn.label}{btn.value === '' ? ` (${issues.length})` : ''}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-500 mt-3 text-sm font-medium">Loading issues...</p>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500 text-lg">No issues found</p>
          <p className="text-gray-400 text-sm mt-2">Try reporting a new issue from the dashboard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map(issue => (
            <div
              key={issue._id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* Title and Badges */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{issue.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{issue.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                  <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(issue.priority)}`}>
                    {getPriorityLabel(issue.priority)}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-200 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Category</p>
                  <p className="text-gray-900 font-medium mt-1">{CATEGORY_LABELS[issue.category] || issue.category}</p>
                </div>
                {issue.category === 'asset' && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Asset</p>
                    <p className="text-gray-900 font-medium mt-1">{issue.assetType} — {issue.block}, {issue.room}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-xs font-medium">Created</p>
                  <p className="text-gray-900 font-medium mt-1">{new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Comments</p>
                  <p className="text-gray-900 font-medium mt-1">{issue.comments?.length || 0}</p>
                </div>
              </div>

              {/* Proof Preview */}
              {issue.proofImage && (
                <div className="mb-4">
                  <div className="relative group inline-block">
                    <img
                      src={`${API_BASE}/${issue.proofImage}`}
                      alt="Proof"
                      className="h-16 w-16 object-cover rounded-lg border border-gray-300"
                    />
                    <span className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-tl">📸</span>
                  </div>
                </div>
              )}

              {/* View Details Button */}
              <button
                onClick={() => {
                  issueAPI.getIssueById(issue._id).then(res => setSelectedIssue(res.data.data)).catch(() => setSelectedIssue(issue));
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Details & Add Comments →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{selectedIssue.title}</h2>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4">{selectedIssue.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                  {getStatusLabel(selectedIssue.status)}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Priority</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedIssue.priority)}`}>
                  {getPriorityLabel(selectedIssue.priority)}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Category</p>
                <p className="text-gray-900 text-sm font-medium">{CATEGORY_LABELS[selectedIssue.category] || selectedIssue.category}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Created</p>
                <p className="text-gray-900 text-sm font-medium">{new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Asset Details (if applicable) */}
            {selectedIssue.category === 'asset' && (
              <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                <p className="font-semibold text-amber-800 mb-2">Asset Details</p>
                <div className="grid grid-cols-2 gap-2 text-amber-700">
                  <span>Type: <strong>{selectedIssue.assetType}</strong></span>
                  <span>Block: <strong>{selectedIssue.block}</strong></span>
                  <span>Room: <strong>{selectedIssue.room}</strong></span>
                  <span>Qty: <strong>{selectedIssue.quantity}</strong> ({selectedIssue.issueType})</span>
                </div>
              </div>
            )}

            {/* Academic Details (if applicable) */}
            {selectedIssue.category === 'academic' && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                <p className="font-semibold text-blue-800 mb-1">Subject: {selectedIssue.subject}</p>
                {selectedIssue.facultyName && <p className="text-blue-700">Faculty: {selectedIssue.facultyName}</p>}
              </div>
            )}

            {/* Assigned To */}
            {selectedIssue.assignedTo && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-500 text-xs font-medium mb-1">Assigned To</p>
                <p className="text-blue-700 font-medium">{selectedIssue.assignedTo?.name || 'Assigned'}</p>
              </div>
            )}

            {/* Proof */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Proof</h4>
              {selectedIssue.proofImage ? (
                <img
                  src={`${API_BASE}/${selectedIssue.proofImage}`}
                  alt="Issue proof"
                  className="w-full max-h-40 object-cover rounded-lg border border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => window.open(`${API_BASE}/${selectedIssue.proofImage}`, '_blank')}
                />
              ) : (
                <p className="text-gray-500 text-sm italic py-4">No proof uploaded</p>
              )}
            </div>

            {/* Comments */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Comments ({selectedIssue.comments?.length || 0})</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                  selectedIssue.comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p className="font-medium text-gray-900">{comment.user?.name || 'User'}</p>
                      <p className="text-gray-700 mt-1">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-4">No comments yet</p>
                )}
              </div>

              {selectedIssue.status !== 'resolved' && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedIssue._id)}
                  />
                  <button
                    onClick={() => handleAddComment(selectedIssue._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedIssue(null)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMyIssues;
