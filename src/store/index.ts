import { create } from 'zustand'
import type {
  Slope, Device, Coach, Student, CourseBooking, VisitorLocation, DensityAlert,
  RescueRecord, Rescuer, WorkOrder, WorkOrderOperationLog, SparePart, RepairTeam, StatisticsDaily,
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

  bookingFilter: { approvalStatus?: string; status?: string; date?: string }
  workOrderFilter: { status?: string; priority?: string }

  setCurrentUser: (user: { name: string; role: string; avatar: string }) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void

  updateBookingApproval: (id: string, approvalStatus: 'approved' | 'rejected', status?: string) => void
  updateBooking: (id: string, updates: Partial<CourseBooking>) => void
  addBooking: (booking: Omit<CourseBooking, 'id'>) => void
  rescheduleBooking: (id: string, updates: Partial<CourseBooking> & { approvalStatus?: 'approved' }) => void
  setBookingFilter: (filter: { approvalStatus?: string; status?: string; date?: string }) => void

  addScheduleTask: (task: Omit<ScheduleTask, 'id' | 'createdAt'>) => void
  updateScheduleApproval: (id: string, approvalStatus: 'approved' | 'rejected') => void
  pushScheduleToTerminal: (scheduleId: string) => boolean

  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createdAt' | 'operationLogs'>) => void
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  assignWorkOrder: (id: string, teamId: string, teamName: string, assignee: string, scheduledDate: string, note?: string) => void
  startWorkOrder: (id: string, note?: string) => void
  completeWorkOrder: (id: string, actualHours: number, note?: string) => void
  addWorkOrderLog: (id: string, action: WorkOrderOperationLog['action'], operator: string, note?: string) => void
  setWorkOrderFilter: (filter: { status?: string; priority?: string }) => void

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
  bookingFilter: {},
  workOrderFilter: {},

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

  setBookingFilter: (filter) => set({ bookingFilter: filter }),

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

  addWorkOrder: (order) => set(state => {
    const currentUser = get().currentUser
    const newWo: WorkOrder = {
      ...order,
      id: 'wo_' + Date.now().toString(36),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operationLogs: [{
        id: 'log_' + Date.now(),
        action: 'created',
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: currentUser.name,
        note: '工单创建'
      }]
    }
    return { workOrders: [newWo, ...state.workOrders] }
  }),

  updateWorkOrder: (id, updates) => set(state => ({
    workOrders: state.workOrders.map(w => w.id === id ? { ...w, ...updates } : w)
  })),

  addWorkOrderLog: (id, action, operator, note) => set(state => ({
    workOrders: state.workOrders.map(w => w.id === id ? {
      ...w,
      operationLogs: [...w.operationLogs, {
        id: 'log_' + Date.now(),
        action,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator,
        note
      }]
    } : w)
  })),

  assignWorkOrder: (id, teamId, teamName, assignee, scheduledDate, note) => set(state => {
    const currentUser = get().currentUser
    return {
      workOrders: state.workOrders.map(w => w.id === id ? {
        ...w,
        status: 'assigned',
        teamId,
        teamName,
        assignee,
        scheduledDate,
        operationLogs: [...w.operationLogs, {
          id: 'log_' + Date.now(),
          action: 'assigned',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          operator: currentUser.name,
          note: note || `派单给 ${teamName}（${assignee}）`
        }]
      } : w)
    }
  }),

  startWorkOrder: (id, note) => set(state => {
    const currentUser = get().currentUser
    return {
      workOrders: state.workOrders.map(w => w.id === id ? {
        ...w,
        status: 'in_progress',
        startedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operationLogs: [...w.operationLogs, {
          id: 'log_' + Date.now(),
          action: 'started',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          operator: currentUser.name,
          note: note || '开始维修作业'
        }]
      } : w)
    }
  }),

  completeWorkOrder: (id, actualHours, note) => set(state => {
    const currentUser = get().currentUser
    return {
      workOrders: state.workOrders.map(w => w.id === id ? {
        ...w,
        status: 'completed',
        completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        actualHours,
        operationLogs: [...w.operationLogs, {
          id: 'log_' + Date.now(),
          action: 'completed',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          operator: currentUser.name,
          note: note || `维修完成，耗时 ${actualHours} 小时`
        }]
      } : w)
    }
  }),

  setWorkOrderFilter: (filter) => set({ workOrderFilter: filter }),

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
