import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../services/api';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [allIssues, setAllIssues] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchAllIssues();
  }, [statusFilter, priorityFilter]);

  const fetchAllIssues = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const response = await issueAPI.getAllIssues(params);
      setIssues(response.data.data);
      
      // Fetch all issues for stats calculation
      if (!statusFilter && !priorityFilter) {
        setAllIssues(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const dataSet = (statusFilter || priorityFilter) ? issues : allIssues;
    return {
      total: dataSet.length,
      open: dataSet.filter(i => i.status === 'Open').length,
      inProgress: dataSet.filter(i => i.status === 'In Progress').length,
      resolved: dataSet.filter(i => i.status === 'Resolved').length,
    };
  };

  const stats = calculateStats();

  const getPriorityColor = (priority) => {
    const colors = {
      Minor: 'bg-green-500/20 text-green-300 border-green-500/30',
      Normal: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      Important: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      Urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-300';
  };

  const handleResolveIssue = async (issueId) => {
    try {
      await issueAPI.updateIssueStatus(issueId, { status: 'Resolved' });
      setError('');
      await fetchAllIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve issue');
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText.trim()) return;
    
    try {
      await issueAPI.addComment(issueId, { comment: commentText });
      setCommentText('');
      await fetchAllIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">HOD Dashboard</h1>
          <p className="text-gray-500">View and manage all department issues</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Overview Statistics */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Issues Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Total Issues</p>
                  <p className="text-gray-900 text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <span className="text-4xl opacity-40">📋</span>
              </div>
            </div>

            {/* Open Issues Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Open Issues</p>
                  <p className="text-gray-900 text-3xl font-bold mt-1">{stats.open}</p>
                </div>
                <span className="text-4xl opacity-40">🔴</span>
              </div>
            </div>

            {/* In Progress Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">In Progress</p>
                  <p className="text-gray-900 text-3xl font-bold mt-1">{stats.inProgress}</p>
                </div>
                <span className="text-4xl opacity-40">⏳</span>
              </div>
            </div>

            {/* Resolved Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Resolved</p>
                  <p className="text-gray-900 text-3xl font-bold mt-1">{stats.resolved}</p>
                </div>
                <span className="text-4xl opacity-40">✓</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Issues</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">By Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">By Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="Important">Important</option>
                <option value="Normal">Normal</option>
                <option value="Minor">Minor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No issues found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                {/* Issue Header - Clean Layout */}
                <div className="mb-4">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">{issue.title}</h3>
                  </div>
                  
                  {/* Short Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{issue.description}</p>
                  
                  {/* Quick Info Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      issue.status === 'Open' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      issue.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      'bg-green-500/20 text-green-300 border-green-500/30'
                    }`}>
                      {issue.status}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-300 capitalize">
                      {issue.category}
                    </span>
                    {issue.classroomId && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">
                        {issue.classroomId.department} - Y{issue.classroomId.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  {issue.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolveIssue(issue._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      ✓ Resolve
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedIssueId(expandedIssueId === issue._id ? null : issue._id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all duration-300"
                  >
                    {expandedIssueId === issue._id ? '▼ Comments' : '▶ Comments'}
                  </button>
                </div>

                {/* Comments Section */}
                {expandedIssueId === issue._id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {/* Existing Comments */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Responses ({issue.comments?.length || 0})</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {issue.comments && issue.comments.length > 0 ? (
                          issue.comments.map((comment, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-700 font-semibold mb-1">
                                {comment.user?.name || 'Unknown'} • {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-gray-700 text-sm">{comment.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No comments yet</p>
                        )}
                      </div>
                    </div>

                    {/* Add Comment Form */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Add Response</label>
                      <div className="flex gap-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add your response..."
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                        <button
                          onClick={() => handleAddComment(issue._id)}
                          disabled={!commentText.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
