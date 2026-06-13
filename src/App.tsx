import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from '@/layouts/MainLayout'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const DataCenter = lazy(() => import('@/pages/DataCenter'))
const ScheduleManagement = lazy(() => import('@/pages/ScheduleManagement'))
const CoachManagement = lazy(() => import('@/pages/CoachManagement'))
const SafetyMonitoring = lazy(() => import('@/pages/SafetyMonitoring'))
const DeviceManagement = lazy(() => import('@/pages/DeviceManagement'))
const Statistics = lazy(() => import('@/pages/Statistics'))

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
        } />
        <Route path="data-center" element={
          <Suspense fallback={<LoadingFallback />}><DataCenter /></Suspense>
        } />
        <Route path="schedule" element={
          <Suspense fallback={<LoadingFallback />}><ScheduleManagement /></Suspense>
        } />
        <Route path="coach" element={
          <Suspense fallback={<LoadingFallback />}><CoachManagement /></Suspense>
        } />
        <Route path="safety" element={
          <Suspense fallback={<LoadingFallback />}><SafetyMonitoring /></Suspense>
        } />
        <Route path="device" element={
          <Suspense fallback={<LoadingFallback />}><DeviceManagement /></Suspense>
        } />
        <Route path="statistics" element={
          <Suspense fallback={<LoadingFallback />}><Statistics /></Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default App
