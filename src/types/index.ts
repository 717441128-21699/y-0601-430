export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SnowStatus = 'open' | 'closed' | 'partial' | 'maintenance'
export type DeviceStatus = 'running' | 'stopped' | 'warning' | 'fault' | 'maintenance'
export type DeviceType = 'snowmaker' | 'cablecar' | 'magicarpet' | 'snowgroomer'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical'
export type CoachLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type RescueStatus = 'dispatched' | 'arrived' | 'in_progress' | 'completed'

export interface WeatherForecast {
  id: string
  date: string
  time: string
  temperature: number
  windSpeed: number
  windDirection: string
  humidity: number
  snowfall: number
  visibility: number
  pressure: number
  weatherCondition: string
}

export interface VisitorForecast {
  id: string
  date: string
  hour: number
  totalVisitors: number
  bySlope: Record<string, number>
  peakHour: number
}

export interface Slope {
  id: string
  name: string
  code: string
  difficulty: DifficultyLevel
  length: number
  width: number
  elevationStart: number
  elevationEnd: number
  snowThickness: number
  minSnowThickness: number
  capacity: number
  currentVisitors: number
  status: SnowStatus
  connectedDevices: string[]
  position: { x: number; y: number }
}

export interface Device {
  id: string
  name: string
  code: string
  type: DeviceType
  location: string
  status: DeviceStatus
  runHours: number
  maintenanceInterval: number
  lastMaintenance: string
  nextMaintenance: string
  powerConsumption: number
  waterConsumption: number
  efficiency: number
  connectedSlope?: string
  warningMessage?: string
}

export interface SnowMaker extends Device {
  type: 'snowmaker'
  snowOutputRate: number
  operatingTemp: number
  waterPressure: number
}

export interface CableCar extends Device {
  type: 'cablecar'
  capacity: number
  currentLoad: number
  lineLength: number
  speed: number
}

export interface ScheduleTask {
  id: string
  date: string
  slopeId: string
  slopeName: string
  openTime: string
  closeTime: string
  snowMakingPlan: SnowMakingPlan[]
  groomingPlan: GroomingPlan[]
  cableCarPlan: CableCarPlan[]
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  totalWaterQuota: number
  totalPowerQuota: number
  usedWater: number
  usedPower: number
}

export interface SnowMakingPlan {
  id: string
  deviceId: string
  deviceName: string
  startTime: string
  endTime: string
  targetThickness: number
  estimatedOutput: number
  waterAllocation: number
  powerAllocation: number
}

export interface GroomingPlan {
  id: string
  deviceId: string
  startTime: string
  endTime: string
  pattern: 'corduroy' | 'halfpipe' | 'mogul' | 'general'
}

export interface CableCarPlan {
  id: string
  deviceId: string
  startTime: string
  endTime: string
  maintenanceWindowStart?: string
  maintenanceWindowEnd?: string
}

export interface Coach {
  id: string
  name: string
  employeeId: string
  level: CoachLevel
  specialties: string[]
  certifications: string[]
  hourlyRate: number
  status: 'on_duty' | 'off_duty' | 'leave' | 'training'
  phone: string
  email: string
  photo?: string
  currentCourseId?: string
}

export interface Student {
  id: string
  name: string
  phone: string
  level: 'beginner' | 'intermediate' | 'advanced'
  lessonCount: number
}

export interface CourseBooking {
  id: string
  studentId: string
  studentName: string
  coachId: string
  coachName: string
  date: string
  startTime: string
  endTime: string
  courseType: 'private' | 'group'
  difficultyLevel: DifficultyLevel
  slopeId?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested'
  rescheduleReason?: string
  approvalStatus: ApprovalStatus
}

export interface VisitorLocation {
  id: string
  visitorId: string
  slopeId: string
  slopeName: string
  x: number
  y: number
  lastUpdate: string
  densityZone: 'low' | 'medium' | 'high'
}

export interface DensityAlert {
  id: string
  slopeId: string
  slopeName: string
  level: AlertLevel
  currentDensity: number
  threshold: number
  timestamp: string
  resolved: boolean
  message: string
}

export interface RescueRecord {
  id: string
  alertId?: string
  slopeId: string
  slopeName: string
  location: { x: number; y: number }
  locationDescription: string
  rescuerIds: string[]
  rescuerNames: string[]
  dispatchTime: string
  arrivalTime?: string
  startTime?: string
  endTime?: string
  totalMinutes?: number
  status: RescueStatus
  incidentType: 'injury' | 'lost' | 'equipment' | 'avalanche' | 'other'
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  patientName: string
  patientAge: number
  description: string
  treatment: string
  transferredTo?: string
  notes?: string
}

export interface Rescuer {
  id: string
  name: string
  employeeId: string
  certifications: string[]
  status: 'available' | 'on_mission' | 'off_duty'
  location: { x: number; y: number }
  stationId: string
  phone: string
  missionsCompleted: number
  responseTimeAvg: number
}

export interface WorkOrder {
  id: string
  deviceId: string
  deviceName: string
  deviceType: DeviceType
  type: 'preventive' | 'corrective' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: WorkOrderStatus
  description: string
  location: string
  reporter?: string
  teamId?: string
  teamName?: string
  assignee?: string
  createdAt: string
  scheduledDate?: string
  startedAt?: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  partsRequired: PartRequirement[]
  notes?: string
}

export interface PartRequirement {
  partId: string
  partName: string
  quantity: number
  fulfilled: boolean
}

export interface SparePart {
  id: string
  sku: string
  name: string
  category: string
  compatibleDevices: DeviceType[]
  stock: number
  safeStock: number
  unit: string
  location: string
  lastRestock: string
  supplier: string
}

export interface RepairTeam {
  id: string
  name: string
  leader: string
  members: string[]
  specialties: DeviceType[]
  status: 'available' | 'busy' | 'off_duty'
  currentWorkOrder?: string
}

export interface StatisticsDaily {
  date: string
  totalVisitors: number
  visitorsBySlope: Record<string, number>
  visitorsByHour: number[]
  revenue: number
  avgStayHours: number
  deviceUtilization: Record<string, number>
  powerConsumption: number
  waterConsumption: number
  snowMakingOutput: number
  incidentsCount: number
  rescueCount: number
}

export interface MapHeatPoint {
  x: number
  y: number
  value: number
  slopeId: string
  slopeName: string
}

export interface Notification {
  id: string
  type: 'alert' | 'info' | 'success' | 'warning' | 'danger'
  title: string
  message: string
  timestamp: string
  read?: boolean
  relatedId?: string
  relatedType?: string
}
