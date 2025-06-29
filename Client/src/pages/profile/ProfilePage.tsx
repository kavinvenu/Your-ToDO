import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Calendar, Edit3, Save, X, MapPin, Globe, Github, Chrome, Shield, Clock, Activity } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUser } from '../../store';

const ProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    timezone: 'UTC',
  });
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  const defaultAvatar = 'https://cdn.jsdelivr.net/gh/identicons/jdenticon@3.1.1/svg/user.svg'; // Place this image in your public folder

  useEffect(() => {
    console.log('ProfilePage user:', user);
    if (!user || Object.keys(user).length === 0) {
      console.warn('ProfilePage: user is empty or missing fields:', user);
    }
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        timezone: user.timezone || 'UTC',
      });
    }
  }, [user]);

  useEffect(() => {
    // On mount, if token exists in localStorage but Redux user is null, fetch user
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(fetchUser());
    }
  }, [dispatch, user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // Only send non-empty fields to the backend
      const updatePayload: any = { name: formData.name.trim() };
      if (formData.bio && formData.bio.trim()) updatePayload.bio = formData.bio.trim();
      if (formData.location && formData.location.trim()) updatePayload.location = formData.location.trim();
      if (formData.website && formData.website.trim()) updatePayload.website = formData.website.trim();
      if (formData.timezone && formData.timezone.trim()) updatePayload.timezone = formData.timezone.trim();
      const updatedUser = await api.updateUserProfile(updatePayload);
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
      dispatch({ type: 'auth/setUser', payload: updatedUser });
      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        bio: updatedUser.bio || '',
        location: updatedUser.location || '',
        website: updatedUser.website || '',
        timezone: updatedUser.timezone || 'UTC',
      });
      dispatch(fetchUser());
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      timezone: user?.timezone || 'UTC',
    });
    setIsEditing(false);
  };

  const getOAuthProviderIcon = () => {
    switch (user?.oauthProvider) {
      case 'google':
        return <Chrome className="w-4 h-4 text-red-500" />;
      case 'github':
        return <Github className="w-4 h-4 text-gray-800 dark:text-gray-200" />;
      default:
        return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const getOAuthProviderName = () => {
    switch (user?.oauthProvider) {
      case 'google':
        return 'Google';
      case 'github':
        return 'GitHub';
      default:
        return 'Email/Password';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvatarUrl = () => {
    return defaultAvatar;
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to view your profile
            </h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={getAvatarUrl()}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).src = defaultAvatar;
                  }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-blue-100">{user.email}</p>
                <div className="flex items-center mt-2">
                  {getOAuthProviderIcon()}
                  <span className="text-blue-100 ml-2 text-sm">
                    Connected via {getOAuthProviderName()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    {user.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  {user.email}
                  {user.isVerified && (
                    <span className="ml-2 text-green-600 dark:text-green-400 text-sm">✓ Verified</span>
                  )}
                </p>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg min-h-[3rem]">
                    {user.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your location..."
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    {user.location || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://your-website.com"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    {user.website ? (
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                        {user.website}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Member Since
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              {/* Last Login */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Last Login
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </p>
              </div>
            </div>

            {/* OAuth Information */}
            {user.oauthProvider && user.oauthData && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  OAuth Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Provider</p>
                      <p className="text-gray-900 dark:text-white">{getOAuthProviderName()}</p>
                    </div>
                    {user.oauthProvider === 'google' && user.oauthData.google && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Google ID</p>
                          <p className="text-gray-900 dark:text-white">{user.oauthData.google.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Verified</p>
                          <p className="text-gray-900 dark:text-white">
                            {user.oauthData.google.verified_email ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </>
                    )}
                    {user.oauthProvider === 'github' && user.oauthData.github && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Username</p>
                          <p className="text-gray-900 dark:text-white">{user.oauthData.github.login}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Bio</p>
                          <p className="text-gray-900 dark:text-white">{user.oauthData.github.bio || 'No bio'}</p>
                        </div>
                        {user.oauthData.github.company && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</p>
                            <p className="text-gray-900 dark:text-white">{user.oauthData.github.company}</p>
                          </div>
                        )}
                        {user.oauthData.github.blog && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Blog</p>
                            <a href={user.oauthData.github.blog} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {user.oauthData.github.blog}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => {/* TODO: Implement change password */}}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                >
                  Change Password
                </button>
                <button
                  onClick={() => {/* TODO: Implement delete account */}}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete Account
                </button>
                <button
                  onClick={() => {/* TODO: Implement logout */}}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;