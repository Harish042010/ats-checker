import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getReport } from '../services/resumeService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { HiCheckCircle, HiXCircle, HiLightBulb, HiChartBar, HiDocumentText, HiClipboardList } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

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

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f97316'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (score >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Needs Improvement'
}

const SECTION_BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function AnalysisResults() {
  const { reportId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getReport(reportId)
        setReport(data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [reportId])

  if (loading) return <LoadingSpinner fullScreen />

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!report) return null

  const overallScore = report.overallScore || 0
  const matchPercentage = report.matchPercentage || report.matchPercent || 0
  const categoryScores = report.categoryScores || report.categoryScores || {}
  const matchedKeywords = report.matchedKeywords || []
  const missingKeywords = report.missingKeywords || []
  const sectionAnalysis = report.sectionAnalysis || []
  const formattingAnalysis = report.formattingAnalysis || []
  const skillAnalysis = report.skillAnalysis || {}
  const recommendations = report.recommendations || {}
  const resumeName = report.resumeName || report.resume?.name || 'Resume'
  const jobTitle = report.jobTitle || report.job?.title || 'Job Position'
  const company = report.company || report.job?.company || 'Company'
  const createdAt = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const radarData = [
    { category: 'Skills', value: categoryScores.skillMatch || 0 },
    { category: 'Keywords', value: categoryScores.keywordMatch || 0 },
    { category: 'Experience', value: categoryScores.experienceMatch || 0 },
    { category: 'Education', value: categoryScores.educationMatch || 0 },
    { category: 'Projects', value: categoryScores.projectRelevance || 0 },
    { category: 'Structure', value: categoryScores.resumeStructure || 0 },
  ]

  const score = overallScore
  const circumference = 2 * Math.PI * 90
  const offset = circumference - (score / 100) * circumference

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Analysis Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed ATS compatibility report</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="card p-6 lg:col-span-1 flex flex-col items-center justify-center">
          <h2 className="section-title text-center mb-4">ATS Score</h2>
          <div className="relative w-56 h-56">
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-50">{Math.round(score)}</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/ 100</span>
              <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getScoreBg(score)}`}>
                {getScoreLabel(score)}
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{Math.round(matchPercentage)}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Match Percentage</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6 lg:col-span-2">
          <h2 className="section-title mb-4">Category Scores</h2>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" strokeOpacity={0.3} />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiCheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="section-title">Matched Keywords</h2>
          </div>
          {matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((keyword, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  {typeof keyword === 'object' ? keyword.name || keyword.keyword : keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No matched keywords found.</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiXCircle className="w-5 h-5 text-red-500" />
            <h2 className="section-title">Missing Keywords</h2>
          </div>
          {missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((keyword, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  {typeof keyword === 'object' ? keyword.name || keyword.keyword : keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No missing keywords found.</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiChartBar className="w-5 h-5 text-indigo-500" />
            <h2 className="section-title">Section Analysis</h2>
          </div>
          {sectionAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectionAnalysis} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {sectionAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECTION_BAR_COLORS[index % SECTION_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No section analysis available.</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiClipboardList className="w-5 h-5 text-indigo-500" />
            <h2 className="section-title">Formatting Analysis</h2>
          </div>
          {formattingAnalysis.length > 0 ? (
            <div className="space-y-3">
              {formattingAnalysis.map((item, idx) => {
                const passed = typeof item === 'object' ? item.passed || item.status === 'passed' || item.valid : item.status === 'passed'
                const label = typeof item === 'object' ? item.name || item.label || item.check : item
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {passed ? (
                      <HiCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <HiXCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No formatting analysis available.</p>
          )}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiLightBulb className="w-5 h-5 text-yellow-500" />
          <h2 className="section-title">Skill Analysis</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="section-subtitle text-green-600 dark:text-green-400 mb-3">Matched Skills</h3>
            {skillAnalysis.matchedSkills && skillAnalysis.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillAnalysis.matchedSkills.map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {typeof skill === 'object' ? skill.name : skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No matched skills.</p>
            )}
          </div>
          <div>
            <h3 className="section-subtitle text-red-600 dark:text-red-400 mb-3">Missing Skills</h3>
            {skillAnalysis.missingSkills && skillAnalysis.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillAnalysis.missingSkills.map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {typeof skill === 'object' ? skill.name : skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No missing skills.</p>
            )}
          </div>
          <div>
            <h3 className="section-subtitle text-blue-600 dark:text-blue-400 mb-3">Additional Skills</h3>
            {skillAnalysis.additionalSkills && skillAnalysis.additionalSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillAnalysis.additionalSkills.map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {typeof skill === 'object' ? skill.name : skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No additional skills listed.</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiLightBulb className="w-5 h-5 text-yellow-500" />
          <h2 className="section-title">AI Recommendations</h2>
        </div>
        <div className="space-y-6">
          {recommendations.optimizationTips && recommendations.optimizationTips.length > 0 && (
            <div>
              <h3 className="section-subtitle mb-3">Optimization Tips</h3>
              <ul className="space-y-2">
                {recommendations.optimizationTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <span className="text-yellow-500 mt-0.5 shrink-0">--</span>
                    <span>{typeof tip === 'object' ? tip.text || tip.tip : tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.missingSkillsToAdd && recommendations.missingSkillsToAdd.length > 0 && (
            <div>
              <h3 className="section-subtitle mb-3">Missing Skills to Add</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.missingSkillsToAdd.map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {typeof skill === 'object' ? skill.name : skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendations.projectImprovements && recommendations.projectImprovements.length > 0 && (
            <div>
              <h3 className="section-subtitle mb-3">Project Improvements</h3>
              <ul className="space-y-2">
                {recommendations.projectImprovements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <span className="text-indigo-500 mt-0.5 shrink-0">--</span>
                    <span>{typeof improvement === 'object' ? improvement.text || improvement.suggestion : improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.summaryEnhancement && (
            <div>
              <h3 className="section-subtitle mb-3">Summary Enhancement</h3>
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{recommendations.summaryEnhancement}</p>
              </div>
            </div>
          )}

          {recommendations.interviewPrepQuestions && recommendations.interviewPrepQuestions.length > 0 && (
            <div>
              <h3 className="section-subtitle mb-3">Interview Prep Questions</h3>
              <ul className="space-y-2">
                {recommendations.interviewPrepQuestions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <span className="text-amber-500 mt-0.5 shrink-0">?</span>
                    <span>{typeof question === 'object' ? question.text || question.question : question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.atsTips && recommendations.atsTips.length > 0 && (
            <div>
              <h3 className="section-subtitle mb-3">ATS Tips</h3>
              <ul className="space-y-2">
                {recommendations.atsTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <span className="text-blue-500 mt-0.5 shrink-0">*</span>
                    <span>{typeof tip === 'object' ? tip.text || tip.tip : tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!recommendations.optimizationTips &&
            !recommendations.missingSkillsToAdd &&
            !recommendations.projectImprovements &&
            !recommendations.summaryEnhancement &&
            !recommendations.interviewPrepQuestions &&
            !recommendations.atsTips && (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No recommendations available.</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card p-6">
        <h2 className="section-title mb-4">Report Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <HiDocumentText className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Resume</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]">{resumeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <HiClipboardList className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Job Title</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]">{jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <HiChartBar className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]">{company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <HiCheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Analyzed On</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{createdAt}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
