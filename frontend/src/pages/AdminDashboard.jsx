import React, { useState, useEffect } from 'react'
import { getAdminStats } from '../services/resumeService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatCard from '../components/ui/StatCard'
import { HiUsers, HiClipboardList, HiDocumentText, HiChartBar } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const roleBadge = (role) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    moderator: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  }
  return styles[role] || styles.user
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminStats()
      setStats(data.stats || data)
      setRecentUsers(data.recentUsers || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="section-title mb-2">Something went wrong</h2>
          <p className="section-subtitle mb-4">{error}</p>
          <button onClick={fetchStats} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const systemStats = [
    { name: 'Total Analyses', value: stats?.totalAnalyses ?? 0 },
    { name: 'Max Score', value: stats?.maxScore ?? 0 },
    { name: 'Min Score', value: stats?.minScore ?? 0 },
  ]

  const chartData = stats?.usageOverTime || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Admin Dashboard</h1>
        <p className="section-subtitle">System-wide overview and management</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={HiUsers}
          color="primary"
        />
        <StatCard
          title="Total Reports"
          value={stats?.totalReports ?? 0}
          icon={HiClipboardList}
          color="accent"
        />
        <StatCard
          title="Total Resumes"
          value={stats?.totalResumes ?? 0}
          icon={HiDocumentText}
          color="green"
        />
        <StatCard
          title="Average Score"
          value={stats?.averageScore ?? 0}
          icon={HiChartBar}
          color="purple"
          subtitle="across all analyses"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="card p-5">
        <h2 className="section-title mb-4">System Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {systemStats.map((stat) => (
            <div key={stat.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="section-title mb-4">System Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
              />
              <Bar dataKey="analyses" fill="#6366f1" radius={[4, 4, 0, 0]} name="Analyses" />
              <Bar dataKey="users" fill="#22c55e" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="card p-5">
        <h2 className="section-title mb-4">Recent Users</h2>
        {recentUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Joined</th>
                  <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2 text-gray-800 dark:text-gray-200 font-medium">{user.name}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="btn-secondary text-xs py-1.5 px-3">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No users registered yet.</p>
        )}
      </motion.div>
    </motion.div>
  )
}
