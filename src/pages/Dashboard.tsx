import React, { useMemo } from 'react'
import { Row, Col, Card, Statistic, Progress, List, Tag, Space, Typography, Divider, App as AntdApp, Tooltip, Badge, Avatar } from 'antd'
import {
  UserOutlined, CloudOutlined, ThunderboltOutlined, AlertOutlined,
  RiseOutlined, TeamOutlined, ToolOutlined, EnvironmentOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined,
  ClockCircleOutlined, CalendarOutlined, ScheduleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import type { Slope, Device, DensityAlert, RescueRecord, WorkOrder, ScheduleTask } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const statusColorMap: Record<string, string> = {
  open: 'green', partial: 'orange', closed: 'red', maintenance: 'purple',
  running: 'green', stopped: 'default', warning: 'orange', fault: 'red',
  pending: 'orange', approved: 'green', rejected: 'red',
  dispatched: 'blue', arrived: 'cyan', in_progress: 'processing', completed: 'green',
  assigned: 'blue', cancelled: 'default'
}
const statusTextMap: Record<string, string> = {
  open: '开放中', partial: '部分开放', closed: '关闭', maintenance: '维护中',
  running: '运行中', stopped: '停机', warning: '告警', fault: '故障',
  pending: '待审批', approved: '已批准', rejected: '已拒绝',
  dispatched: '已派出', arrived: '已到达', in_progress: '处理中', completed: '已完成',
  assigned: '已派单'
}

const difficultyMap: Record<string, { color: string; text: string }> = {
  beginner: { color: 'green', text: '初级' },
  intermediate: { color: 'blue', text: '中级' },
  advanced: { color: 'orange', text: '高级' },
  expert: { color: 'red', text: '专家' }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const {
    slopes, devices, weather, statistics, densityAlerts, rescueRecords,
    workOrders, scheduleTasks, coaches, bookings, spareParts,
    setBookingFilter, setWorkOrderFilter
  } = useAppStore()

  const today = dayjs().format('YYYY-MM-DD')
  const coachCount = coaches.length

  const todayBookings = bookings.filter(b => b.date === today)
  const bookingCount = todayBookings.filter(b => b.approvalStatus === 'approved' || b.status === 'in_progress' || b.status === 'completed').length

  const pendingBookings = todayBookings.filter(b => b.approvalStatus === 'pending')
  const inProgressBookings = todayBookings.filter(b => b.status === 'in_progress')
  const lowStockParts = spareParts.filter(p => p.stock < p.safeStock)

  const todayStats = statistics[statistics.length - 1]
  const yesterdayStats = statistics[statistics.length - 2]
  const currentWeather = weather[0]

  const kpis = useMemo(() => ([
    {
      title: '今日入园游客',
      value: todayStats.totalVisitors,
      suffix: '人',
      icon: <UserOutlined />,
      color: '#1677ff',
      trend: yesterdayStats ? ((todayStats.totalVisitors - yesterdayStats.totalVisitors) / yesterdayStats.totalVisitors * 100).toFixed(1) : '0'
    },
    {
      title: '实时在场人数',
      value: slopes.reduce((sum, s) => sum + s.currentVisitors, 0),
      suffix: '人',
      icon: <EnvironmentOutlined />,
      color: '#52c41a',
      trend: '+3.2%'
    },
    {
      title: '开放雪道',
      value: `${slopes.filter(s => s.status === 'open' || s.status === 'partial').length}/${slopes.length}`,
      suffix: '条',
      icon: <CheckCircleOutlined />,
      color: '#13c2c2',
      trend: ''
    },
    {
      title: '运行设备',
      value: `${devices.filter(d => d.status === 'running').length}/${devices.length}`,
      suffix: '台',
      icon: <ThunderboltOutlined />,
      color: '#722ed1',
      trend: ''
    },
    {
      title: '今日营收',
      value: todayStats.revenue,
      prefix: '¥',
      icon: <RiseOutlined />,
      color: '#eb2f96',
      trend: yesterdayStats ? ((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100).toFixed(1) : '0'
    },
    {
      title: '活跃预警',
      value: densityAlerts.filter(a => !a.resolved).length,
      suffix: '条',
      icon: <AlertOutlined />,
      color: '#fa8c16',
      trend: ''
    }
  ]), [todayStats, yesterdayStats, slopes, devices, densityAlerts])

  const visitorsByHourOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const today = todayStats?.visitorsByHour || Array(24).fill(0)
    const yesterday = yesterdayStats?.visitorsByHour || Array(24).fill(0)
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['今日', '昨日'], right: 10, top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: '人次' },
      series: [
        { name: '今日', type: 'bar', data: today, itemStyle: { color: '#1677ff' }, barMaxWidth: 18 },
        { name: '昨日', type: 'line', data: yesterday, smooth: true, itemStyle: { color: '#52c41a' }, lineStyle: { width: 2 } }
      ]
    }
  }, [todayStats, yesterdayStats])

  const slopeMapOption = useMemo(() => {
    const slopeData = slopes.map(s => ({
      value: [s.position.x, s.position.y, Math.floor((s.currentVisitors / s.capacity) * 100)],
      name: s.name,
      slopeId: s.id,
      status: s.status,
      current: s.currentVisitors,
      capacity: s.capacity,
      difficulty: s.difficulty
    }))
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const d = params.data
          return `<b>${d.name}</b><br/>状态：${statusTextMap[d.status] || d.status}<br/>
            当前/容量：${d.current}/${d.capacity}人<br/>密度：${d.value[2]}%`
        }
      },
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { show: false, min: 100, max: 900 },
      yAxis: { show: false, min: 100, max: 620, inverse: true },
      series: [
        {
          type: 'scatter',
          symbolSize: (val: number[]) => Math.max(30, val[2] * 0.6 + 20),
          data: slopeData,
          itemStyle: {
            color: (params: any) => {
              const d = params.data
              if (d.status === 'closed') return '#bfbfbf'
              const pct = d.value[2]
              if (pct > 85) return '#ff4d4f'
              if (pct > 70) return '#faad14'
              if (pct > 40) return '#1677ff'
              return '#52c41a'
            },
            opacity: 0.75
          },
          label: {
            show: true,
            formatter: (params: any) => params.data.name.slice(0, 4),
            position: 'inside',
            fontSize: 10,
            color: '#fff',
            fontWeight: 'bold'
          },
          emphasis: { scale: true }
        }
      ],
      graphic: [
        { type: 'text', left: 20, top: 20, style: { text: '● 雪场电子地图（实时密度热力）', fontSize: 13, fill: '#595959', fontWeight: 'bold' } },
        { type: 'text', left: 20, bottom: 20, style: { text: '图例：', fontSize: 11, fill: '#8c8c8c' } },
        { type: 'circle', left: 70, bottom: 14, shape: { r: 6 }, style: { fill: '#52c41a', opacity: 0.75 } },
        { type: 'text', left: 82, bottom: 18, style: { text: '低密', fontSize: 11, fill: '#595959' } },
        { type: 'circle', left: 120, bottom: 14, shape: { r: 6 }, style: { fill: '#1677ff', opacity: 0.75 } },
        { type: 'text', left: 132, bottom: 18, style: { text: '正常', fontSize: 11, fill: '#595959' } },
        { type: 'circle', left: 172, bottom: 14, shape: { r: 6 }, style: { fill: '#faad14', opacity: 0.75 } },
        { type: 'text', left: 184, bottom: 18, style: { text: '较高', fontSize: 11, fill: '#595959' } },
        { type: 'circle', left: 224, bottom: 14, shape: { r: 6 }, style: { fill: '#ff4d4f', opacity: 0.75 } },
        { type: 'text', left: 236, bottom: 18, style: { text: '过高', fontSize: 11, fill: '#595959' } }
      ]
    }
  }, [slopes])

  const deviceDistributionOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c}台 ({d}%)' },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: devices.filter(d => d.status === 'running').length, name: '运行中', itemStyle: { color: '#52c41a' } },
        { value: devices.filter(d => d.status === 'stopped').length, name: '停机', itemStyle: { color: '#8c8c8c' } },
        { value: devices.filter(d => d.status === 'warning').length, name: '告警', itemStyle: { color: '#faad14' } },
        { value: devices.filter(d => d.status === 'fault').length, name: '故障', itemStyle: { color: '#ff4d4f' } },
        { value: devices.filter(d => d.status === 'maintenance').length, name: '维保', itemStyle: { color: '#722ed1' } }
      ]
    }]
  }), [devices])

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        {kpis.map((k, i) => (
          <Col xs={24} sm={12} md={8} xl={4} key={i}>
            <Card className="stat-card" bodyStyle={{ padding: 16 }} hoverable
              onClick={() => {
                if (i === 5) navigate('/safety')
                else if (i === 2) navigate('/schedule')
                else if (i === 3) navigate('/device')
                else if (i === 0 || i === 4) navigate('/statistics')
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{k.title}</Text>
                  <Statistic
                    value={k.value}
                    prefix={k.prefix}
                    suffix={k.suffix}
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: '#262626', marginTop: 4 }}
                  />
                  {k.trend && (
                    <div style={{ marginTop: 4, fontSize: 11 }}>
                      {Number(k.trend) >= 0 ? <Tag color="green">↑ {k.trend}%</Tag> : <Tag color="red">↓ {k.trend.replace('-', '')}%</Tag>}
                      <span style={{ color: '#8c8c8c', marginLeft: 4 }}>较昨日</span>
                    </div>
                  )}
                </div>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${k.color}15`, color: k.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>
                  {k.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            className="stat-card"
            title={<Space><EnvironmentOutlined style={{ color: '#1677ff' }} />雪场电子地图 - 实时游客密度热力</Space>}
            extra={<Tag color="processing">实时更新</Tag>}
            bodyStyle={{ padding: 8 }}
            hoverable
            onClick={() => navigate('/statistics')}
          >
            <ReactECharts option={slopeMapOption} style={{ height: 340 }} notMerge />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="stat-card"
            title={<Space><CloudOutlined style={{ color: '#13c2c2' }} />实时气象 & 环境监测</Space>}
            extra={<Tag color="blue">{weather[0].weatherCondition}</Tag>}
            hoverable
            onClick={() => navigate('/data-center')}
          >
            <Row gutter={[8, 12]} style={{ marginBottom: 12 }}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 300, color: currentWeather.temperature < 0 ? '#1677ff' : '#fa8c16' }}>
                  {currentWeather.temperature}°
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>当前温度</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 500, color: '#262626' }}>{currentWeather.humidity}%</div>
                <Text type="secondary" style={{ fontSize: 11 }}>相对湿度</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 500, color: '#262626' }}>{currentWeather.windSpeed}m/s</div>
                <Text type="secondary" style={{ fontSize: 11 }}>{currentWeather.windDirection}</Text>
              </Col>
            </Row>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> 能见度</Text>
                  <Text strong style={{ fontSize: 12 }}>{currentWeather.visibility}m</Text>
                </div>
                <Progress percent={Math.min(100, currentWeather.visibility / 50)} status={currentWeather.visibility < 1000 ? 'exception' : 'normal'} size="small" style={{ marginTop: 4 }} />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>❄️ 降雪量</Text>
                  <Text strong style={{ fontSize: 12 }}>{currentWeather.snowfall}mm/h</Text>
                </div>
                <Progress percent={Math.min(100, currentWeather.snowfall * 12)} size="small" strokeColor="#1677ff" style={{ marginTop: 4 }} />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}><ThunderboltOutlined /> 气压</Text>
                  <Text strong style={{ fontSize: 12 }}>{currentWeather.pressure}hPa</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}><CalendarOutlined /> 雪质指数</Text>
                  <Text strong style={{ fontSize: 12, color: '#52c41a' }}>优</Text>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                grid: { left: 30, right: 10, top: 20, bottom: 20 },
                xAxis: { type: 'category', data: weather.slice(0, 24).map(w => w.time.slice(0, 2)), axisLabel: { fontSize: 9, interval: 2 } },
                yAxis: { type: 'value', name: '°C', nameTextStyle: { fontSize: 10 } },
                series: [{
                  type: 'line', smooth: true, symbol: 'none',
                  data: weather.slice(0, 24).map(w => w.temperature),
                  areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(22,119,255,0.35)' }, { offset: 1, color: 'rgba(22,119,255,0.02)' }] } },
                  lineStyle: { color: '#1677ff', width: 2 }
                }]
              }}
              style={{ height: 110 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={9}>
          <Card
            className="stat-card"
            title={<Space><UserOutlined style={{ color: '#52c41a' }} />24小时客流趋势</Space>}
            extra={<Tag color="success">今日 vs 昨日</Tag>}
            hoverable
            onClick={() => navigate('/statistics')}
          >
            <ReactECharts option={visitorsByHourOption} style={{ height: 280 }} />
          </Card>
        </Col>

        <Col xs={24} md={12} xl={7}>
          <Card
            className="stat-card"
            title={<Space><ToolOutlined style={{ color: '#722ed1' }} />设备运行状态</Space>}
            extra={<Tag color="purple">共{devices.length}台</Tag>}
            hoverable
            onClick={() => navigate('/device')}
          >
            <ReactECharts option={deviceDistributionOption} style={{ height: 200 }} />
            <Divider style={{ margin: '8px 0 12px' }} />
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Progress type="dashboard" percent={Math.floor(devices.filter(d => d.status === 'running').length / devices.length * 100)} width={84} />
                <Text type="secondary" style={{ fontSize: 11 }}>设备运行率</Text>
              </Col>
              <Col span={12}>
                <Progress type="dashboard" percent={87} status="active" width={84} strokeColor="#fa8c16" />
                <Text type="secondary" style={{ fontSize: 11 }}>造雪产能利用</Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <Card
            className="stat-card danger-card"
            title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} />实时告警 / 待办事项</Space>}
            extra={<Badge count={densityAlerts.filter(a => !a.resolved).length + workOrders.filter(w => w.priority === 'urgent').length} />}
            bodyStyle={{ padding: '8px 12px' }}
            hoverable
            onClick={() => navigate('/safety')}
          >
            <List
              size="small"
              dataSource={[
                ...densityAlerts.filter(a => !a.resolved).map(a => ({
                  key: a.id, type: 'alert' as const, level: a.level, title: `[密度] ${a.slopeName}`, desc: a.message, time: a.timestamp, obj: a
                })),
                ...rescueRecords.filter(r => r.status !== 'completed').map(r => ({
                  key: r.id, type: 'rescue' as const, level: r.severity === 'severe' || r.severity === 'critical' ? 'danger' : r.severity === 'moderate' ? 'warning' : 'info',
                  title: `[救援] ${r.slopeName} - ${r.incidentType === 'injury' ? '受伤' : r.incidentType === 'lost' ? '走失' : '事件'}`,
                  desc: r.description, time: r.dispatchTime, obj: r
                })),
                ...workOrders.filter(w => w.priority === 'urgent' || w.priority === 'high').slice(0, 2).map(w => ({
                  key: w.id, type: 'workorder' as const, level: w.priority === 'urgent' ? 'danger' : 'warning',
                  title: `[工单] ${w.deviceName}`, desc: w.description.slice(0, 30) + '...', time: w.createdAt, obj: w
                })),
                ...scheduleTasks.filter(s => s.approvalStatus === 'pending').map(s => ({
                  key: s.id, type: 'schedule' as const, level: 'info',
                  title: `[排程] ${s.date}排程待审批`, desc: '包含造雪/压雪/缆车计划共' + (s.snowMakingPlan.length + s.groomingPlan.length + s.cableCarPlan.length) + '项',
                  time: s.createdAt, obj: s
                })),
                ...bookings.filter(b => b.approvalStatus === 'pending').map(b => ({
                  key: b.id, type: 'booking' as const, level: 'info',
                  title: `[调课] ${b.studentName} - ${b.date}`, desc: b.rescheduleReason || '新课预约审批', time: b.date, obj: b
                }))
              ].slice(0, 8)}
              renderItem={(item) => (
                <List.Item style={{ padding: '6px 0', cursor: 'pointer', borderBottom: '1px dashed #f0f0f0' }}
                  onClick={() => {
                    if (item.type === 'rescue' || item.type === 'alert') navigate('/safety')
                    else if (item.type === 'workorder') {
                      const wo = item.obj as WorkOrder
                      setWorkOrderFilter({ priority: wo.priority })
                      navigate(`/device?tab=workorders&priority=${wo.priority}`)
                    }
                    else if (item.type === 'schedule') navigate('/schedule')
                    else if (item.type === 'booking') {
                      setBookingFilter({ approvalStatus: 'pending' })
                      navigate('/coach?tab=approvals')
                    }
                    message.info('已跳转到对应模块')
                  }}>
                  <List.Item.Meta
                    avatar={
                      item.level === 'danger' || item.level === 'critical' ? <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /> :
                      item.level === 'warning' ? <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16 }} /> :
                      <CheckCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                    }
                    title={
                      <Space size={6}>
                        <Text strong style={{ fontSize: 12 }}>{item.title}</Text>
                        {item.level === 'danger' && <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>紧急</Tag>}
                        {item.level === 'warning' && <Tag color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>重要</Tag>}
                      </Space>
                    }
                    description={<span style={{ fontSize: 11, color: '#595959' }}>{item.desc}</span>}
                  />
                  <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{String(item.time).slice(11)}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            className="stat-card info-card"
            title={<Space><ScheduleOutlined style={{ color: '#1677ff' }} />雪道开放状态一览</Space>}
            extra={<Tag color="blue">今日雪况</Tag>}
            hoverable
            onClick={() => navigate('/schedule')}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={[8, 8]}>
              {slopes.map(s => (
                <Col xs={12} sm={8} md={6} key={s.id}>
                  <div style={{
                    padding: 8, borderRadius: 6,
                    background: s.status === 'closed' ? '#fafafa' : '#fff',
                    border: '1px solid ' + (s.status === 'closed' ? '#f0f0f0' : '#e8e8e8'),
                    opacity: s.status === 'closed' ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 12 }}>{s.name}</Text>
                      <Tag color={difficultyMap[s.difficulty].color} style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                        {difficultyMap[s.difficulty].text}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Tag color={statusColorMap[s.status]} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {statusTextMap[s.status]}
                      </Tag>
                      <span style={{ fontSize: 10, color: '#8c8c8c', marginLeft: 4 }}>❄️{s.snowThickness}cm</span>
                    </div>
                    <Progress
                      percent={Math.floor((s.currentVisitors / s.capacity) * 100)}
                      size="small"
                      status={s.status === 'closed' ? 'normal' :
                        Math.floor((s.currentVisitors / s.capacity) * 100) > 85 ? 'exception' :
                        Math.floor((s.currentVisitors / s.capacity) * 100) > 70 ? 'active' : 'normal'}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ fontSize: 10, color: '#595959', textAlign: 'right' }}>
                      {s.currentVisitors}/{s.capacity}人
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            className="stat-card success-card"
            title={<Space><TeamOutlined style={{ color: '#52c41a' }} />教练排班概况</Space>}
            extra={<Tag color="green">今日</Tag>}
            hoverable
            onClick={() => {
              setBookingFilter({ date: today, approvalStatus: 'pending' })
              navigate('/coach?tab=approvals')
            }}
          >
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>在岗教练</Text>}
              value={coaches.filter(c => c.status === 'on_duty').length}
              suffix={`/ ${coachCount}`}
              valueStyle={{ fontSize: 26, color: '#262626' }}
              style={{ marginBottom: 8 }}
            />
            <Divider style={{ margin: '6px 0 10px' }} />
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation()
                  setBookingFilter({ date: today })
                  navigate('/coach?tab=schedules')
                }}>
                  <Statistic title={<span style={{ fontSize: 11 }}>今日课时</span>} value={bookingCount} valueStyle={{ fontSize: 18 }} />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation()
                  setBookingFilter({ date: today, approvalStatus: 'pending' })
                  navigate('/coach?tab=approvals')
                }}>
                  <Statistic title={<span style={{ fontSize: 11 }}>待审批</span>}
                    value={pendingBookings.length}
                    valueStyle={{ fontSize: 18, color: '#fa8c16' }} />
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '10px 0' }} />
            <List
              size="small"
              dataSource={inProgressBookings}
              renderItem={(b) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar size={22} style={{ background: '#1677ff', fontSize: 11 }}>{b.coachName[0]}</Avatar>}
                    title={<Text style={{ fontSize: 11 }}>{b.coachName}</Text>}
                    description={<Text type="secondary" style={{ fontSize: 10 }}>{b.studentName} {b.startTime}</Text>}
                  />
                  <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>上课中</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            className="stat-card warning-card"
            title={<Space><ToolOutlined style={{ color: '#faad14' }} />维保工单 & 库存</Space>}
            extra={<Tag color="orange">进行中{workOrders.filter(w => w.status === 'in_progress').length}</Tag>}
            hoverable
            onClick={() => {
              setWorkOrderFilter({ priority: 'high' })
              navigate('/device?tab=workorders&priority=high')
            }}
          >
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <div style={{ cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation()
                  setWorkOrderFilter({ priority: 'urgent' })
                  navigate('/device?tab=workorders&priority=urgent')
                }}>
                  <Statistic title={<span style={{ fontSize: 11 }}>紧急</span>} value={workOrders.filter(w => w.priority === 'urgent').length} valueStyle={{ fontSize: 18, color: '#ff4d4f' }} />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation()
                  setWorkOrderFilter({ priority: 'high' })
                  navigate('/device?tab=workorders&priority=high')
                }}>
                  <Statistic title={<span style={{ fontSize: 11 }}>高优</span>} value={workOrders.filter(w => w.priority === 'high').length} valueStyle={{ fontSize: 18, color: '#fa8c16' }} />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation()
                  setWorkOrderFilter({ status: 'pending' })
                  navigate('/device?tab=workorders&status=pending')
                }}>
                  <Statistic title={<span style={{ fontSize: 11 }}>待派</span>} value={workOrders.filter(w => w.status === 'pending').length} valueStyle={{ fontSize: 18, color: '#1677ff' }} />
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '10px 0' }} />
            <Title level={5} style={{ fontSize: 12, margin: '0 0 8px', color: '#8c8c8c' }}>⚠️ 备件预警</Title>
            <List
              size="small"
              dataSource={lowStockParts.slice(0, 4)}
              renderItem={(p) => (
                <Tooltip title={`安全库存：${p.safeStock}${p.unit}，当前库存：${p.stock}${p.unit}`}>
                  <List.Item style={{ padding: '4px 0', cursor: 'pointer' }}>
                    <Text style={{ fontSize: 11, flex: 1 }}>{p.name}</Text>
                    <Text type="danger" strong style={{ fontSize: 11 }}>{p.stock}/{p.safeStock}{p.unit}</Text>
                  </List.Item>
                </Tooltip>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
