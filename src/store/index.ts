import { create } from 'zustand'
import type {
  Slope, Device, Coach, Student, CourseBooking, VisitorLocation, DensityAlert,
  RescueRecord, Rescuer, WorkOrder, SparePart, RepairTeam, StatisticsDaily,
  ScheduleTask, WeatherForecast, VisitorForecast, MapHeatPoint, Notification
} from '@/types'
import {
  mockWeather, mockVisitorForecast, mockSlopes, mockDevices, mockCoaches, mockStudents,
  mockBookings, mockVisitorLocations, mockDensityAlerts, mockRescueRecords, mockRescuers,
  mockRepairTeams, mockWorkOrders, mockSpareParts, mockStatistics, mockScheduleTasks,
  mockHeatPoints, mockNotifications
} from '@/mock'

interface AppState {
  weather: WeatherForecast[]
  visitorForecast: VisitorForecast[]
  slopes: Slope[]
  devices: Device[]
  coaches: Coach[]
  students: Student[]
  bookings: CourseBooking[]
  visitorLocations: VisitorLocation[]
  densityAlerts: DensityAlert[]
  rescueRecords: RescueRecord[]
  rescuers: Rescuer[]
  workOrders: WorkOrder[]
  spareParts: SparePart[]
  repairTeams: RepairTeam[]
  statistics: StatisticsDaily[]
  scheduleTasks: ScheduleTask[]
  heatPoints: MapHeatPoint[]
  notifications: Notification[]
  currentUser: { name: string; role: string; avatar: string }
  unreadCount: number

  setCurrentUser: (user: { name: string; role: string; avatar: string }) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void

  updateBookingApproval: (id: string, approvalStatus: 'approved' | 'rejected', status?: string) => void
  updateScheduleApproval: (id: string, approvalStatus: 'approved' | 'rejected') => void
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  updateRescueRecord: (id: string, updates: Partial<RescueRecord>) => void
  assignRescuers: (rescueId: string, rescuerIds: string[]) => void
  pushScheduleToTerminal: (scheduleId: string) => boolean
  addBooking: (booking: Omit<CourseBooking, 'id'>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  weather: mockWeather,
  visitorForecast: mockVisitorForecast,
  slopes: mockSlopes,
  devices: mockDevices,
  coaches: mockCoaches,
  students: mockStudents,
  bookings: mockBookings,
  visitorLocations: mockVisitorLocations,
  densityAlerts: mockDensityAlerts,
  rescueRecords: mockRescueRecords,
  rescuers: mockRescuers,
  workOrders: mockWorkOrders,
  spareParts: mockSpareParts,
  repairTeams: mockRepairTeams,
  statistics: mockStatistics,
  scheduleTasks: mockScheduleTasks,
  heatPoints: mockHeatPoints,
  notifications: mockNotifications,
  currentUser: { name: '运营总监-王总', role: '系统管理员', avatar: '王' },
  unreadCount: mockNotifications.filter(n => !n.read).length,

  setCurrentUser: (user) => set({ currentUser: user }),

  markNotificationRead: (id) => set(state => {
    const notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    return { notifications, unreadCount: notifications.filter(n => !n.read).length }
  }),

  markAllNotificationsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),

  addNotification: (notification) => set(state => {
    const newNotif = {
      ...notification,
      id: 'n_' + Date.now(),
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    const notifications = [newNotif, ...state.notifications]
    return { notifications, unreadCount: notifications.filter(n => !n.read).length }
  }),

  updateBookingApproval: (id, approvalStatus, status) => set(state => ({
    bookings: state.bookings.map(b => b.id === id ? {
      ...b, approvalStatus, ...(status ? { status: status as CourseBooking['status'] } : {})
    } : b)
  })),

  updateScheduleApproval: (id, approvalStatus) => set(state => ({
    scheduleTasks: state.scheduleTasks.map(s => s.id === id ? {
      ...s,
      approvalStatus,
      approvedBy: approvalStatus === 'approved' ? get().currentUser.name : undefined,
      approvedAt: approvalStatus === 'approved' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : undefined
    } : s)
  })),

  updateWorkOrder: (id, updates) => set(state => ({
    workOrders: state.workOrders.map(w => w.id === id ? { ...w, ...updates } : w)
  })),

  updateRescueRecord: (id, updates) => set(state => ({
    rescueRecords: state.rescueRecords.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  assignRescuers: (rescueId, rescuerIds) => set(state => {
    const rescuers = get().rescuers
    const assignedRescuers = rescuers.filter(r => rescuerIds.includes(r.id))
    const records = state.rescueRecords.map(r => r.id === rescueId ? {
      ...r,
      rescuerIds,
      rescuerNames: assignedRescuers.map(r2 => r2.name),
      status: 'dispatched'
    } : r)
    const updatedRescuers = state.rescuers.map(r =>
      rescuerIds.includes(r.id) ? { ...r, status: 'on_mission' as const } : r
    )
    return { rescueRecords: records, rescuers: updatedRescuers }
  }),

  pushScheduleToTerminal: () => {
    return Math.random() > 0.05
  },

  addBooking: (booking) => set(state => ({
    bookings: [...state.bookings, { ...booking, id: 'b_' + Date.now() }]
  }))
}))
