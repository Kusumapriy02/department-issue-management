import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ChangePassword = ({ isFirstLogin = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect based on whether this is first login or regular change
      setTimeout(() => {
        if (isFirstLogin) {
          // Redirect to appropriate dashboard
          const role = user?.role;
          if (role === 'admin' || role === 'hod') {
            navigate('/admin/dashboard');
          } else if (role === 'faculty') {
            navigate('/faculty/dashboard');
          } else if (role === 'student') {
            navigate('/student/dashboard');
          }
        } else {
          // Go back to previous page or dashboard
          navigate(-1);
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
      {/* Background Accent Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl -z-10 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl -z-10 opacity-20"></div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isFirstLogin ? 'Set Your Password' : 'Change Password'}
          </h1>
          <p className="text-gray-600">
            {isFirstLogin
              ? 'Please set a new password to continue'
              : 'Update your password to keep your account secure'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* User Info Display */}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-sm">✕ Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold text-sm">✓ Success</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.currentPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.currentPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.newPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.newPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.newPassword}
                </p>
              )}
              {formData.newPassword && !validationErrors.newPassword && (
                <p className="text-green-600 text-sm mt-1">✓ Password is valid</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your new password"
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
                formData.newPassword === formData.confirmPassword &&
                !validationErrors.confirmPassword && (
                  <p className="text-green-600 text-sm mt-1">✓ Passwords match</p>
                )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Processing...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Password must be at least 6 characters long and different from your current password.
            </p>
          </div>

          {/* Skip Link (only for first login) */}
          {isFirstLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  const role = user?.role;
                  if (role === 'admin' || role === 'hod') {
                    navigate('/admin/dashboard');
                  } else if (role === 'faculty') {
                    navigate('/faculty/dashboard');
                  } else if (role === 'student') {
                    navigate('/student/dashboard');
                  }
                }}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
