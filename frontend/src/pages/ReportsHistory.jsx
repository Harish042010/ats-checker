import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getReports } from '../services/resumeService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { HiDocumentReport, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { motion } from 'framer-motion'

const ReportsHistory = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const limit = 9

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        const data = await getReports(page, limit)
        setReports(data.reports || [])
        setTotalPages(data.totalPages || 1)
      } catch {
        setReports([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [page])

  const filteredReports = reports.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getScoreBadgeClass = (score) => {
    if (score < 40) return 'badge-red'
    if (score < 60) return 'badge-orange'
    if (score < 80) return 'badge-yellow'
    return 'badge-green'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="reports-history">
      <div className="reports-header">
        <h1 className="reports-title">Reports History</h1>
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="empty-state">
          <HiDocumentReport size={64} />
          <h2>No reports found</h2>
          <p>
            {searchTerm
              ? 'No reports match your search criteria.'
              : 'Upload a resume and run an analysis to see your reports here.'}
          </p>
          {!searchTerm && (
            <Link to="/upload" className="btn-primary">
              Upload Resume
            </Link>
          )}
        </div>
      ) : (
        <>
          <motion.div
            className="reports-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredReports.map((report) => {
              const score = report.overallScore ?? report.overall_score ?? 0
              const matchPct = report.matchPercentage ?? report.match_percentage ?? 0
              const date = report.createdAt ?? report.created_at ?? ''

              return (
                <motion.div key={report._id ?? report.id} variants={itemVariants}>
                  <Link to={`/analysis/${report._id ?? report.id}`} className="card card-hover report-card">
                    <div className="report-card-header">
                      <h3 className="report-card-title">{report.title}</h3>
                      <span className={`score-badge ${getScoreBadgeClass(score)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="report-card-body">
                      <div className="report-detail">
                        <span className="detail-label">Resume</span>
                        <span className="detail-value">{report.resumeName ?? report.resume_name ?? '-'}</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-label">Job Title</span>
                        <span className="detail-value">{report.jobTitle ?? report.job_title ?? '-'}</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-label">Company</span>
                        <span className="detail-value">{report.company ?? '-'}</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-label">Match</span>
                        <span className="detail-value">{matchPct}%</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">
                          {date ? new Date(date).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="pagination">
            <button
              className="btn-secondary pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <HiChevronLeft /> Previous
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-number ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="btn-secondary pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next <HiChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsHistory
