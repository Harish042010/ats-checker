import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import { HiUser, HiLockClosed, HiSun, HiMoon, HiMail, HiBriefcase } from 'react-icons/hi';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      company: user?.company || '',
      jobTitle: user?.jobTitle || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: passwordRegister,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm();

  const onProfileSubmit = async (data) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await api.put('/auth/password', data);
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <motion.div
      className="min-h-screen p-6 transition-colors duration-300"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div variants={itemVariants} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <HiUser className="w-6 h-6" />
            Profile Information
          </h2>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                {...profileRegister('name', { required: 'Name is required' })}
                className="input-field"
                placeholder="Your name"
              />
              {profileErrors.name && (
                <p className="text-red-500 text-sm mt-1">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <HiMail className="w-4 h-4" />
                Email
              </label>
              <input
                {...profileRegister('email')}
                className="input-field"
                disabled
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <HiBriefcase className="w-4 h-4" />
                  Company
                </label>
                <input
                  {...profileRegister('company')}
                  className="input-field"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  {...profileRegister('jobTitle')}
                  className="input-field"
                  placeholder="Job title"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...profileRegister('phone')}
                className="input-field"
                placeholder="Phone number"
              />
            </div>

            <button
              type="submit"
              disabled={profileSubmitting}
              className="btn-primary"
            >
              {profileSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <HiLockClosed className="w-6 h-6" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                {...passwordRegister('currentPassword', { required: 'Current password is required' })}
                className="input-field"
                placeholder="Enter current password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                {...passwordRegister('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="input-field"
                placeholder="Enter new password"
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="btn-primary"
            >
              {passwordSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-6">
            {darkMode ? <HiMoon className="w-6 h-6" /> : <HiSun className="w-6 h-6" />}
            Theme Preferences
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="section-subtitle">Dark Mode</p>
              <p className="text-sm opacity-70">Toggle dark mode for the application</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                  darkMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {darkMode ? <HiMoon className="w-3.5 h-3.5 text-indigo-600" /> : <HiSun className="w-3.5 h-3.5 text-yellow-500" />}
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <HiUser className="w-6 h-6" />
            Account Information
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-opacity-20">
              <span className="font-medium">Role</span>
              <span className="capitalize">{user?.role || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-opacity-20">
              <span className="font-medium">Member Since</span>
              <span>{memberSince}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Last Login</span>
              <span>{lastLogin}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
