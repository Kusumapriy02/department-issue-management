import React, { useState, useMemo } from 'react';
import { issueAPI } from '../../services/api';
import { getRoomsForBlock, getBlocksList } from '../../config/roomsConfig';
import { ASSET_TYPES } from '../../config/assetTypesConfig';

// ──── Constants ────

const CATEGORIES = [
  { value: '', label: 'Select Category' },
  { value: 'asset', label: 'Asset Issue' },
  { value: 'infrastructure', label: 'Infrastructure Issue' },
  { value: 'academic', label: 'Academic Issue' },
  { value: 'conduct', label: 'Conduct Issue' },
  { value: 'general', label: 'General Complaint' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

// ──── Imported Constants from Shared Config ────
// ASSET_TYPES is now imported from assetTypesConfig.js (single source of truth)
const BLOCK_OPTIONS = getBlocksList();

// MODIFIED: New predefined issue types for infrastructure issues
const INFRASTRUCTURE_ISSUE_TYPES = [
  { value: 'washroom-cleanliness', label: 'Washroom Cleanliness' },
  { value: 'drinking-water', label: 'Drinking Water (RO Malfunction)' },
  { value: 'electrical-issue', label: 'Electrical Issue' },
  { value: 'classroom-cleanliness', label: 'Classroom Cleanliness' },
  { value: 'furniture-damage', label: 'Furniture Damage (Non-asset specific)' },
  { value: 'other', label: 'Other' },
];

const ISSUE_TYPES = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'maintenance', label: 'Needs Maintenance' },
];

const CATEGORY_DESCRIPTIONS = {
  asset: 'Report a damaged or malfunctioning asset in a room',
  infrastructure: 'Report a building or room-level infrastructure problem',
  academic: 'Report an academic concern (syllabus, grading, teaching)',
  conduct: 'Report a code of conduct violation or behavioral concern',
  general: 'Submit a general complaint or suggestion',
};

// ──── Initial form state ────

const INITIAL_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'normal',
  // Asset fields
  assetType: '',
  block: '',
  room: '',
  quantity: 1,
  issueType: '',
  // Infrastructure fields - MODIFIED: Added infrastructureIssueType
  infrastructureIssueType: '',
  // Academic fields
  subject: '',
  facultyName: '',
};

// ──── Component ────

const ReportIssue = ({ onBack }) => {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [proof, setProof] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { category } = formData;

  // MODIFIED: Compute available rooms based on selected block using centralized config
  const availableRooms = useMemo(() => {
    if (!formData.block) return [];
    return getRoomsForBlock(formData.block);
  }, [formData.block]);

  // ──── Handlers ────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'category') setError('');
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProof(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearProof = () => {
    setProof(null);
    setProofPreview(null);
  };

  // ──── Build payload (only relevant fields) ────

  const buildPayload = () => {
    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('category', formData.category);
    payload.append('priority', formData.priority);

    if (category === 'asset') {
      payload.append('assetType', formData.assetType);
      payload.append('block', formData.block);
      payload.append('room', formData.room.trim());
      payload.append('quantity', formData.quantity);
      payload.append('issueType', formData.issueType);
    }

    if (category === 'academic') {
      payload.append('subject', formData.subject.trim());
      if (formData.facultyName.trim()) {
        payload.append('facultyName', formData.facultyName.trim());
      }
    }

    // MODIFIED: Added infrastructure issue type to payload
    if (category === 'infrastructure') {
      payload.append('block', formData.block);
      payload.append('room', formData.room.trim());
      payload.append('infrastructureIssueType', formData.infrastructureIssueType);
    }

    if (proof) {
      payload.append('proof', proof);
    }

    return payload;
  };

  // ──── Validation ────

  const validate = () => {
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }
    if (!formData.category) {
      return 'Please select a category';
    }

    if (category === 'asset') {
      if (!formData.assetType) return 'Please select an asset type';
      if (!formData.block) return 'Please select a block';
      if (!formData.room.trim()) return 'Please enter the room number';
      if (!formData.quantity || formData.quantity < 1) return 'Quantity must be at least 1';
      if (!formData.issueType) return 'Please select an issue type (damaged/maintenance)';
    }

    // MODIFIED: Added validation for infrastructure issue type
    if (category === 'infrastructure') {
      if (!formData.block) return 'Please select a block';
      if (!formData.room.trim()) return 'Please enter the room number';
      if (!formData.infrastructureIssueType) return 'Please select an issue type';
    }

    if (category === 'academic') {
      if (!formData.subject.trim()) return 'Please enter the subject name';
    }

    return null;
  };

  // ──── Submit ────

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await issueAPI.createIssue(buildPayload());

      setSuccess('Issue reported successfully!');
      setFormData({ ...INITIAL_FORM });
      clearProof();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  // ──── Shared field styles ────

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';
  const required = <span className="text-red-500 ml-0.5">*</span>;

  // ──── Render ────

  return (
    <div className="p-8 bg-white min-h-screen">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
          <p className="text-gray-500">Select a category to see relevant fields</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200">

          {/* ═══════ SECTION 1: Title ═══════ */}
          <div className="p-6 pb-0">
            <h3 className="text-lg font-bold text-gray-900 mb-5">1. Brief Summary</h3>

            <div className="mb-5">
              <label className={labelClass}>Title {required}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary of the issue"
                minLength="5"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-b border-gray-200 mx-6 my-5" />

          {/* ═══════ SECTION 2: Category & Priority ═══════ */}
          <div className="p-6 pb-0">
            <h3 className="text-lg font-bold text-gray-900 mb-5">2. What type of issue?</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
              {/* Category */}
              <div>
                <label className={labelClass}>Category {required}</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className={labelClass}>Priority {required}</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category hint */}
            {category && (
              <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-3 mb-2 font-medium">
                ℹ️ {CATEGORY_DESCRIPTIONS[category]}
              </p>
            )}
          </div>

          {/* ═══════ SECTION 3: Issue Type (Dynamic based on category) ═══════ */}
          {category && (
            <>
              <div className="border-b border-gray-200 mx-6 my-5" />

              <div className="p-6 pb-0">
                <h3 className="text-lg font-bold text-gray-900 mb-5">3. Issue Type</h3>

                {/* Asset Issue Type */}
                {category === 'asset' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                    <div>
                      <label className={labelClass}>Asset Type {required}</label>
                      <select
                        name="assetType"
                        value={formData.assetType}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select Asset</option>
                        {ASSET_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Issue Type {required}</label>
                      <select
                        name="issueType"
                        value={formData.issueType}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select Type</option>
                        {ISSUE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Infrastructure Issue Type */}
                {category === 'infrastructure' && (
                  <div>
                    <label className={labelClass}>Issue Type {required}</label>
                    <select
                      name="infrastructureIssueType"
                      value={formData.infrastructureIssueType}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select Issue Type</option>
                      {INFRASTRUCTURE_ISSUE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Academic Category Fields */}
                {category === 'academic' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                    <div>
                      <label className={labelClass}>Subject {required}</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Data Structures"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Faculty Name <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        name="facultyName"
                        value={formData.facultyName}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Sharma"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════ SECTION 4: Location (Block & Room) ═══════ */}
          {category && (category === 'asset' || category === 'infrastructure') && (
            <>
              <div className="border-b border-gray-200 mx-6 my-5" />

              <div className="p-6 pb-0">
                <h3 className="text-lg font-bold text-gray-900 mb-5">4. Location</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-2">
                      <div>
                        <label className={labelClass}>Block {required}</label>
                        <select
                          name="block"
                          value={formData.block}
                          onChange={handleChange}
                          required
                          className={inputClass}
                        >
                          <option value="">Select Block</option>
                          {BLOCK_OPTIONS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Room {required}</label>
                        <select
                          name="room"
                          value={formData.room}
                          onChange={handleChange}
                          required
                          disabled={!formData.block}
                          className={`${inputClass} ${!formData.block ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="">Select Room</option>
                          {availableRooms.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Quantity {required}</label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          min="1"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                {/* Infrastructure: Block + Room */}
                {category === 'infrastructure' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                    <div>
                      <label className={labelClass}>Block {required}</label>
                      <select
                        name="block"
                        value={formData.block}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select Block</option>
                        {BLOCK_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Room {required}</label>
                      <select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        required
                        disabled={!formData.block}
                        className={`${inputClass} ${!formData.block ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select Room</option>
                        {availableRooms.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="border-b border-gray-200 mx-6 my-5" />

          {/* ═══════ SECTION 5: Description ═══════ */}
          <div className="p-6 pb-0">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {category && (category === 'asset' || category === 'infrastructure') ? '5. Detailed Description' : '4. Detailed Description'}
            </h3>

            <div className="mb-2">
              <label className={labelClass}>Description {required}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the issue…"
                minLength="10"
                rows="5"
                required
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="border-b border-gray-200 mx-6 my-5" />

          {/* ═══════ SECTION 6: Proof Upload ═══════ */}
          <div className="px-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {category && (category === 'asset' || category === 'infrastructure') ? '6. Upload Proof' : '5. Upload Proof'}
              <span className="text-gray-400 font-normal text-sm ml-2">(optional)</span>
            </h3>

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition file:mr-3 file:py-2 file:px-3 file:bg-blue-600 file:text-white file:rounded file:border-0 file:cursor-pointer file:font-medium hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-500 mt-2">
                {proof ? `📎 ${proof.name}` : 'Images only (JPG, PNG, GIF) • Max 5MB'}
              </p>

              {proofPreview && (
                <div className="mt-4 flex items-start gap-3">
                  <div className="w-32 h-32 border-2 border-blue-200 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearProof}
                    className="text-red-500 hover:text-red-600 text-sm font-medium mt-1"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ Submit ═══════ */}
          <div className="p-6 pt-5">
            <button
              type="submit"
              disabled={loading || !category}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? 'Submitting…' : 'Submit Issue Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
