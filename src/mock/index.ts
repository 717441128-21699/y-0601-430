import dayjs from 'dayjs'
import type {
  WeatherForecast, VisitorForecast, Slope, Device, Coach, Student,
  CourseBooking, VisitorLocation, DensityAlert, RescueRecord, Rescuer,
  WorkOrder, WorkOrderOperationLog, SparePart, RepairTeam, StatisticsDaily, ScheduleTask,
  MapHeatPoint, Notification
} from '@/types'

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randFloat = (min: number, max: number, decimals = 1) => {
  const factor = Math.pow(10, decimals)
  return Math.floor((Math.random() * (max - min) + min) * factor) / factor
}
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const uid = () => Math.random().toString(36).slice(2, 10)

export const mockWeather: WeatherForecast[] = Array.from({ length: 48 }, (_, i) => ({
  id: uid(),
  date: dayjs().add(Math.floor(i / 24), 'day').format('YYYY-MM-DD'),
  time: `${String(i % 24).padStart(2, '0')}:00`,
  temperature: i % 24 < 6 ? rand(-18, -8) : i % 24 < 12 ? rand(-10, -2) : i % 24 < 18 ? rand(-5, 2) : rand(-12, -3),
  windSpeed: rand(3, 28),
  windDirection: pick(['东北风', '西北风', '北风', '东风', '西风', '西南风']),
  humidity: rand(40, 92),
  snowfall: i % 24 >= 20 || i % 24 < 4 ? randFloat(0, 8, 1) : randFloat(0, 2, 1),
  visibility: rand(300, 5000),
  pressure: rand(980, 1040),
  weatherCondition: pick(['晴', '多云', '小雪', '中雪', '阴', '阵雪', '晴间多云'])
}))

export const mockSlopes: Slope[] = [
  { id: 's1', name: '初级道A区', code: 'B-01', difficulty: 'beginner', length: 450, width: 60, elevationStart: 2100, elevationEnd: 2020, snowThickness: 68, minSnowThickness: 40, capacity: 320, currentVisitors: 185, status: 'open', connectedDevices: ['d1', 'd9', 'd14'], position: { x: 220, y: 480 } },
  { id: 's2', name: '初级道B区', code: 'B-02', difficulty: 'beginner', length: 380, width: 55, elevationStart: 2080, elevationEnd: 2010, snowThickness: 72, minSnowThickness: 40, capacity: 280, currentVisitors: 142, status: 'open', connectedDevices: ['d2', 'd15'], position: { x: 340, y: 520 } },
  { id: 's3', name: '中级道1号', code: 'I-01', difficulty: 'intermediate', length: 980, width: 45, elevationStart: 2280, elevationEnd: 2080, snowThickness: 58, minSnowThickness: 50, capacity: 200, currentVisitors: 156, status: 'open', connectedDevices: ['d3', 'd10'], position: { x: 400, y: 360 } },
  { id: 's4', name: '中级道2号', code: 'I-02', difficulty: 'intermediate', length: 1120, width: 42, elevationStart: 2320, elevationEnd: 2100, snowThickness: 52, minSnowThickness: 50, capacity: 180, currentVisitors: 98, status: 'open', connectedDevices: ['d3', 'd11'], position: { x: 520, y: 310 } },
  { id: 's5', name: '中级道3号', code: 'I-03', difficulty: 'intermediate', length: 850, width: 40, elevationStart: 2260, elevationEnd: 2090, snowThickness: 65, minSnowThickness: 50, capacity: 170, currentVisitors: 73, status: 'open', connectedDevices: ['d4'], position: { x: 360, y: 320 } },
  { id: 's6', name: '高级道1号', code: 'A-01', difficulty: 'advanced', length: 1680, width: 38, elevationStart: 2480, elevationEnd: 2150, snowThickness: 62, minSnowThickness: 55, capacity: 120, currentVisitors: 68, status: 'open', connectedDevices: ['d5', 'd12'], position: { x: 580, y: 200 } },
  { id: 's7', name: '高级道2号', code: 'A-02', difficulty: 'advanced', length: 1520, width: 35, elevationStart: 2450, elevationEnd: 2130, snowThickness: 48, minSnowThickness: 55, capacity: 100, currentVisitors: 32, status: 'partial', connectedDevices: ['d5'], position: { x: 660, y: 240 } },
  { id: 's8', name: '专家道·野雪', code: 'E-01', difficulty: 'expert', length: 2150, width: 28, elevationStart: 2620, elevationEnd: 2200, snowThickness: 85, minSnowThickness: 60, capacity: 60, currentVisitors: 18, status: 'open', connectedDevices: ['d6'], position: { x: 720, y: 120 } },
  { id: 's9', name: '教学练习道', code: 'T-01', difficulty: 'beginner', length: 180, width: 80, elevationStart: 2050, elevationEnd: 2015, snowThickness: 75, minSnowThickness: 40, capacity: 400, currentVisitors: 245, status: 'open', connectedDevices: ['d7', 'd16'], position: { x: 180, y: 560 } },
  { id: 's10', name: '地形公园', code: 'P-01', difficulty: 'intermediate', length: 620, width: 50, elevationStart: 2200, elevationEnd: 2090, snowThickness: 70, minSnowThickness: 50, capacity: 150, currentVisitors: 92, status: 'open', connectedDevices: ['d8'], position: { x: 460, y: 430 } },
  { id: 's11', name: '高级道3号', code: 'A-03', difficulty: 'advanced', length: 1890, width: 36, elevationStart: 2550, elevationEnd: 2180, snowThickness: 0, minSnowThickness: 55, capacity: 90, currentVisitors: 0, status: 'closed', connectedDevices: ['d13'], position: { x: 820, y: 180 } }
]

export const mockDevices: Device[] = [
  { id: 'd1', name: '造雪机B1-01', code: 'SM-B01', type: 'snowmaker', location: '初级道A区起点', status: 'running', runHours: 1286, maintenanceInterval: 500, lastMaintenance: '2026-05-20', nextMaintenance: '2026-07-15', powerConsumption: 38, waterConsumption: 120, efficiency: 94, connectedSlope: 's1' } as Device,
  { id: 'd2', name: '造雪机B2-01', code: 'SM-B02', type: 'snowmaker', location: '初级道B区中段', status: 'running', runHours: 942, maintenanceInterval: 500, lastMaintenance: '2026-06-01', nextMaintenance: '2026-07-20', powerConsumption: 36, waterConsumption: 115, efficiency: 96, connectedSlope: 's2' } as Device,
  { id: 'd3', name: '造雪机I1-01', code: 'SM-I01', type: 'snowmaker', location: '中级道上段', status: 'warning', runHours: 1652, maintenanceInterval: 500, lastMaintenance: '2026-04-10', nextMaintenance: '2026-06-18', powerConsumption: 42, waterConsumption: 125, efficiency: 82, connectedSlope: 's3', warningMessage: '运行时间接近维保阈值' } as Device,
  { id: 'd4', name: '造雪机I3-01', code: 'SM-I03', type: 'snowmaker', location: '中级道3号顶端', status: 'stopped', runHours: 812, maintenanceInterval: 500, lastMaintenance: '2026-05-28', nextMaintenance: '2026-08-10', powerConsumption: 0, waterConsumption: 0, efficiency: 92, connectedSlope: 's5' } as Device,
  { id: 'd5', name: '造雪机A1-01', code: 'SM-A01', type: 'snowmaker', location: '高级道1号顶端', status: 'running', runHours: 1488, maintenanceInterval: 500, lastMaintenance: '2026-04-28', nextMaintenance: '2026-06-25', powerConsumption: 45, waterConsumption: 130, efficiency: 88, connectedSlope: 's6' } as Device,
  { id: 'd6', name: '造雪机E1-01', code: 'SM-E01', type: 'snowmaker', location: '专家道顶端', status: 'stopped', runHours: 620, maintenanceInterval: 500, lastMaintenance: '2026-05-15', nextMaintenance: '2026-07-30', powerConsumption: 0, waterConsumption: 0, efficiency: 95, connectedSlope: 's8' } as Device,
  { id: 'd7', name: '造雪机T1-01', code: 'SM-T01', type: 'snowmaker', location: '教学道终点', status: 'running', runHours: 1120, maintenanceInterval: 500, lastMaintenance: '2026-05-10', nextMaintenance: '2026-06-30', powerConsumption: 32, waterConsumption: 100, efficiency: 90, connectedSlope: 's9' } as Device,
  { id: 'd8', name: '造雪机P1-01', code: 'SM-P01', type: 'snowmaker', location: '地形公园', status: 'maintenance', runHours: 1450, maintenanceInterval: 500, lastMaintenance: '2026-03-20', nextMaintenance: '2026-06-14', powerConsumption: 0, waterConsumption: 0, efficiency: 78, connectedSlope: 's10', warningMessage: '正在进行计划维保' } as Device,
  { id: 'd9', name: '缆车A线', code: 'CC-A1', type: 'cablecar', location: '主入口至初级道', status: 'running', runHours: 2380, maintenanceInterval: 1000, lastMaintenance: '2026-05-25', nextMaintenance: '2026-06-18', powerConsumption: 85, waterConsumption: 0, efficiency: 98, connectedSlope: 's1' } as Device,
  { id: 'd10', name: '缆车B线', code: 'CC-B1', type: 'cablecar', location: '中级道1号', status: 'running', runHours: 1960, maintenanceInterval: 1000, lastMaintenance: '2026-05-05', nextMaintenance: '2026-07-05', powerConsumption: 92, waterConsumption: 0, efficiency: 96, connectedSlope: 's3' } as Device,
  { id: 'd11', name: '缆车C线', code: 'CC-C1', type: 'cablecar', location: '中级道2号', status: 'running', runHours: 1780, maintenanceInterval: 1000, lastMaintenance: '2026-04-28', nextMaintenance: '2026-07-01', powerConsumption: 88, waterConsumption: 0, efficiency: 97, connectedSlope: 's4' } as Device,
  { id: 'd12', name: '缆车D线', code: 'CC-D1', type: 'cablecar', location: '高级道1号', status: 'running', runHours: 890, maintenanceInterval: 1000, lastMaintenance: '2026-05-30', nextMaintenance: '2026-08-15', powerConsumption: 78, waterConsumption: 0, efficiency: 99, connectedSlope: 's6' } as Device,
  { id: 'd13', name: '缆车E线', code: 'CC-E1', type: 'cablecar', location: '高级道3号', status: 'fault', runHours: 2100, maintenanceInterval: 1000, lastMaintenance: '2026-03-15', nextMaintenance: '2026-06-14', powerConsumption: 0, waterConsumption: 0, efficiency: 0, connectedSlope: 's11', warningMessage: '牵引机构故障，紧急维修中' } as Device,
  { id: 'd14', name: '魔毯1号', code: 'MC-01', type: 'magicarpet', location: '初级道A区底部', status: 'running', runHours: 1680, maintenanceInterval: 800, lastMaintenance: '2026-05-18', nextMaintenance: '2026-07-08', powerConsumption: 18, waterConsumption: 0, efficiency: 95, connectedSlope: 's1' } as Device,
  { id: 'd15', name: '魔毯2号', code: 'MC-02', type: 'magicarpet', location: '初级道B区', status: 'running', runHours: 1420, maintenanceInterval: 800, lastMaintenance: '2026-05-22', nextMaintenance: '2026-07-15', powerConsumption: 16, waterConsumption: 0, efficiency: 96, connectedSlope: 's2' } as Device,
  { id: 'd16', name: '魔毯3号', code: 'MC-03', type: 'magicarpet', location: '教学道', status: 'running', runHours: 1880, maintenanceInterval: 800, lastMaintenance: '2026-05-08', nextMaintenance: '2026-06-22', powerConsumption: 22, waterConsumption: 0, efficiency: 93, connectedSlope: 's9' } as Device,
  { id: 'd17', name: '压雪车1号', code: 'SG-01', type: 'snowgroomer', location: '车库', status: 'running', runHours: 680, maintenanceInterval: 400, lastMaintenance: '2026-05-30', nextMaintenance: '2026-07-12', powerConsumption: 120, waterConsumption: 0, efficiency: 88 },
  { id: 'd18', name: '压雪车2号', code: 'SG-02', type: 'snowgroomer', location: '高级道区域', status: 'running', runHours: 520, maintenanceInterval: 400, lastMaintenance: '2026-06-02', nextMaintenance: '2026-07-22', powerConsumption: 115, waterConsumption: 0, efficiency: 90 },
  { id: 'd19', name: '压雪车3号', code: 'SG-03', type: 'snowgroomer', location: '车库', status: 'warning', runHours: 398, maintenanceInterval: 400, lastMaintenance: '2026-04-10', nextMaintenance: '2026-06-15', powerConsumption: 0, waterConsumption: 0, efficiency: 82, warningMessage: '即将到达保养里程' }
]

export const mockVisitorForecast: VisitorForecast[] = Array.from({ length: 7 }, (_, dayOffset) =>
  Array.from({ length: 24 }, (_, h) => ({
    id: uid(),
    date: dayjs().add(dayOffset, 'day').format('YYYY-MM-DD'),
    hour: h,
    totalVisitors: h < 8 ? 0 : h < 10 ? rand(200, 600) : h < 12 ? rand(800, 1800) : h < 14 ? rand(1200, 2200) : h < 16 ? rand(1500, 2500) : h < 18 ? rand(1000, 1800) : h < 20 ? rand(400, 900) : 0,
    bySlope: {
      s1: rand(50, 280), s2: rand(40, 220), s3: rand(60, 240), s4: rand(50, 200),
      s5: rand(30, 160), s6: rand(40, 140), s7: rand(20, 80), s8: rand(10, 40),
      s9: rand(80, 400), s10: rand(30, 120), s11: 0
    },
    peakHour: 14 + rand(-2, 2)
  }))
).flat()

export const mockCoaches: Coach[] = [
  { id: 'c1', name: '张雪峰', employeeId: 'SK202301', level: 'L5', specialties: ['高山滑雪', '竞技训练', '儿童教学'], certifications: ['CSIA L4', '中国滑雪指导员5级'], hourlyRate: 800, status: 'on_duty', phone: '138****1234', email: 'zhangxf@skihill.com', currentCourseId: 'b1' },
  { id: 'c2', name: '李婉清', employeeId: 'SK202302', level: 'L4', specialties: ['儿童教学', '入门启蒙'], certifications: ['CSIA L3', '中国滑雪指导员4级'], hourlyRate: 600, status: 'on_duty', phone: '139****5678', email: 'liwq@skihill.com' },
  { id: 'c3', name: '王浩然', employeeId: 'SK202303', level: 'L4', specialties: ['单板', '自由式'], certifications: ['CASI L3', '中国滑雪指导员4级'], hourlyRate: 650, status: 'on_duty', phone: '137****9012', email: 'wanghr@skihill.com', currentCourseId: 'b3' },
  { id: 'c4', name: '赵敏慧', employeeId: 'SK202304', level: 'L3', specialties: ['双板进阶', '女子专属班'], certifications: ['CSIA L2', '中国滑雪指导员3级'], hourlyRate: 450, status: 'on_duty', phone: '136****3456', email: 'zhaomh@skihill.com' },
  { id: 'c5', name: '陈志强', employeeId: 'SK202305', level: 'L3', specialties: ['高山滑雪', '竞速'], certifications: ['CSIA L2', '竞技裁判C级'], hourlyRate: 480, status: 'on_duty', phone: '135****7890', email: 'chenzq@skihill.com' },
  { id: 'c6', name: '刘思雨', employeeId: 'SK202306', level: 'L2', specialties: ['儿童教学', '入门'], certifications: ['中国滑雪指导员2级'], hourlyRate: 320, status: 'on_duty', phone: '188****2345', email: 'liusy@skihill.com' },
  { id: 'c7', name: '周建国', employeeId: 'SK202307', level: 'L5', specialties: ['自由式技巧', '跳台'], certifications: ['CSIA L4', '自由式教练'], hourlyRate: 850, status: 'training', phone: '187****6789', email: 'zhoujg@skihill.com' },
  { id: 'c8', name: '吴雅琳', employeeId: 'SK202308', level: 'L2', specialties: ['入门启蒙', '青少年'], certifications: ['中国滑雪指导员2级'], hourlyRate: 300, status: 'on_duty', phone: '186****0123', email: 'wuyl@skihill.com', currentCourseId: 'b2' },
  { id: 'c9', name: '郑大伟', employeeId: 'SK202309', level: 'L3', specialties: ['单板公园', '平花'], certifications: ['CASI L2', '公园教练认证'], hourlyRate: 460, status: 'leave', phone: '185****4567', email: 'zhengdw@skihill.com' },
  { id: 'c10', name: '孙丽娟', employeeId: 'SK202310', level: 'L4', specialties: ['儿童专项', '竞技培训'], certifications: ['CSIA L3', '儿童教练高级'], hourlyRate: 620, status: 'off_duty', phone: '184****8901', email: 'sunlj@skihill.com' },
  { id: 'c11', name: '马超群', employeeId: 'SK202311', level: 'L3', specialties: ['双板初级', '家庭套餐'], certifications: ['中国滑雪指导员3级'], hourlyRate: 420, status: 'on_duty', phone: '183****2345', email: 'macq@skihill.com' },
  { id: 'c12', name: '黄晓峰', employeeId: 'SK202312', level: 'L2', specialties: ['单板入门'], certifications: ['CASI L1', '中国滑雪指导员2级'], hourlyRate: 300, status: 'on_duty', phone: '182****6789', email: 'huangxf@skihill.com' }
]

export const mockStudents: Student[] = [
  { id: 'st1', name: '小明', phone: '138****1111', level: 'beginner', lessonCount: 3 },
  { id: 'st2', name: '小红', phone: '138****2222', level: 'beginner', lessonCount: 5 },
  { id: 'st3', name: '王磊', phone: '139****3333', level: 'intermediate', lessonCount: 12 },
  { id: 'st4', name: '张伟', phone: '139****4444', level: 'intermediate', lessonCount: 8 },
  { id: 'st5', name: '李娜', phone: '137****5555', level: 'advanced', lessonCount: 25 },
  { id: 'st6', name: '陈刚', phone: '137****6666', level: 'beginner', lessonCount: 2 },
  { id: 'st7', name: '刘芳', phone: '136****7777', level: 'intermediate', lessonCount: 10 },
  { id: 'st8', name: '赵鹏', phone: '136****8888', level: 'beginner', lessonCount: 1 },
  { id: 'st9', name: '孙丽', phone: '135****9999', level: 'advanced', lessonCount: 18 },
  { id: 'st10', name: '周洁', phone: '135****0000', level: 'beginner', lessonCount: 4 }
]

const today = dayjs().format('YYYY-MM-DD')
const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
export const mockBookings: CourseBooking[] = [
  { id: 'b1', studentId: 'st1', studentName: '小明', coachId: 'c1', coachName: '张雪峰', date: today, startTime: '09:00', endTime: '11:00', courseType: 'private', difficultyLevel: 'beginner', slopeId: 's9', status: 'in_progress', approvalStatus: 'approved' },
  { id: 'b2', studentId: 'st2', studentName: '小红', coachId: 'c8', coachName: '吴雅琳', date: today, startTime: '09:30', endTime: '11:30', courseType: 'group', difficultyLevel: 'beginner', slopeId: 's1', status: 'in_progress', approvalStatus: 'approved' },
  { id: 'b3', studentId: 'st3', studentName: '王磊', coachId: 'c3', coachName: '王浩然', date: today, startTime: '10:00', endTime: '12:00', courseType: 'private', difficultyLevel: 'intermediate', slopeId: 's3', status: 'in_progress', approvalStatus: 'approved' },
  { id: 'b4', studentId: 'st4', studentName: '张伟', coachId: 'c4', coachName: '赵敏慧', date: today, startTime: '13:00', endTime: '15:00', courseType: 'private', difficultyLevel: 'intermediate', slopeId: 's4', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b5', studentId: 'st5', studentName: '李娜', coachId: 'c5', coachName: '陈志强', date: today, startTime: '14:00', endTime: '16:00', courseType: 'private', difficultyLevel: 'advanced', slopeId: 's6', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b6', studentId: 'st6', studentName: '陈刚', coachId: 'c6', coachName: '刘思雨', date: today, startTime: '13:30', endTime: '15:30', courseType: 'group', difficultyLevel: 'beginner', slopeId: 's9', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b7', studentId: 'st7', studentName: '刘芳', coachId: 'c11', coachName: '马超群', date: today, startTime: '10:00', endTime: '12:00', courseType: 'group', difficultyLevel: 'intermediate', slopeId: 's5', status: 'reschedule_requested', rescheduleReason: '身体不适，希望改到明天', approvalStatus: 'pending' },
  { id: 'b8', studentId: 'st1', studentName: '小明', coachId: 'c1', coachName: '张雪峰', date: tomorrow, startTime: '09:00', endTime: '11:00', courseType: 'private', difficultyLevel: 'beginner', slopeId: 's9', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b9', studentId: 'st8', studentName: '赵鹏', coachId: 'c12', coachName: '黄晓峰', date: tomorrow, startTime: '10:00', endTime: '12:00', courseType: 'private', difficultyLevel: 'beginner', slopeId: 's2', status: 'scheduled', approvalStatus: 'pending' },
  { id: 'b10', studentId: 'st9', studentName: '孙丽', coachId: 'c3', coachName: '王浩然', date: tomorrow, startTime: '13:00', endTime: '15:00', courseType: 'private', difficultyLevel: 'advanced', slopeId: 's10', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b11', studentId: 'st10', studentName: '周洁', coachId: 'c8', coachName: '吴雅琳', date: tomorrow, startTime: '14:00', endTime: '16:00', courseType: 'group', difficultyLevel: 'beginner', slopeId: 's9', status: 'scheduled', approvalStatus: 'approved' },
  { id: 'b12', studentId: 'st3', studentName: '王磊', coachId: 'c5', coachName: '陈志强', date: tomorrow, startTime: '09:00', endTime: '11:00', courseType: 'private', difficultyLevel: 'intermediate', slopeId: 's3', status: 'scheduled', approvalStatus: 'approved' }
]

export const mockVisitorLocations: VisitorLocation[] = Array.from({ length: 600 }, () => {
  const slope = pick(mockSlopes.filter(s => s.status !== 'closed'))
  return {
    id: uid(),
    visitorId: 'V' + rand(10000, 99999),
    slopeId: slope.id,
    slopeName: slope.name,
    x: slope.position.x + rand(-30, 30),
    y: slope.position.y + rand(-20, 20),
    lastUpdate: dayjs().subtract(rand(0, 300), 'second').format('YYYY-MM-DD HH:mm:ss'),
    densityZone: pick(['low', 'low', 'medium', 'medium', 'high'])
  }
})

export const mockDensityAlerts: DensityAlert[] = [
  { id: 'a1', slopeId: 's1', slopeName: '初级道A区', level: 'warning', currentDensity: 0.82, threshold: 0.75, timestamp: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'), resolved: false, message: '游客密度接近饱和，请关注疏导' },
  { id: 'a2', slopeId: 's9', slopeName: '教学练习道', level: 'danger', currentDensity: 0.95, threshold: 0.85, timestamp: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'), resolved: false, message: '教学道人流量过大，建议限流' },
  { id: 'a3', slopeId: 's6', slopeName: '高级道1号', level: 'info', currentDensity: 0.58, threshold: 0.75, timestamp: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'), resolved: true, message: '密度恢复正常' },
  { id: 'a4', slopeId: 's10', slopeName: '地形公园', level: 'warning', currentDensity: 0.78, threshold: 0.70, timestamp: dayjs().subtract(12, 'minute').format('YYYY-MM-DD HH:mm:ss'), resolved: false, message: '公园区域人员较多，注意安全' }
]

export const mockRescuers: Rescuer[] = [
  { id: 'r1', name: '李救援', employeeId: 'RS001', certifications: ['滑雪救生员高级', '急救医师', '雪崩搜救'], status: 'available', location: { x: 300, y: 300 }, stationId: 'stn1', phone: '198****0001', missionsCompleted: 156, responseTimeAvg: 4.2 },
  { id: 'r2', name: '王安全', employeeId: 'RS002', certifications: ['滑雪救生员中级', 'AED操作认证'], status: 'on_mission', location: { x: 220, y: 480 }, stationId: 'stn1', phone: '198****0002', missionsCompleted: 89, responseTimeAvg: 5.1 },
  { id: 'r3', name: '张卫士', employeeId: 'RS003', certifications: ['滑雪救生员高级', '雪地车辆驾驶'], status: 'available', location: { x: 600, y: 200 }, stationId: 'stn2', phone: '198****0003', missionsCompleted: 203, responseTimeAvg: 3.8 },
  { id: 'r4', name: '陈守护', employeeId: 'RS004', certifications: ['滑雪救生员中级', '急救员'], status: 'available', location: { x: 580, y: 310 }, stationId: 'stn2', phone: '198****0004', missionsCompleted: 76, responseTimeAvg: 5.5 },
  { id: 'r5', name: '刘先锋', employeeId: 'RS005', certifications: ['滑雪救生员高级', '雪崩搜救犬训导员'], status: 'available', location: { x: 720, y: 120 }, stationId: 'stn3', phone: '198****0005', missionsCompleted: 287, responseTimeAvg: 3.2 },
  { id: 'r6', name: '孙迅', employeeId: 'RS006', certifications: ['滑雪救生员初级', '急救员'], status: 'off_duty', location: { x: 180, y: 560 }, stationId: 'stn1', phone: '198****0006', missionsCompleted: 34, responseTimeAvg: 6.8 }
]

export const mockRescueRecords: RescueRecord[] = [
  {
    id: 'rs1', slopeId: 's1', slopeName: '初级道A区', location: { x: 235, y: 495 }, locationDescription: 'A区中段转弯处',
    rescuerIds: ['r2'], rescuerNames: ['王安全'],
    dispatchTime: dayjs().subtract(35, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    arrivalTime: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    startTime: dayjs().subtract(28, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs().subtract(12, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    totalMinutes: 23, status: 'completed',
    incidentType: 'injury', severity: 'moderate',
    patientName: '某游客', patientAge: 28,
    description: '滑雪时不慎摔倒，左踝关节扭伤',
    treatment: '踝关节固定包扎，冰敷处理', transferredTo: '医务室', notes: '恢复良好，游客自行离开'
  },
  {
    id: 'rs2', slopeId: 's9', slopeName: '教学练习道', location: { x: 185, y: 565 }, locationDescription: '教学道入口右侧',
    rescuerIds: ['r1'], rescuerNames: ['李救援'],
    dispatchTime: dayjs().subtract(18, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    arrivalTime: dayjs().subtract(14, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    startTime: dayjs().subtract(12, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: 'in_progress', totalMinutes: 0,
    incidentType: 'injury', severity: 'minor',
    patientName: '儿童学员', patientAge: 8,
    description: '儿童学员摔倒，哭闹不止，疑似手腕受伤',
    treatment: '初步检查，等待家长到场'
  },
  {
    id: 'rs3', slopeId: 's6', slopeName: '高级道1号', location: { x: 590, y: 210 }, locationDescription: '海拔2400米处',
    rescuerIds: [], rescuerNames: [],
    dispatchTime: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: 'dispatched', totalMinutes: 0,
    incidentType: 'lost', severity: 'moderate',
    patientName: '未知', patientAge: 0,
    description: 'SOS定位警报触发，高级道1号上段有游客求救',
    treatment: ''
  },
  {
    id: 'rs4', slopeId: 's10', slopeName: '地形公园', location: { x: 470, y: 440 }, locationDescription: '跳台区',
    rescuerIds: ['r3', 'r4'], rescuerNames: ['张卫士', '陈守护'],
    dispatchTime: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    arrivalTime: dayjs().subtract(2, 'hour').subtract(55, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    startTime: dayjs().subtract(2, 'hour').subtract(50, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs().subtract(1, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    totalMinutes: 90, status: 'completed',
    incidentType: 'injury', severity: 'severe',
    patientName: '某极限运动爱好者', patientAge: 24,
    description: '跳台落地失误，右前臂骨折，意识清醒',
    treatment: '夹板固定，担架转运，呼叫120', transferredTo: '县人民医院', notes: '医院已接回，情况稳定'
  }
]

export const mockRepairTeams: RepairTeam[] = [
  { id: 't1', name: '机电一班', leader: '赵班长', members: ['赵班长', '钱工', '孙技工'], specialties: ['snowmaker', 'snowgroomer'], status: 'busy', currentWorkOrder: 'wo3' },
  { id: 't2', name: '机电二班', leader: '李组长', members: ['李组长', '周工', '吴技工'], specialties: ['cablecar', 'magicarpet'], status: 'available' },
  { id: 't3', name: '索道专业组', leader: '郑主管', members: ['郑主管', '王工', '冯技工', '陈技工'], specialties: ['cablecar'], status: 'busy', currentWorkOrder: 'wo1' },
  { id: 't4', name: '综合抢修班', leader: '韩队长', members: ['韩队长', '朱工', '秦技工', '许技工', '何技工'], specialties: ['snowmaker', 'cablecar', 'magicarpet', 'snowgroomer'], status: 'available' }
]

export const mockWorkOrders: WorkOrder[] = [
  { id: 'wo1', deviceId: 'd13', deviceName: '缆车E线', deviceType: 'cablecar', type: 'emergency', priority: 'urgent', status: 'in_progress', description: '牵引机构异常噪音，减速箱疑似故障，影响高级道3号运营', teamId: 't3', teamName: '索道专业组', assignee: '郑主管', createdAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), scheduledDate: today, startedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), estimatedHours: 8, location: '高级道3号', reporter: '巡检员-王', partsRequired: [{ partId: 'p5', partName: '减速箱轴承', quantity: 2, fulfilled: true }, { partId: 'p6', partName: '牵引轮衬垫', quantity: 4, fulfilled: true }],
    operationLogs: [
      { id: 'wo1_log1', action: 'created', timestamp: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '巡检员-王', note: '现场发现牵引机构异响，紧急报修' },
      { id: 'wo1_log2', action: 'assigned', timestamp: dayjs().subtract(2.5, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '运营总监-王总', note: '紧急派单给索道专业组，要求优先处理' },
      { id: 'wo1_log3', action: 'started', timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '郑主管', note: '已到达现场，开始拆解检查' }
    ]
  },
  { id: 'wo2', deviceId: 'd3', deviceName: '造雪机I1-01', deviceType: 'snowmaker', type: 'preventive', priority: 'high', status: 'assigned', description: '运行时间达到维保阈值，需要更换滤芯和润滑保养', teamId: 't1', teamName: '机电一班', assignee: '钱工', createdAt: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), scheduledDate: today, estimatedHours: 3, location: '中级道上段', reporter: '系统自动', partsRequired: [{ partId: 'p1', partName: '水滤芯', quantity: 2, fulfilled: true }, { partId: 'p2', partName: '空气滤芯', quantity: 1, fulfilled: true }],
    operationLogs: [
      { id: 'wo2_log1', action: 'created', timestamp: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '系统自动', note: '运行时长触发维保提醒' },
      { id: 'wo2_log2', action: 'assigned', timestamp: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '运营总监-王总', note: '安排白班处理，备件已备好' }
    ]
  },
  { id: 'wo3', deviceId: 'd8', deviceName: '造雪机P1-01', deviceType: 'snowmaker', type: 'preventive', priority: 'medium', status: 'in_progress', description: '计划维保：液压系统检测+喷嘴清洗校准', teamId: 't1', teamName: '机电一班', assignee: '孙技工', createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), scheduledDate: today, startedAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), estimatedHours: 5, location: '地形公园', reporter: '系统自动', partsRequired: [{ partId: 'p3', partName: '喷嘴组', quantity: 12, fulfilled: true }, { partId: 'p4', partName: '液压油', quantity: 20, fulfilled: true }],
    operationLogs: [
      { id: 'wo3_log1', action: 'created', timestamp: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '系统自动', note: '月度计划维保任务生成' },
      { id: 'wo3_log2', action: 'assigned', timestamp: dayjs().subtract(1, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '运营总监-王总', note: '按计划执行' },
      { id: 'wo3_log3', action: 'started', timestamp: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '孙技工', note: '开始作业，先进行液压油检测' }
    ]
  },
  { id: 'wo4', deviceId: 'd19', deviceName: '压雪车3号', deviceType: 'snowgroomer', type: 'preventive', priority: 'high', status: 'pending', description: '即将到达保养里程，需进行全面保养', createdAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), scheduledDate: tomorrow, estimatedHours: 6, location: '车库', reporter: '系统自动', partsRequired: [{ partId: 'p7', partName: '发动机机油', quantity: 30, fulfilled: false }, { partId: 'p8', partName: '履带螺栓', quantity: 40, fulfilled: true }],
    operationLogs: [
      { id: 'wo4_log1', action: 'created', timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), operator: '系统自动', note: '保养里程触发，等待派单' }
    ]
  },
  { id: 'wo5', deviceId: 'd16', deviceName: '魔毯3号', deviceType: 'magicarpet', type: 'corrective', priority: 'medium', status: 'pending', description: '皮带张紧器异响，需要检查调整或更换', createdAt: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), scheduledDate: tomorrow, estimatedHours: 2, location: '教学道', reporter: '教练-李', partsRequired: [{ partId: 'p9', partName: '张紧器总成', quantity: 1, fulfilled: false }],
    operationLogs: [
      { id: 'wo5_log1', action: 'created', timestamp: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), operator: '教练-李', note: '教学时听到异常声响，已暂停使用' }
    ]
  },
  { id: 'wo6', deviceId: 'd10', deviceName: '缆车B线', deviceType: 'cablecar', type: 'preventive', priority: 'low', status: 'pending', description: '月度例行：缆绳探伤+抱索器检查', createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), scheduledDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), estimatedHours: 4, location: '中级道1号', reporter: '系统自动', partsRequired: [],
    operationLogs: [
      { id: 'wo6_log1', action: 'created', timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: '系统自动', note: '月度例行检查任务生成' }
    ]
  }
]

export const mockSpareParts: SparePart[] = [
  { id: 'p1', sku: 'SM-FIL-W001', name: '造雪机水滤芯', category: '过滤器', compatibleDevices: ['snowmaker'], stock: 8, safeStock: 10, unit: '个', location: 'A区货架-01', lastRestock: '2026-05-20', supplier: '雪峰造雪设备有限公司' },
  { id: 'p2', sku: 'SM-FIL-A002', name: '造雪机空气滤芯', category: '过滤器', compatibleDevices: ['snowmaker'], stock: 15, safeStock: 8, unit: '个', location: 'A区货架-02', lastRestock: '2026-05-22', supplier: '雪峰造雪设备有限公司' },
  { id: 'p3', sku: 'SM-NOZ-S012', name: '造雪机核子喷嘴', category: '喷嘴组件', compatibleDevices: ['snowmaker'], stock: 46, safeStock: 30, unit: '个', location: 'A区货架-03', lastRestock: '2026-06-01', supplier: 'TechnoAlpin' },
  { id: 'p4', sku: 'SM-OIL-H020', name: '抗磨液压油46号', category: '润滑油', compatibleDevices: ['snowmaker', 'snowgroomer'], stock: 8, safeStock: 25, unit: 'L', location: 'B区油库', lastRestock: '2026-04-10', supplier: '中石油' },
  { id: 'p5', sku: 'CC-BRG-G001', name: '减速机轴承', category: '传动部件', compatibleDevices: ['cablecar', 'magicarpet'], stock: 3, safeStock: 6, unit: '套', location: 'C区精密件', lastRestock: '2026-03-15', supplier: 'SKF' },
  { id: 'p6', sku: 'CC-LIN-R004', name: '驱动轮衬垫', category: '索道配件', compatibleDevices: ['cablecar'], stock: 2, safeStock: 8, unit: '件', location: 'C区精密件-02', lastRestock: '2026-02-28', supplier: 'Garaventa' },
  { id: 'p7', sku: 'SG-OIL-E030', name: '压雪车发动机机油', category: '润滑油', compatibleDevices: ['snowgroomer'], stock: 45, safeStock: 60, unit: 'L', location: 'B区油库-02', lastRestock: '2026-05-10', supplier: '美孚' },
  { id: 'p8', sku: 'SG-TRK-B040', name: '履带螺栓M12', category: '紧固件', compatibleDevices: ['snowgroomer'], stock: 200, safeStock: 100, unit: '个', location: 'D区标准件', lastRestock: '2026-05-25', supplier: '本地标准件厂' },
  { id: 'p9', sku: 'MC-TEN-T001', name: '皮带张紧器总成', category: '传动部件', compatibleDevices: ['magicarpet'], stock: 0, safeStock: 2, unit: '套', location: 'A区货架-05', lastRestock: '2026-01-10', supplier: 'Sunkid' },
  { id: 'p10', sku: 'SM-CMP-P003', name: '压缩机活塞环', category: '压缩机配件', compatibleDevices: ['snowmaker'], stock: 4, safeStock: 5, unit: '组', location: 'C区精密件-03', lastRestock: '2026-04-05', supplier: 'Atlas Copco' }
]

export const mockStatistics: StatisticsDaily[] = Array.from({ length: 30 }, (_, i) => {
  const date = dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD')
  const isWeekend = dayjs(date).day() === 0 || dayjs(date).day() === 6
  const baseVisitors = isWeekend ? rand(2800, 4500) : rand(1200, 2600)
  return {
    date,
    totalVisitors: baseVisitors,
    visitorsBySlope: {
      s1: rand(280, 520), s2: rand(200, 420), s3: rand(350, 580), s4: rand(280, 480),
      s5: rand(150, 350), s6: rand(180, 320), s7: rand(80, 180), s8: rand(30, 80),
      s9: rand(500, 900), s10: rand(150, 280), s11: rand(0, 20)
    },
    visitorsByHour: Array.from({ length: 24 }, (_, h) =>
      h < 8 ? 0 : h < 10 ? Math.floor(baseVisitors * rand(5, 12) / 100)
      : h < 12 ? Math.floor(baseVisitors * rand(10, 18) / 100)
      : h < 14 ? Math.floor(baseVisitors * rand(12, 20) / 100)
      : h < 16 ? Math.floor(baseVisitors * rand(15, 22) / 100)
      : h < 18 ? Math.floor(baseVisitors * rand(8, 15) / 100)
      : h < 20 ? Math.floor(baseVisitors * rand(3, 8) / 100) : 0
    ),
    revenue: baseVisitors * rand(280, 520),
    avgStayHours: randFloat(3.5, 6.8),
    deviceUtilization: {
      d9: randFloat(65, 95), d10: randFloat(55, 88), d11: randFloat(45, 82),
      d12: randFloat(30, 70), d14: randFloat(60, 92), d15: randFloat(55, 85), d16: randFloat(70, 96)
    },
    powerConsumption: rand(8000, 18000),
    waterConsumption: rand(300, 800),
    snowMakingOutput: rand(200, 1200),
    incidentsCount: rand(0, 5),
    rescueCount: rand(0, 3)
  }
})

export const generateScheduleTasks = (): ScheduleTask[] => {
  const dates = [today, tomorrow]
  return dates.map((date, di) => {
    const openSlopes = mockSlopes.filter(s => s.status !== 'closed' || di === 1)
    return {
      id: 'sch_' + date,
      date,
      slopeId: 'all',
      slopeName: '全场排程',
      openTime: '08:00',
      closeTime: '21:00',
      snowMakingPlan: mockDevices.filter(d => d.type === 'snowmaker' && d.status !== 'fault').map(d => ({
        id: uid(),
        deviceId: d.id,
        deviceName: d.name,
        startTime: di === 0 ? '21:30' : '21:00',
        endTime: di === 0 ? '次日05:30' : '次日05:00',
        targetThickness: rand(60, 90),
        estimatedOutput: rand(40, 80),
        waterAllocation: rand(600, 1000),
        powerAllocation: rand(180, 320)
      })),
      groomingPlan: [
        { id: uid(), deviceId: 'd17', startTime: '05:00', endTime: '07:30', pattern: 'corduroy' },
        { id: uid(), deviceId: 'd18', startTime: '05:00', endTime: '07:45', pattern: 'corduroy' },
        { id: uid(), deviceId: 'd17', startTime: '12:30', endTime: '13:30', pattern: 'general' }
      ],
      cableCarPlan: mockDevices.filter(d => d.type === 'cablecar').map(d => ({
        id: uid(),
        deviceId: d.id,
        startTime: d.id === 'd13' ? '停营' : '08:00',
        endTime: d.id === 'd13' ? '维修中' : '20:30',
        maintenanceWindowStart: d.id === 'd10' ? '12:00' : undefined,
        maintenanceWindowEnd: d.id === 'd10' ? '12:30' : undefined
      })),
      approvalStatus: di === 0 ? 'approved' : 'pending',
      approvedBy: di === 0 ? '运营总监-王总' : undefined,
      approvedAt: di === 0 ? dayjs().subtract(1, 'day').format('YYYY-MM-DD 18:30:00') : undefined,
      createdAt: dayjs().subtract(di === 0 ? 1 : 0, 'day').subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      totalWaterQuota: 12000,
      totalPowerQuota: 18000,
      usedWater: di === 0 ? rand(5800, 7800) : 0,
      usedPower: di === 0 ? rand(9000, 13000) : 0
    } as ScheduleTask
  })
}
export const mockScheduleTasks = generateScheduleTasks()

export const mockHeatPoints: MapHeatPoint[] = mockSlopes
  .filter(s => s.status !== 'closed')
  .map(s => ({
    x: s.position.x,
    y: s.position.y,
    value: Math.floor((s.currentVisitors / s.capacity) * 100),
    slopeId: s.id,
    slopeName: s.name
  }))

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'danger', title: '缆车故障告警', message: '缆车E线牵引机构异常，已触发紧急制动，维修工单WO-001已生成', timestamp: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), read: false, relatedId: 'wo1', relatedType: 'workorder' },
  { id: 'n2', type: 'warning', title: '备件库存预警', message: '皮带张紧器总成已缺货（库存0/安全库存2），请及时补货', timestamp: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), read: false, relatedId: 'p9', relatedType: 'sparepart' },
  { id: 'n3', type: 'warning', title: '游客密度预警', message: '教学练习道当前密度95%，超过阈值85%，请注意游客分流', timestamp: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'), read: false, relatedId: 'a2', relatedType: 'alert' },
  { id: 'n4', type: 'alert', title: 'SOS救援警报', message: '高级道1号触发人员定位求救，救援人员已派遣', timestamp: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'), read: false, relatedId: 'rs3', relatedType: 'rescue' },
  { id: 'n5', type: 'info', title: '排程方案待审批', message: '明日（' + tomorrow + '）雪道开放与造雪排程方案已生成，请运营主管审批', timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), read: true },
  { id: 'n6', type: 'info', title: '调课申请待审批', message: '学员刘芳申请将今日10点课程改期至明天，请主管审批', timestamp: dayjs().subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'), read: true },
  { id: 'n7', type: 'success', title: '维保工单完成', message: '造雪机P1-01计划维保已完成WO-003，设备恢复正常', timestamp: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), read: true },
  { id: 'n8', type: 'warning', title: '气象预警', message: '今晚20:00起预计有中到大雪，最低气温-16℃，请做好造雪及车辆防护', timestamp: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'), read: false }
]
