import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import { HiUpload, HiDocumentText, HiClipboardList, HiChartBar } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#eab308';
  return '#ef4444';
};

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Poor';
};

const PIE_COLORS = ['#22c55e', '#f97316', '#eab308', '#ef4444'];

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error.message || 'Unable to load dashboard data.'}</p>
          <button
            onClick={refetch}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentReports = data?.recentReports || [];
  const topMissingKeywords = data?.topMissingKeywords || [];

  const scoreDistribution = stats?.scoreDistribution
    ? [
        { name: 'Excellent', value: stats.scoreDistribution.excellent || 0 },
        { name: 'Good', value: stats.scoreDistribution.good || 0 },
        { name: 'Average', value: stats.scoreDistribution.average || 0 },
        { name: 'Poor', value: stats.scoreDistribution.poor || 0 },
      ]
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate()}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/resume/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <HiUpload className="w-4 h-4" />
            Upload Resume
          </Link>
          <Link
            to="/jd/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <HiUpload className="w-4 h-4" />
            Upload JD
          </Link>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<HiDocumentText className="w-6 h-6" />}
          label="Total Reports"
          value={stats?.totalReports ?? 0}
        />
        <StatCard
          icon={<HiClipboardList className="w-6 h-6" />}
          label="Total Resumes"
          value={stats?.totalResumes ?? 0}
        />
        <StatCard
          icon={<HiChartBar className="w-6 h-6" />}
          label="Total JDs"
          value={stats?.totalJds ?? 0}
        />
        <StatCard
          icon={<HiChartBar className="w-6 h-6" />}
          label="Average Score"
          value={stats?.averageScore ?? 0}
          suffix="%"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Scores Over Time</h2>
          {stats?.scoresOverTime && stats.scoresOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.scoresOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No score data available yet.</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Score Distribution</h2>
          {scoreDistribution.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No distribution data available yet.</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Reports</h2>
          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.slice(0, 5).map((report) => (
                <Link
                  key={report._id}
                  to={`/report/${report._id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HiDocumentText className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {report.resumeName || 'Resume'} vs {report.jdName || 'JD'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBg(report.score)}`}>
                    {Math.round(report.score)}%
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No reports yet.</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Missing Keywords</h2>
          {topMissingKeywords.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topMissingKeywords} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="keyword" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No keyword data available yet.</p>
          )}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="card p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/resume/upload"
            className="flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <HiUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Resume</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Analyze a new resume</p>
            </div>
          </Link>
          <Link
            to="/jd/upload"
            className="flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <HiUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Job Description</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Add a new job description</p>
            </div>
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <HiDocumentText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">View Reports</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Browse all reports</p>
            </div>
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <HiChartBar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Analytics</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Deep insights and trends</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
