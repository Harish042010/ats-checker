import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiBadgeCheck,
  HiChartBar,
  HiCheckCircle,
  HiClipboardList,
  HiDocumentText,
  HiExclamation,
  HiLightBulb,
  HiRefresh,
  HiUpload,
} from 'react-icons/hi'
import api from '../services/api'

function scoreTone(score) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-rose-700 bg-rose-50 border-rose-200'
}

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-200 dark:text-gray-800" />
        <circle
          cx="64"
          cy="64"
          r="54"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-950 dark:text-white">{score}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">ATS Score</span>
      </div>
    </div>
  )
}

function ChipList({ items, empty, tone = 'gray' }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
    red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900',
    blue: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900',
    gray: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }[tone]

  if (!items?.length) return <p className="text-sm text-gray-500 dark:text-gray-400">{empty}</p>

  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 18).map((item) => (
        <span key={item} className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

export default function ATSChecker() {
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const canAnalyze = useMemo(() => Boolean(resumeFile || resumeText.trim()), [resumeFile, resumeText])

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      toast.error('Upload a PDF or DOCX resume')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume must be under 5 MB')
      return
    }
    setResumeFile(file)
  }

  async function analyze() {
    if (!canAnalyze) {
      toast.error('Upload a resume or paste resume text first')
      return
    }

    const formData = new FormData()
    if (resumeFile) formData.append('resume', resumeFile)
    formData.append('resumeText', resumeText)
    formData.append('jdText', jdText)
    formData.append('jobTitle', jobTitle)
    formData.append('company', company)

    setLoading(true)
    try {
      const { data } = await api.post('/direct-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      setResult(data)
      toast.success('ATS analysis complete')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResumeFile(null)
    setResumeText('')
    setJdText('')
    setJobTitle('')
    setCompany('')
    setResult(null)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 md:grid-cols-[420px_1fr] md:px-6 lg:px-8">
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">ResumeLens AI</p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal">ATS Resume Checker</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Upload your resume and get a practical ATS score. Add a JD only when you want role-fit gaps.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <HiUpload className="text-lg text-sky-600" />
              Resume file
            </label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-gray-700 dark:bg-gray-950 dark:file:bg-gray-100 dark:file:text-gray-950"
            />
            {resumeFile && (
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HiDocumentText className="text-lg" />
                {resumeFile.name}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="mb-2 block text-sm font-semibold">Or paste resume text</label>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={8}
              placeholder="Paste resume text here if you do not want to upload a file."
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Job title <span className="font-normal text-gray-500">(optional)</span></label>
                <input
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Software Engineer"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Company</label>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
                />
              </div>
            </div>
            <label className="mb-2 mt-4 block text-sm font-semibold">Job description <span className="font-normal text-gray-500">(optional)</span></label>
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              rows={10}
              placeholder="Optional: paste a job description to compare this resume against a specific role."
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={analyze}
              disabled={!canAnalyze || loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              <HiChartBar className="text-lg" />
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              title="Reset"
            >
              <HiRefresh className="text-lg" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {!result ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="max-w-md">
                <HiClipboardList className="mx-auto text-5xl text-sky-600" />
                <h2 className="mt-4 text-2xl font-bold">Your analysis appears here</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  The checker combines local ATS rules with the ML service when it is running on port 5001.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={`rounded-lg border p-5 shadow-sm ${scoreTone(result.score)} dark:bg-gray-900 dark:border-gray-800`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <ScoreRing score={result.score} />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-bold uppercase tracking-wide dark:bg-gray-950/60">
                        {result.source === 'local-engine-and-ml-service' ? 'ML assisted' : 'Local engine'}
                      </span>
                      {result.mlScore !== null && (
                        <span className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-bold uppercase tracking-wide dark:bg-gray-950/60">
                          ML {result.mlScore}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-2xl font-bold">
                      {result.mode === 'resume-only' ? 'Whole resume ATS score' : `Resume fit for ${jobTitle || result.job.title}`}
                    </h2>
                    <p className="mt-2 text-sm leading-6">
                      {result.mode === 'resume-only'
                        ? `${result.resume.extractedSkills.length} skills extracted, with ${result.resume.wordCount} resume words analyzed.`
                        : `Matched ${result.matchedSkills.length} skills, missing ${result.missingSkills.length}, with ${result.resume.wordCount} resume words analyzed.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {Object.entries(result.categoryScores).map(([name, value]) => (
                  <div key={name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{name.replace(/([A-Z])/g, ' $1')}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <span className="text-2xl font-bold">{value}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><HiCheckCircle className="text-emerald-500" /> {result.mode === 'resume-only' ? 'Extracted skills' : 'Matched skills'}</h3>
                  <ChipList items={result.matchedSkills} empty="No skills found yet." tone="green" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><HiExclamation className="text-rose-500" /> {result.mode === 'resume-only' ? 'ATS gaps' : 'Missing skills'}</h3>
                  <ChipList items={result.missingSkills} empty={result.mode === 'resume-only' ? 'No JD gaps because resume-only analysis is active.' : 'No missing skills from the extracted JD skills.'} tone="red" />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><HiBadgeCheck className="text-sky-500" /> Matched keywords</h3>
                  <ChipList items={result.matchedKeywords} empty="No matched keywords found." tone="blue" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><HiLightBulb className="text-amber-500" /> Recommendations</h3>
                  <ul className="space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                    {result.recommendations.map((item) => (
                      <li key={item} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
