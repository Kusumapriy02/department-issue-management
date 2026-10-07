import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labAPI } from '../../services/api';

const Labs = ({ onBack, isReadOnly = false }) => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    labName: '',
    roomNumber: '',
    numberOfSystems: '',
    department: '',
    accessories: [],
  });
  const [accessoryInput, setAccessoryInput] = useState({ name: '', quantity: '' });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const response = await labAPI.getAllLabs();
      setLabs(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch labs');
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

  const handleAddAccessory = () => {
    if (accessoryInput.name.trim() && accessoryInput.quantity) {
      setFormData(prev => ({
        ...prev,
        accessories: [
          ...prev.accessories,
          { name: accessoryInput.name, quantity: parseInt(accessoryInput.quantity) }
        ]
      }));
      setAccessoryInput({ name: '', quantity: '' });
    }
  };

  const handleRemoveAccessory = (index) => {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await labAPI.updateLab(editingId, formData);
      } else {
        await labAPI.createLab(formData);
      }
      setFormData({
        labName: '',
        roomNumber: '',
        numberOfSystems: '',
        department: '',
        accessories: [],
      });
      setEditingId(null);
      setShowForm(false);
      fetchLabs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lab');
    }
  };

  const handleEdit = (lab) => {
    setFormData({
      labName: lab.labName,
      roomNumber: lab.roomNumber,
      numberOfSystems: lab.numberOfSystems,
      department: lab.department || '',
      accessories: lab.accessories || [],
    });
    setEditingId(lab._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await labAPI.deleteLab(id);
        fetchLabs();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors">
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🖥️ Laboratory Management</h1>
          <p className="text-gray-500">Manage computer labs and equipment</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              labName: '',
              roomNumber: '',
              numberOfSystems: '',
              department: '',
              accessories: [],
            });
          }}
          disabled={isReadOnly}
          className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-all duration-300 ${
            isReadOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Lab'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {showForm && !isReadOnly && (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingId ? '✏️ Edit Lab' : '🆕 Create New Lab'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lab Name</label>
                <input
                  type="text"
                  name="labName"
                  value={formData.labName}
                  onChange={handleChange}
                  placeholder="e.g., Computer Lab 1"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., 201"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Systems</label>
                <input
                  type="number"
                  name="numberOfSystems"
                  value={formData.numberOfSystems}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Accessories</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={accessoryInput.name}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, name: e.target.value })}
                  placeholder="Accessory name"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={accessoryInput.quantity}
                  onChange={(e) => setAccessoryInput({ ...accessoryInput, quantity: e.target.value })}
                  placeholder="Qty"
                  className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAccessory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Add
                </button>
              </div>

              {formData.accessories.length > 0 && (
                <div className="space-y-2">
                  {formData.accessories.map((acc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-900">{acc.name} (Qty: {acc.quantity})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              {editingId ? '💾 Update Lab' : '➕ Create Lab'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-semibold">Loading labs...</p>
        </div>
      ) : labs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No labs found. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map(lab => (
            <div key={lab._id} className="bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{lab.labName}</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Room</p>
                    <p className="text-gray-900 font-medium">{lab.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Systems</p>
                    <p className="text-gray-900 font-medium">{lab.numberOfSystems}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">Department</p>
                    <p className="text-gray-900 font-medium">{lab.department || '—'}</p>
                  </div>
                </div>
                {lab.accessories && lab.accessories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-600 text-xs font-semibold mb-2">Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {lab.accessories.map((acc, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-300">
                          {acc.name} ({acc.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => handleEdit(lab)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lab._id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Labs;
