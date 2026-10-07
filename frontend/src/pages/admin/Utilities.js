import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utilityAPI } from '../../services/api';

const Utilities = ({ onBack, isReadOnly = false }) => {
  const navigate = useNavigate();
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    utilityName: '',
    category: '',
    location: '',
    quantity: '',
    status: 'working',
  });

  useEffect(() => {
    fetchUtilities();
  }, [filterStatus]);

  const fetchUtilities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const response = await utilityAPI.getAllUtilities(params);
      setUtilities(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch utilities');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await utilityAPI.updateUtility(editingId, formData);
      } else {
        await utilityAPI.createUtility(formData);
      }
      setFormData({
        utilityName: '',
        category: '',
        location: '',
        quantity: '',
        status: 'working',
      });
      setEditingId(null);
      setShowForm(false);
      fetchUtilities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save utility');
    }
  };

  const handleEdit = (utility) => {
    setFormData({
      utilityName: utility.utilityName,
      category: utility.category,
      location: utility.location,
      quantity: utility.quantity,
      status: utility.status,
    });
    setEditingId(utility._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await utilityAPI.deleteUtility(id);
        fetchUtilities();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      working: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      damaged: 'bg-red-500/20 text-red-300 border-red-500/30',
      maintenance: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Compute analytics
  const total = utilities.length;
  const workingCount = utilities.filter(u => u.status === 'working').length;
  const damagedCount = utilities.filter(u => u.status === 'damaged').length;
  const maintenanceCount = utilities.filter(u => u.status === 'maintenance').length;

  return (
    <div className="p-8 bg-white min-h-screen">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors">
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔧 Utilities & Resources</h1>
          <p className="text-gray-500">Track and manage all resources</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              utilityName: '',
              category: '',
              location: '',
              quantity: '',
              status: 'working',
            });
          }}
          disabled={isReadOnly}
          className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-all duration-300 whitespace-nowrap ${
            isReadOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Utility'}
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">Total</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide mb-2">Working</p>
          <p className="text-3xl font-bold text-blue-600">{workingCount}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <p className="text-red-700 text-xs font-semibold uppercase tracking-wide mb-2">Damaged</p>
          <p className="text-3xl font-bold text-red-600">{damagedCount}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <p className="text-yellow-700 text-xs font-semibold uppercase tracking-wide mb-2">Maintenance</p>
          <p className="text-3xl font-bold text-yellow-600">{maintenanceCount}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Working', value: 'working' },
          { label: 'Damaged', value: 'damaged' },
          { label: 'Maintenance', value: 'maintenance' },
        ].map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilterStatus(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              filterStatus === btn.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {showForm && !isReadOnly && (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingId ? '✏️ Edit Utility' : '🆕 Add New Utility'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Utility Name
                </label>
                <input
                  type="text"
                  name="utilityName"
                  value={formData.utilityName}
                  onChange={handleChange}
                  placeholder="e.g., Projector"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Select Category</option>
                  <option value="furniture">Furniture</option>
                  <option value="equipment">Equipment</option>
                  <option value="facilities">Facilities</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Room 101"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="working">Working</option>
                <option value="damaged">Damaged</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              {editingId ? '💾 Update Utility' : '➕ Add Utility'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4 font-semibold">Loading utilities...</p>
          </div>
        </div>
      ) : utilities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No utilities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {utilities.map(utility => (
            <div key={utility._id} className="bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{utility.utilityName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Category</p>
                      <p className="text-gray-900 font-medium capitalize">{utility.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Location</p>
                      <p className="text-gray-900 font-medium">{utility.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Quantity</p>
                      <p className="text-gray-900 font-medium">{utility.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-1 ${getStatusColor(utility.status)}`}>
                        {utility.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => handleEdit(utility)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(utility._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Utilities;
