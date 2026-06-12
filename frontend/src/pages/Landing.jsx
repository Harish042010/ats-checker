import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { HiChartBar, HiUpload, HiDocumentText, HiShieldCheck, HiSun, HiMoon } from 'react-icons/hi'
import { motion } from 'framer-motion'

export default function Landing() {
  const { user } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (user) navigate('/dashboard', { replace: true })

  const features = [
    { icon: HiUpload, title: 'Resume Upload', desc: 'Upload PDF & DOCX resumes with drag-and-drop' },
    { icon: HiDocumentText, title: 'Job Description', desc: 'Paste or upload job descriptions for matching' },
    { icon: HiChartBar, title: 'ATS Scoring', desc: 'Get detailed ATS compatibility scores out of 100' },
    { icon: HiShieldCheck, title: 'AI Analysis', desc: 'AI-powered recommendations to improve your resume' },
  ]

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950">
      <header className="fixed top-0 w-full glass z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RL</span>
            </div>
            <span className="font-bold text-xl gradient-text">ResumeLens AI</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">Login</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4">
          <motion.div className="max-w-4xl mx-auto text-center" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              AI-Powered ATS Resume Analysis
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Land More{' '}
              <span className="gradient-text">Interviews</span>
              <br />With AI-Optimized Resumes
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Upload your resume, paste a job description, and get instant ATS compatibility scores with AI-powered suggestions to help you stand out.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">Start Free Analysis</Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-3">Sign In</Link>
            </motion.div>
          </motion.div>
        </section>

        <section className="py-20 px-4 bg-white dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Everything You Need to Ace the ATS
            </motion.h2>
            <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {features.map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={i} variants={itemVariants} className="card-hover text-center p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works
            </motion.h2>
            <motion.div className="grid md:grid-cols-3 gap-8 mt-12" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {[
                { step: '01', title: 'Upload Resume', desc: 'Upload your resume in PDF or DOCX format' },
                { step: '02', title: 'Add Job Description', desc: 'Paste the job description you\'re targeting' },
                { step: '03', title: 'Get ATS Score', desc: 'Receive detailed analysis and AI recommendations' },
              ].map(({ step, title, desc }, i) => (
                <motion.div key={i} variants={itemVariants} className="relative">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-600">
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-br from-primary-900 to-accent-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-4">
              Ready to Optimize Your Resume?
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-primary-200 mb-8">
              Join thousands of job seekers who landed their dream jobs with ResumeLens AI.
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link to="/register" className="inline-flex bg-white text-primary-900 font-semibold px-8 py-3 rounded-xl text-lg hover:bg-primary-50 transition-all shadow-xl">
                Get Started Free
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ResumeLens AI. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
