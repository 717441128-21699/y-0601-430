import React, { useMemo, useState } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider,
  Button, App as AntdApp, Modal, Form, Input, Select, Avatar, List, Drawer, Badge,
  Tooltip, Timeline, Empty, Alert, Radio, Steps
} from 'antd'
import {
  SafetyOutlined, EnvironmentOutlined, WarningOutlined, UserOutlined,
  AlertOutlined, PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined,
  MedicineBoxOutlined, HeartOutlined, TeamOutlined, HistoryOutlined,
  ThunderboltOutlined, ReloadOutlined, SendOutlined, PlayCircleOutlined,
  AimOutlined, ManOutlined, GlobalOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { DensityAlert, RescueRecord, Rescuer, VisitorLocation, Slope } from '@/types'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps

const alertLevelColor: Record<string, string> = {
  info: 'blue', warning: 'orange', danger: 'red', critical: 'red'
}

const SafetyMonitoring: React.FC = () => {
  const { message, modal } = AntdApp.useApp()
  const {
    densityAlerts, rescueRecords, rescuers, visitorLocations, slopes,
    updateRescueRecord, assignRescuers, addNotification
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedRescue, setSelectedRescue] = useState<RescueRecord | null>(null)
  const [rescueDrawerVisible, setRescueDrawerVisible] = useState(false)
  const [assignModal, setAssignModal] = useState<RescueRecord | null>(null)
  const [assignForm] = Form.useForm()
  const [resolvedFilter, setResolvedFilter] = useState<boolean | 'all'>('all')

  const totalVisitors = visitorLocations.length
  const unresolvedAlerts = densityAlerts.filter(a => !a.resolved)
  const activeRescues = rescueRecords.filter(r => r.status !== 'completed')
  const completedToday = rescueRecords.filter(r => r.status === 'completed' && dayjs(r.endTime!).isSame(dayjs(), 'day'))

  const filteredAlerts = useMemo(() => {
    if (resolvedFilter === 'all') return densityAlerts
    return densityAlerts.filter(a => a.resolved === !resolvedFilter)
  }, [densityAlerts, resolvedFilter])

  const densityMapOption = useMemo(() => {
    const slopeData = slopes.filter(s => s.status !== 'closed').map(s => ({
      value: [s.position.x, s.position.y, Math.floor((s.currentVisitors / s.capacity) * 100)],
      name: s.name,
      slopeId: s.id,
      current: s.currentVisitors,
      capacity: s.capacity
    }))
    const visitorPoints = visitorLocations.slice(0, 300).map(v => [v.x, v.y])
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => p.seriesName === '游客定位' ? `游客ID: ${p.dataIndex}` :
          `<b>${p.data.name}</b><br/>当前：${p.data.current}/${p.data.capacity}人<br/>密度：${p.data.value[2]}%`
      },
      grid: { left: 10, right: 10, top: 30, bottom: 10 },
      xAxis: { show: false, min: 100, max: 900 },
      yAxis: { show: false, min: 100, max: 620, inverse: true },
      series: [
        {
          name: '游客定位',
          type: 'scatter',
          symbolSize: 6,
          data: visitorPoints,
          itemStyle: { color: 'rgba(22,119,255,0.5)' },
          emphasis: { disabled: true }
        },
        {
          name: '雪道密度',
          type: 'scatter',
          symbolSize: (val: number[]) => Math.max(40, val[2] * 0.7 + 25),
          data: slopeData,
          itemStyle: {
            color: (p: any) => {
              const v = p.data.value[2]
              if (v > 85) return 'rgba(255,77,79,0.75)'
              if (v > 70) return 'rgba(250,173,20,0.75)'
              if (v > 40) return 'rgba(22,119,255,0.7)'
              return 'rgba(82,196,26,0.7)'
            },
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: (p: any) => `${p.data.name.slice(0, 4)}\n${p.data.value[2]}%`,
            position: 'inside',
            fontSize: 11,
            color: '#fff',
            fontWeight: 'bold',
            lineHeight: 14
          },
          zlevel: 10
        }
      ],
      graphic: [
        { type: 'text', left: 20, top: 8, style: { text: '🗺️ 实时人员定位 & 雪道密度热力图（UWB信号源）', fontSize: 12, fill: '#262626', fontWeight: 'bold' } }
      ]
    }
  }, [slopes, visitorLocations])

  const densityTrendOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const slopeNames = ['s1', 's6', 's9', 's10']
    const colors = ['#1677ff', '#fa8c16', '#52c41a', '#722ed1']
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['初级道A区', '高级道1号', '教学练习道', '地形公园'], top: 0 },
      grid: { left: 45, right: 10, top: 35, bottom: 30 },
      xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' }, name: '密度' },
      series: slopeNames.map((id, i) => {
        const slope = slopes.find(s => s.id === id)
        return {
          name: slope?.name,
          type: 'line',
          smooth: true,
          symbol: 'none',
          areaStyle: { opacity: 0.12 },
          itemStyle: { color: colors[i] },
          lineStyle: { width: 2 },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1 },
            data: [{ yAxis: 85, label: { formatter: '预警阈值', fontSize: 10, color: '#ff4d4f' } }]
          },
          data: hours.map((_, hi) => {
            const base = [0.3, 0.75, 0.55, 0.4][i]
            const hourFactor = hi < 8 ? 0 : hi < 11 ? 0.3 + hi * 0.1 : hi < 14 ? 0.8 + Math.random() * 0.1 : hi < 17 ? 0.9 + Math.random() * 0.05 : hi < 20 ? 0.6 : 0.1
            return Math.min(99, Math.floor((base * 0.4 + hourFactor * 0.6) * 100 + (Math.random() - 0.5) * 10))
          })
        }
      })
    }
  }, [slopes])

  const alertColumns: ColumnsType<DensityAlert> = [
    { title: '级别', dataIndex: 'level', key: 'level', width: 80,
      render: (l) => {
        const iconMap: Record<string, React.ReactNode> = {
          info: <AlertOutlined style={{ color: '#1677ff' }} />,
          warning: <WarningOutlined style={{ color: '#faad14' }} />,
          danger: <AlertOutlined style={{ color: '#ff4d4f' }} />,
          critical: <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
        }
        return <Space>{iconMap[l]}<Tag color={alertLevelColor[l]}>{l === 'info' ? '提示' : l === 'warning' ? '警告' : l === 'danger' ? '危险' : '危急'}</Tag></Space>
      }
    },
    { title: '雪道区域', dataIndex: 'slopeName', key: 'slopeName', width: 140,
      render: (n) => <Space><EnvironmentOutlined style={{ color: '#1677ff' }} /><Text strong>{n}</Text></Space>
    },
    { title: '当前密度', key: 'density', width: 220,
      render: (_, r) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>{(r.currentDensity * 100).toFixed(0)}%</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>阈值 {(r.threshold * 100)}%</Text>
          </div>
          <Progress percent={Math.floor(r.currentDensity * 100)} showInfo={false} size="small"
            status={r.currentDensity >= r.threshold ? 'exception' : r.currentDensity >= r.threshold * 0.85 ? 'active' : 'normal'} />
        </Space>
      )
    },
    { title: '建议', dataIndex: 'message', key: 'message', ellipsis: true, render: (t) => <Text style={{ fontSize: 12 }}>{t}</Text> },
    { title: '触发时间', dataIndex: 'timestamp', key: 'timestamp', width: 140,
      render: (t) => <Text type="secondary" style={{ fontSize: 11 }}>{t.slice(11)}</Text>
    },
    { title: '状态', dataIndex: 'resolved', key: 'resolved', width: 80,
      render: (v) => v ? <Tag color="green" icon={<CheckCircleOutlined />}>已解除</Tag> : <Badge status="processing" text={<Tag color="orange">监测中</Tag>} />
    },
    { title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          {!r.resolved && <Button size="small" type="primary" ghost onClick={() => {
            updateRescueRecord ? null : null
            message.success('已向该区域发送疏导广播')
            addNotification({ type: 'info', title: '广播已下发', message: `${r.slopeName}疏导广播已发送` })
          }}>广播疏导</Button>}
          {!r.resolved && <Button size="small" onClick={() => {
            updateRescueRecord ? null : null
            message.info('已标记为关注中，系统将持续监测')
          }}>标记关注</Button>}
        </Space>
      )
    }
  ]

  const rescueColumns: ColumnsType<RescueRecord> = [
    { title: '救援编号', dataIndex: 'id', key: 'id', width: 70, render: (v) => <Text code style={{ fontSize: 11 }}>{v.toUpperCase()}</Text> },
    { title: '事件类型/严重度', key: 'type', width: 140,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Tag color={r.incidentType === 'injury' ? 'red' : r.incidentType === 'lost' ? 'orange' : r.incidentType === 'equipment' ? 'blue' : r.incidentType === 'avalanche' ? 'magenta' : 'default'}>
            <MedicineBoxOutlined /> {r.incidentType === 'injury' ? '受伤' : r.incidentType === 'lost' ? '走失' : r.incidentType === 'equipment' ? '设备故障' : r.incidentType === 'avalanche' ? '雪崩' : '其他'}
          </Tag>
          <Tag color={r.severity === 'critical' || r.severity === 'severe' ? 'red' : r.severity === 'moderate' ? 'orange' : 'green'}
            icon={r.severity === 'critical' ? <AlertOutlined /> : r.severity === 'severe' ? <HeartOutlined /> : <CheckCircleOutlined />}
            style={{ fontSize: 10 }}>
            {r.severity === 'critical' ? '危急' : r.severity === 'severe' ? '严重' : r.severity === 'moderate' ? '中等' : '轻微'}
          </Tag>
        </Space>
      )
    },
    { title: '位置', key: 'loc', width: 140,
      render: (_, r) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
          <div>
            <Text strong style={{ fontSize: 12 }}>{r.slopeName}</Text>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{r.locationDescription}</Text>
          </div>
        </Space>
      )
    },
    { title: '救援人员', dataIndex: 'rescuerNames', key: 'rescuerNames', width: 130,
      render: (names: string[]) => names.length ? (
        <Space wrap size={3}>
          {names.map((n, i) => <Avatar key={i} size={20} style={{ background: ['#1677ff', '#52c41a', '#722ed1'][i % 3], fontSize: 10 }} title={n}>{n[0]}</Avatar>)}
        </Space>
      ) : <Tag color="red" icon={<AlertOutlined />}>未派遣</Tag>
    },
    { title: '救援用时', key: 'time', width: 140,
      render: (_, r) => {
        const stages = [
          { name: '派遣', time: r.dispatchTime, done: true },
          { name: '到达', time: r.arrivalTime, done: !!r.arrivalTime },
          { name: '处置', time: r.startTime, done: !!r.startTime },
          { name: '完成', time: r.endTime, done: !!r.endTime }
        ]
        return (
          <div>
            <div style={{ fontSize: 11, marginBottom: 2 }}>
              {r.totalMinutes ? <Tag color="blue" icon={<ClockCircleOutlined />}>{r.totalMinutes}分钟</Tag> : <Text type="secondary">进行中</Text>}
            </div>
            <Progress percent={Math.floor(stages.filter(s => s.done).length / stages.length * 100)} size="small" showInfo={false} />
          </div>
        )
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => ({
        dispatched: <Tag color="blue" icon={<SendOutlined />}>已派出</Tag>,
        arrived: <Tag color="cyan" icon={<AimOutlined />}>已到达</Tag>,
        in_progress: <Badge status="processing" text={<Tag color="processing" icon={<PlayCircleOutlined />}>处置中</Tag>} />,
        completed: <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>
      } as any)[s]
    },
    { title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          <Button size="small" type="link" onClick={() => { setSelectedRescue(r); setRescueDrawerVisible(true) }}>详情</Button>
          {r.rescuerIds.length === 0 && r.status === 'dispatched' && (
            <Button size="small" type="primary" onClick={() => { setAssignModal(r); assignForm.resetFields() }}>指派救援</Button>
          )}
          {r.status !== 'completed' && <Button size="small" danger ghost onClick={() => {
            Modal.confirm({
              title: '确认完成救援',
              content: '请确认已完成所有处置工作，伤者已妥善安置。',
              onOk: () => {
                updateRescueRecord(r.id, {
                  status: 'completed',
                  endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                  totalMinutes: dayjs().diff(dayjs(r.dispatchTime), 'minute')
                })
                message.success('救援记录已完成！')
                addNotification({ type: 'success', title: '救援任务完成', message: `${r.slopeName}救援任务已完成，用时 ${dayjs().diff(dayjs(r.dispatchTime), 'minute')} 分钟` })
              }
            })
          }}>完成</Button>}
        </Space>
      )
    }
  ]

  const rescuerColumns: ColumnsType<Rescuer> = [
    { title: '救援人员', key: 'r', width: 160,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: r.status === 'available' ? '#52c41a' : r.status === 'on_mission' ? '#1677ff' : '#bfbfbf', fontSize: 13 }}>
            {r.name[0]}
          </Avatar>
          <div>
            <Text strong>{r.name}</Text>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{r.employeeId}</div>
          </div>
        </Space>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => ({
        available: <Badge status="success" text={<Tag color="green">待命</Tag>} />,
        on_mission: <Badge status="processing" text={<Tag color="blue">出警中</Tag>} />,
        off_duty: <Badge status="default" text={<Tag color="default">休息</Tag>} />
      } as any)[s]
    },
    { title: '资质证书', dataIndex: 'certifications', key: 'cert',
      render: (c: string[]) => <Space wrap>{c.slice(0, 2).map((x, i) => <Tag key={i} color="purple" style={{ fontSize: 10 }}>{x}</Tag>)}{c.length > 2 && <Tag style={{ fontSize: 10 }}>+{c.length - 2}</Tag>}</Space>
    },
    { title: '所属站点', dataIndex: 'stationId', key: 'station', width: 100,
      render: (id) => ({ stn1: '1号站（初级区）', stn2: '2号站（中高级区）', stn3: '3号站（山顶区）' } as Record<string, string>)[id]
    },
    { title: '累计救援', key: 'cnt', width: 90, render: (_, r) => <Text strong>{r.missionsCompleted}次</Text> },
    { title: '平均响应', dataIndex: 'responseTimeAvg', key: 'resp', width: 90, render: (v) => <Tag color="blue">{v}分钟</Tag> },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120, render: (p) => <span><PhoneOutlined /> {p}</span> }
  ]

  const handleAssign = (values: any) => {
    if (!assignModal) return
    assignRescuers(assignModal.id, values.rescuerIds)
    message.success(`已派遣 ${values.rescuerIds.length} 名救援人员！`)
    addNotification({ type: 'alert', title: '救援人员已派遣', message: `${assignModal.slopeName}救援：已派遣 ${values.rescuerIds.length} 名队员` })
    setAssignModal(null)
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card info-card">
            <Statistic title={<Space><GlobalOutlined /> 场内实时游客</Space>}
              value={totalVisitors} suffix="人" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning-card">
            <Statistic title={<Space><AlertOutlined /> 活跃密度预警</Space>}
              value={unresolvedAlerts.length} suffix="条" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card danger-card">
            <Statistic title={<Space><MedicineBoxOutlined /> 进行中救援</Space>}
              value={activeRescues.length} suffix="起" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card success-card">
            <Statistic title={<Space><TeamOutlined /> 待命救援人员</Space>}
              value={rescuers.filter(r => r.status === 'available').length}
              suffix={`/${rescuers.length}人`} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card className="stat-card" title={<Space><GlobalOutlined style={{ color: '#1677ff' }} />实时人员定位与雪道密度热力</Space>}
            extra={<Space><Badge status="processing" text="UWB信号连接正常" /><Button size="small" icon={<ReloadOutlined />}>刷新</Button></Space>}
            bodyStyle={{ padding: 0 }}
          >
            <ReactECharts option={densityMapOption} style={{ height: 420 }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Row gutter={[0, 12]}>
            <Col xs={24}>
              <Card className="stat-card danger-card" title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} />紧急事件 · 实时</Space>}
                bodyStyle={{ padding: 8 }}
                hoverable
                onClick={() => setActiveTab('rescues')}>
                <List
                  size="small"
                  dataSource={rescueRecords.filter(r => r.status !== 'completed').slice(0, 3)}
                  locale={{ emptyText: '暂无紧急事件' }}
                  renderItem={(r) => (
                    <List.Item style={{ padding: '6px 4px', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedRescue(r); setRescueDrawerVisible(true) }}>
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: r.severity === 'severe' || r.severity === 'critical' ? '#ff4d4f' : '#faad14' }}><HeartOutlined /></Avatar>}
                        title={
                          <Space size={4}>
                            <Text strong style={{ fontSize: 12 }}>{r.slopeName}</Text>
                            <Tag color={r.severity === 'severe' ? 'red' : 'orange'} style={{ fontSize: 10, margin: 0 }}>
                              {r.incidentType === 'injury' ? '受伤' : '事件'}
                            </Tag>
                          </Space>
                        }
                        description={<span style={{ fontSize: 11 }}>{r.description.slice(0, 28)}...</span>}
                      />
                      <Badge status={r.status === 'in_progress' ? 'processing' : r.status === 'dispatched' ? 'warning' : 'success'} />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24}>
              <Card className="stat-card warning-card" title={<Space><WarningOutlined style={{ color: '#faad14' }} />密度预警通知</Space>}
                bodyStyle={{ padding: 8 }}
                hoverable
                onClick={() => setActiveTab('alerts')}>
                <List
                  size="small"
                  dataSource={unresolvedAlerts.slice(0, 4)}
                  locale={{ emptyText: '暂无预警' }}
                  renderItem={(a) => (
                    <List.Item style={{ padding: '6px 4px' }}>
                      <List.Item.Meta
                        avatar={<a style={{ fontSize: 16 }}>{a.level === 'danger' ? '🔴' : a.level === 'warning' ? '🟠' : '🔵'}</a>}
                        title={<Text strong style={{ fontSize: 12 }}>{a.slopeName}</Text>}
                        description={
                          <span style={{ fontSize: 11 }}>
                            密度 <Text strong style={{ color: '#ff4d4f' }}>{(a.currentDensity * 100).toFixed(0)}%</Text>
                            <Text type="secondary">（阈值 {(a.threshold * 100).toFixed(0)}%）</Text>
                          </span>
                        }
                      />
                      <Text type="secondary" style={{ fontSize: 10 }}>{a.timestamp.slice(11)}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24}>
              <Card className="stat-card success-card" title={<Space><TeamOutlined style={{ color: '#52c41a' }} />救援队伍快速调度</Space>}
                bodyStyle={{ padding: 8 }}>
                <Row gutter={[6, 6]}>
                  {rescuers.map(r => (
                    <Col xs={8} key={r.id}>
                      <Tooltip title={`${r.name} - ${statusText2[r.status]} 响应 ${r.responseTimeAvg}分钟`}>
                        <div style={{
                          padding: 6, borderRadius: 6, textAlign: 'center',
                          background: r.status === 'available' ? '#f6ffed' : r.status === 'on_mission' ? '#e6f7ff' : '#fafafa',
                          border: '1px solid ' + (r.status === 'available' ? '#b7eb8f' : r.status === 'on_mission' ? '#91d5ff' : '#f0f0f0'),
                          cursor: 'pointer'
                        }}
                          onClick={() => {
                            if (r.status === 'available') {
                              message.success(`${r.name} 已标记为可派遣，请到"救援管理"分配任务`)
                            }
                          }}>
                          <Avatar size={32} style={{ background: r.status === 'available' ? '#52c41a' : r.status === 'on_mission' ? '#1677ff' : '#bfbfbf', fontSize: 14 }}>{r.name[0]}</Avatar>
                          <div style={{ fontSize: 11, marginTop: 2 }}>{r.name}</div>
                          <div style={{ fontSize: 9, color: '#8c8c8c' }}>{statusText2[r.status]}</div>
                        </div>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card className="stat-card" style={{ marginTop: 16 }} tabList={[
        { key: 'overview', tab: <span><EnvironmentOutlined /> 密度趋势</span> },
        { key: 'alerts', tab: <span><AlertOutlined /> 密度预警记录 <Badge count={unresolvedAlerts.length} size="small" /></span> },
        { key: 'rescues', tab: <span><MedicineBoxOutlined /> 救援管理 <Badge count={activeRescues.length} size="small" /></span> },
        { key: 'team', tab: <span><TeamOutlined /> 救援队伍</span> },
        { key: 'history', tab: <span><HistoryOutlined /> 历史归档</span> }
      ]} activeTabKey={activeTab} onChange={setActiveTab}
        tabBarExtraContent={activeTab === 'alerts' ? (
          <Space>
            <Radio.Group value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)} size="small">
              <Radio.Button value={'all' as any}>全部</Radio.Button>
              <Radio.Button value={false}>未解除</Radio.Button>
              <Radio.Button value={true}>已解除</Radio.Button>
            </Radio.Group>
            <Button icon={<ReloadOutlined />} size="small">刷新</Button>
          </Space>
        ) : <Button icon={<ReloadOutlined />} size="small">刷新</Button>}
      >
        {activeTab === 'overview' && (
          <div>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              {slopes.filter(s => s.status !== 'closed').map(s => {
                const pct = Math.floor(s.currentVisitors / s.capacity * 100)
                return (
                  <Col xs={24} sm={12} md={6} lg={4} key={s.id}>
                    <div style={{ padding: 10, borderRadius: 8, border: '1px solid #e8e8e8', background: pct > 85 ? '#fff1f0' : pct > 70 ? '#fffbe6' : '#f6ffed' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 12 }}>{s.name}</Text>
                        <Tag color={pct > 85 ? 'red' : pct > 70 ? 'orange' : 'green'} style={{ fontSize: 10, margin: 0 }}>
                          {pct > 85 ? '过高' : pct > 70 ? '较高' : '正常'}
                        </Tag>
                      </div>
                      <Progress percent={pct} showInfo={true} size="small"
                        format={() => `${s.currentVisitors}/${s.capacity}`}
                        status={pct > 85 ? 'exception' : pct > 70 ? 'active' : 'normal'} />
                      <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                        ❄️ {s.snowThickness}cm | {s.length}m
                      </div>
                    </div>
                  </Col>
                )
              })}
            </Row>
            <ReactECharts option={densityTrendOption} style={{ height: 320 }} />
          </div>
        )}
        {activeTab === 'alerts' && (
          <Table<DensityAlert>
            size="middle"
            dataSource={filteredAlerts}
            columns={alertColumns}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 8 }}
          />
        )}
        {activeTab === 'rescues' && (
          <div>
            {activeRescues.length > 0 && (
              <Alert type="error" showIcon style={{ marginBottom: 16 }}
                message={`有 ${activeRescues.length} 起救援正在进行中，请密切关注处置进度`}
              />
            )}
            <Table<RescueRecord>
              size="middle"
              dataSource={rescueRecords}
              columns={rescueColumns}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 8 }}
            />
          </div>
        )}
        {activeTab === 'team' && (
          <Table<Rescuer>
            size="middle"
            dataSource={rescuers}
            columns={rescuerColumns}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 8 }}
          />
        )}
        {activeTab === 'history' && (
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="本月救援总数" value={rescueRecords.length} suffix="起" />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="平均响应时间" value={4.5} suffix="分钟" valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="平均处置时长" value={28} suffix="分钟" valueStyle={{ color: '#1677ff' }} />
              </Card>
            </Col>
            <Col xs={24}>
              <ReactECharts
                style={{ height: 260 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  grid: { left: 40, right: 20, top: 30, bottom: 30 },
                  xAxis: { type: 'category', data: Array.from({ length: 30 }, (_, i) => `${i + 1}日`) },
                  yAxis: { type: 'value', name: '起' },
                  series: [{
                    type: 'bar',
                    data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5)),
                    itemStyle: { color: '#1677ff' },
                    barMaxWidth: 18
                  }]
                }}
              />
            </Col>
            <Col xs={24}>
              <Card size="small" title="最近完成的救援">
                <List
                  size="small"
                  dataSource={rescueRecords.filter(r => r.status === 'completed')}
                  renderItem={(r) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: '#52c41a' }}><CheckCircleOutlined /></Avatar>}
                        title={
                          <Space>
                            <Text strong>{r.slopeName}</Text>
                            <Tag>{r.incidentType === 'injury' ? '受伤' : '事件'}</Tag>
                            <Tag color={r.severity === 'severe' ? 'red' : 'orange'}>{r.severity}</Tag>
                            <Tag color="blue">用时 {r.totalMinutes} 分钟</Tag>
                          </Space>
                        }
                        description={`${r.patientName} - ${r.treatment}${r.transferredTo ? `，转至${r.transferredTo}` : ''}`}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>{r.endTime?.slice(0, 16)}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Drawer
        title={selectedRescue ? `救援详情 - ${selectedRescue.id.toUpperCase()}` : '救援详情'}
        width={640}
        open={rescueDrawerVisible}
        onClose={() => setRescueDrawerVisible(false)}
      >
        {selectedRescue ? (
          <div>
            <Steps size="small" direction="vertical"
              current={['dispatched', 'arrived', 'in_progress', 'completed'].indexOf(selectedRescue.status)}>
              <Step title="接警派遣" description={selectedRescue.dispatchTime} status="finish" icon={<SendOutlined />} />
              <Step title="救援人员到达" description={selectedRescue.arrivalTime || '待到达'} status={selectedRescue.arrivalTime ? 'finish' : selectedRescue.rescuerIds.length ? 'process' : 'wait'} icon={<ManOutlined />} />
              <Step title="现场处置中" description={selectedRescue.startTime || '待开始'} status={selectedRescue.startTime ? 'finish' : selectedRescue.arrivalTime ? 'process' : 'wait'} icon={<MedicineBoxOutlined />} />
              <Step title="救援完成" description={selectedRescue.endTime || '进行中'} status={selectedRescue.status === 'completed' ? 'finish' : 'wait'} icon={<CheckCircleOutlined />} />
            </Steps>

            <Divider orientation="left">事件概况</Divider>
            <Alert type={selectedRescue.severity === 'severe' ? 'error' : 'warning'} showIcon
              message={`${selectedRescue.severity === 'severe' ? '严重' : selectedRescue.severity === 'moderate' ? '中等' : '轻微'} ${selectedRescue.incidentType === 'injury' ? '受伤事件' : '其他事件'}`}
              description={`${selectedRescue.patientName}（${selectedRescue.patientAge}岁）- ${selectedRescue.description}`}
              style={{ marginBottom: 16 }}
            />

            <Row gutter={12}>
              <Col span={12}>
                <Card size="small" title={<Space><EnvironmentOutlined /> 位置信息</Space>}>
                  <Text strong>{selectedRescue.slopeName}</Text><br />
                  <Text type="secondary">{selectedRescue.locationDescription}</Text><br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    坐标：({selectedRescue.location.x}, {selectedRescue.location.y})
                  </Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={<Space><TeamOutlined /> 救援人员 ({selectedRescue.rescuerNames.length})</Space>}>
                  {selectedRescue.rescuerNames.length ? (
                    <Space wrap size={4}>
                      {selectedRescue.rescuerNames.map((n, i) => (
                        <Tag key={i} color="blue"><Avatar size={16} style={{ background: '#1677ff', fontSize: 9 }}>{n[0]}</Avatar> {n}</Tag>
                      ))}
                    </Space>
                  ) : <Tag color="red">未派遣</Tag>}
                  <Divider style={{ margin: '8px 0' }} />
                  {selectedRescue.totalMinutes ? (
                    <Statistic title={<span style={{ fontSize: 11 }}>总用时</span>} value={selectedRescue.totalMinutes} suffix="分钟" valueStyle={{ fontSize: 18, color: '#1677ff' }} />
                  ) : (
                    <Text type="secondary">救援进行中...</Text>
                  )}
                </Card>
              </Col>
            </Row>

            <Divider orientation="left" style={{ marginTop: 16 }}>处置记录</Divider>
            <Timeline mode="left">
              <Timeline.Item label={selectedRescue.dispatchTime} color="blue">
                <Text strong>接警中心</Text>：SOS信号接收成功，启动应急预案<br />
                <Text type="secondary" style={{ fontSize: 11 }}>{selectedRescue.description}</Text>
              </Timeline.Item>
              {selectedRescue.arrivalTime && (
                <Timeline.Item label={selectedRescue.arrivalTime} color="cyan">
                  <Text strong>救援人员到达</Text>：现场初步评估完成<br />
                  <Text type="secondary" style={{ fontSize: 11 }}>伤者：{selectedRescue.patientName}，{selectedRescue.patientAge}岁</Text>
                </Timeline.Item>
              )}
              {selectedRescue.startTime && (
                <Timeline.Item label={selectedRescue.startTime} color="green">
                  <Text strong>现场处置</Text>：{selectedRescue.treatment}
                </Timeline.Item>
              )}
              {selectedRescue.endTime && (
                <Timeline.Item label={selectedRescue.endTime} color="green" dot={<CheckCircleOutlined />}>
                  <Text strong>处置完成</Text>
                  {selectedRescue.transferredTo && <><br /><Text type="secondary">转运至：{selectedRescue.transferredTo}</Text></>}
                  {selectedRescue.notes && <><br /><Text type="secondary">备注：{selectedRescue.notes}</Text></>}
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        ) : <Empty />}
      </Drawer>

      <Modal
        title={<Space><SendOutlined style={{ color: '#1677ff' }} /> 指派救援人员 - {assignModal?.slopeName}</Modal>}
        open={!!assignModal}
        onCancel={() => setAssignModal(null)}
        footer={null}
      >
        {assignModal && (
          <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              message="智能推荐"
              description={`系统根据位置、资质自动推荐了最近的 ${Math.min(3, rescuers.filter(r => r.status === 'available').length)} 名救援人员，平均距离 ${(Math.random() * 3 + 0.5).toFixed(1)} 分钟路程`}
            />
            <Form.Item name="rescuerIds" label="选择派遣的救援人员" rules={[{ required: true, message: '至少选择一名救援人员' }]}
              initialValue={rescuers.filter(r => r.status === 'available').slice(0, 2).map(r => r.id)}>
              <Select mode="multiple" placeholder="请选择救援人员" optionFilterProp="label">
                {rescuers.filter(r => r.status === 'available').map(r => (
                  <Option key={r.id} value={r.id} label={r.name}>
                    <Space>
                      <Avatar size={20} style={{ background: '#52c41a', fontSize: 10 }}>{r.name[0]}</Avatar>
                      <Text strong>{r.name}</Text>
                      <Tag color="green" style={{ fontSize: 10 }}>待命</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{r.certifications[0]} | 响应 {r.responseTimeAvg}分钟</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => setAssignModal(null)}>取消</Button>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />}>确认派遣</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

const statusText2: Record<string, string> = {
  available: '待命',
  on_mission: '出警中',
  off_duty: '休息'
}

export default SafetyMonitoring
