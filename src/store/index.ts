import { create } from 'zustand'
import type {
  Slope, Device, Coach, Student, CourseBooking, VisitorLocation, DensityAlert,
  RescueRecord, Rescuer, WorkOrder, SparePart, RepairTeam, StatisticsDaily,
  ScheduleTask, WeatherForecast, VisitorForecast, MapHeatPoint, Notification,
  SnowMakingPlan, GroomingPlan, CableCarPlan
} from '@/types'
import {
  mockWeather, mockVisitorForecast, mockSlopes, mockDevices, mockCoaches, mockStudents,
  mockBookings, mockVisitorLocations, mockDensityAlerts, mockRescueRecords, mockRescuers,
  mockRepairTeams, mockWorkOrders, mockSpareParts, mockStatistics, mockScheduleTasks,
  mockHeatPoints, mockNotifications
} from '@/mock'
import dayjs from 'dayjs'

const uid = () => Math.random().toString(36).slice(2, 10)

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
  updateBooking: (id: string, updates: Partial<CourseBooking>) => void
  addBooking: (booking: Omit<CourseBooking, 'id'>) => void
  rescheduleBooking: (id: string, updates: Partial<CourseBooking> & { approvalStatus?: 'approved' }) => void

  addScheduleTask: (task: Omit<ScheduleTask, 'id' | 'createdAt'>) => void
  updateScheduleApproval: (id: string, approvalStatus: 'approved' | 'rejected') => void
  pushScheduleToTerminal: (scheduleId: string) => boolean

  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createdAt'>) => void
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  assignWorkOrder: (id: string, teamId: string, teamName: string, assignee: string, scheduledDate: string) => void

  updateRescueRecord: (id: string, updates: Partial<RescueRecord>) => void
  assignRescuers: (rescueId: string, rescuerIds: string[]) => void
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

  updateBooking: (id, updates) => set(state => ({
    bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  addBooking: (booking) => set(state => ({
    bookings: [...state.bookings, { ...booking, id: 'b_' + Date.now() }]
  })),

  rescheduleBooking: (id, updates) => set(state => ({
    bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates, status: 'scheduled', approvalStatus: 'approved' } : b)
  })),

  addScheduleTask: (task) => set(state => ({
    scheduleTasks: [...state.scheduleTasks, {
      ...task,
      id: 'sch_' + task.date + '_' + Date.now().toString(36),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }]
  })),

  updateScheduleApproval: (id, approvalStatus) => set(state => ({
    scheduleTasks: state.scheduleTasks.map(s => s.id === id ? {
      ...s,
      approvalStatus,
      approvedBy: approvalStatus === 'approved' ? get().currentUser.name : undefined,
      approvedAt: approvalStatus === 'approved' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : undefined
    } : s)
  })),

  pushScheduleToTerminal: () => Math.random() > 0.05,

  addWorkOrder: (order) => set(state => ({
    workOrders: [{
      ...order,
      id: 'wo_' + Date.now().toString(36),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }, ...state.workOrders]
  })),

  updateWorkOrder: (id, updates) => set(state => ({
    workOrders: state.workOrders.map(w => w.id === id ? { ...w, ...updates } : w)
  })),

  assignWorkOrder: (id, teamId, teamName, assignee, scheduledDate) => set(state => ({
    workOrders: state.workOrders.map(w => w.id === id ? {
      ...w, status: 'assigned', teamId, teamName, assignee, scheduledDate
    } : w)
  })),

  updateRescueRecord: (id, updates) => set(state => ({
    rescueRecords: state.rescueRecords.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  assignRescuers: (rescueId, rescuerIds) => set(state => {
    const rescuersList = get().rescuers
    const assignedRescuers = rescuersList.filter(r => rescuerIds.includes(r.id))
    const records = state.rescueRecords.map(r => r.id === rescueId ? {
      ...r,
      rescuerIds,
      rescuerNames: assignedRescuers.map(r2 => r2.name),
      status: 'dispatched' as const
    } : r)
    const updatedRescuers = state.rescuers.map(r =>
      rescuerIds.includes(r.id) ? { ...r, status: 'on_mission' as const } : r
    )
    return { rescueRecords: records, rescuers: updatedRescuers }
  })
}))
