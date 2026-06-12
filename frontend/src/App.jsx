import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingSpinner from './components/ui/LoadingSpinner'

const Landing = lazy(() => import('./pages/Landing'))
const ATSChecker = lazy(() => import('./pages/ATSChecker'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'))
const JobDescriptionUpload = lazy(() => import('./pages/JobDescriptionUpload'))
const AnalysisResults = lazy(() => import('./pages/AnalysisResults'))
const ReportsHistory = lazy(() => import('./pages/ReportsHistory'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const MainLayout = lazy(() => import('./layouts/MainLayout'))

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<ATSChecker />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/resume/upload" element={<ProtectedRoute><MainLayout><ResumeUpload /></MainLayout></ProtectedRoute>} />
        <Route path="/jd/upload" element={<ProtectedRoute><MainLayout><JobDescriptionUpload /></MainLayout></ProtectedRoute>} />
        <Route path="/analysis/:reportId" element={<ProtectedRoute><MainLayout><AnalysisResults /></MainLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><MainLayout><ReportsHistory /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><MainLayout><ProfileSettings /></MainLayout></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><MainLayout><AdminDashboard /></MainLayout></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
