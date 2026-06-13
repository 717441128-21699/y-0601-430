import React, { useMemo, useState } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider,
  Button, App as AntdApp, Modal, Form, Input, InputNumber, Select, Avatar, List,
  Drawer, Badge, Tooltip, Descriptions, Timeline, Empty, Alert, Steps, Radio,
  DatePicker
} from 'antd'
import {
  ToolOutlined, ThunderboltOutlined, WarningOutlined, InboxOutlined,
  CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, ReloadOutlined,
  PlusOutlined, FileTextOutlined, SettingOutlined, SafetyCertificateOutlined,
  DatabaseOutlined, SendOutlined, EditOutlined, PlayCircleOutlined,
  MedicineBoxOutlined, ContainerOutlined, HistoryOutlined, EyeOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { WorkOrder, SparePart, Device, RepairTeam, DeviceType } from '@/types'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps

const DeviceManagement: React.FC = () => {
  const { message, modal } = AntdApp.useApp()
  const {
    workOrders, spareParts, devices, repairTeams, slopes,
    updateWorkOrder, addNotification
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('workorders')
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [woDrawerVisible, setWoDrawerVisible] = useState(false)
  const [assignModal, setAssignModal] = useState<WorkOrder | null>(null)
  const [assignForm] = Form.useForm()
  const [addWoForm] = Form.useForm()
  const [addWoVisible, setAddWoVisible] = useState(false)
  const [woStatusFilter, setWoStatusFilter] = useState<string>('all')

  const filteredWorkOrders = useMemo(() => {
    if (woStatusFilter === 'all') return workOrders
    return workOrders.filter(w => w.status === woStatusFilter)
  }, [workOrders, woStatusFilter])

  const urgentCount = workOrders.filter(w => (w.priority === 'urgent' || w.priority === 'high') && w.status !== 'completed').length
  const pendingCount = workOrders.filter(w => w.status === 'pending').length
  const inProgressCount = workOrders.filter(w => w.status === 'in_progress').length
  const lowStockParts = spareParts.filter(p => p.stock < p.safeStock)

  const deviceHealthOption = useMemo(() => {
    const types: DeviceType[] = ['snowmaker', 'cablecar', 'magicarpet', 'snowgroomer']
    const typeNames: Record<DeviceType, string> = { snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车' }
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['运行中', '告警', '故障', '维保中', '停机'], top: 0 },
      grid: { left: 80, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'value', name: '台数' },
      yAxis: { type: 'category', data: types.map(t => typeNames[t]) },
      series: [
        { name: '运行中', type: 'bar', stack: 't', data: types.map(t => devices.filter(d => d.type === t && d.status === 'running').length), itemStyle: { color: '#52c41a' } },
        { name: '告警', type: 'bar', stack: 't', data: types.map(t => devices.filter(d => d.type === t && d.status === 'warning').length), itemStyle: { color: '#faad14' } },
        { name: '故障', type: 'bar', stack: 't', data: types.map(t => devices.filter(d => d.type === t && d.status === 'fault').length), itemStyle: { color: '#ff4d4f' } },
        { name: '维保中', type: 'bar', stack: 't', data: types.map(t => devices.filter(d => d.type === t && d.status === 'maintenance').length), itemStyle: { color: '#722ed1' } },
        { name: '停机', type: 'bar', stack: 't', data: types.map(t => devices.filter(d => d.type === t && d.status === 'stopped').length), itemStyle: { color: '#8c8c8c' } }
      ]
    }
  }, [devices])

  const woTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: Array.from({ length: 14 }, (_, i) => dayjs().subtract(13 - i, 'day').format('MM-DD')) },
    yAxis: { type: 'value', name: '工单数量' },
    series: [
      { name: '预防性', type: 'bar', stack: 't', data: Array.from({ length: 14 }, () => Math.floor(Math.random() * 4 + 1)), itemStyle: { color: '#1677ff' }, barMaxWidth: 18 },
      { name: '纠正性', type: 'bar', stack: 't', data: Array.from({ length: 14 }, () => Math.floor(Math.random() * 3)), itemStyle: { color: '#faad14' }, barMaxWidth: 18 },
      { name: '紧急', type: 'bar', stack: 't', data: Array.from({ length: 14 }, () => Math.floor(Math.random() * 2)), itemStyle: { color: '#ff4d4f' }, barMaxWidth: 18 }
    ],
    legend: { data: ['预防性', '纠正性', '紧急'], top: 0 }
  }

  const workOrderColumns: ColumnsType<WorkOrder> = [
    { title: '工单号', dataIndex: 'id', key: 'id', width: 80,
      render: (v) => <Text code style={{ fontSize: 11 }}>{v.toUpperCase()}</Text> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p) => {
        const colors = { urgent: 'red', high: 'orange', medium: 'blue', low: 'default' }
        const names = { urgent: '紧急', high: '高优', medium: '中', low: '低' }
        const icons = { urgent: <WarningOutlined />, high: <ThunderboltOutlined />, medium: <ClockCircleOutlined />, low: <CheckCircleOutlined /> }
        return <Tag icon={icons[p as keyof typeof icons]} color={colors[p as keyof typeof colors]} style={{ fontSize: 11 }}>
          {names[p as keyof typeof names]}
        </Tag>
      }
    },
    { title: '设备', key: 'device', width: 150,
      render: (_, r) => {
        const d = devices.find(x => x.id === r.deviceId)
        const typeColors: Record<DeviceType, string> = {
          snowmaker: 'blue', cablecar: 'purple', magicarpet: 'cyan', snowgroomer: 'geekblue'
        }
        const typeNames: Record<DeviceType, string> = {
          snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车'
        }
        return <Space>
          <SettingOutlined style={{ color: d ? (typeColors as any)[d.type] : '#888' }} />
          <div>
            <Text strong>{r.deviceName}</Text>
            {d && <Tag color={(typeColors as any)[d.type]} style={{ fontSize: 10, margin: '0 0 0 4px' }}>
              {typeNames[d.type]}
            </Tag>}
          </div>
        </Space>
      }
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (t) => ({
        preventive: <Tag color="blue" icon={<SafetyCertificateOutlined />}>预防性</Tag>,
        corrective: <Tag color="orange" icon={<EditOutlined />}>纠正性</Tag>,
        emergency: <Tag color="red" icon={<ThunderboltOutlined />}>紧急抢修</Tag>
      } as any)[t]
    },
    { title: '维修班组', key: 'team', width: 120,
      render: (_, r) => r.teamName ? (
        <Space>
          <Avatar.Group>
            {repairTeams.find(t => t.id === r.teamId)?.members.slice(0, 3).map((m, i) =>
              <Avatar key={i} size={20} style={{ background: ['#1677ff', '#52c41a', '#722ed1'][i], fontSize: 10 }}>{m[0]}</Avatar>
            )}
          </Avatar.Group>
          <Text strong style={{ fontSize: 12 }}>{r.teamName}</Text>
        </Space>
      ) : <Tag color="default" icon={<TeamOutlined />}>待分配</Tag>
    },
    { title: '进度', key: 'progress', width: 180,
      render: (_, r) => {
        const steps = ['待派单', '已派单', '维修中', '已完成']
        const cur = ['pending', 'assigned', 'in_progress', 'completed'].indexOf(r.status)
        const percent = Math.floor((cur / 3) * 100)
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Progress percent={percent} size="small"
              status={r.priority === 'urgent' && cur < 3 ? 'exception' : 'normal'} />
            <Text style={{ fontSize: 11 }}>
              {r.estimatedHours}h{r.actualHours ? ` / 实际${r.actualHours}h` : ''}
            </Text>
          </Space>
        )
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => ({
        pending: <Tag color="orange" icon={<ClockCircleOutlined />}>待派</Tag>,
        assigned: <Tag color="blue" icon={<SendOutlined />}>已派</Tag>,
        in_progress: <Badge status="processing" text={<Tag color="processing" icon={<PlayCircleOutlined />}>维修中</Tag>} />,
        completed: <Tag color="green" icon={<CheckCircleOutlined />}>完成</Tag>,
        cancelled: <Tag color="default">取消</Tag>
      } as any)[s]
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 130, render: (t) => <Text type="secondary" style={{ fontSize: 11 }}>{t.slice(5)}</Text> },
    { title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, r) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => { setSelectedWO(r); setWoDrawerVisible(true) }}>详情</Button>
          {(r.status === 'pending') && (
            <Button size="small" type="primary" onClick={() => { setAssignModal(r); assignForm.resetFields() }}>派单</Button>
          )}
          {r.status === 'assigned' && (
            <Button size="small" type="primary" ghost onClick={() => {
              updateWorkOrder(r.id, { status: 'in_progress', startedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') })
              message.success('工单状态已更新为维修中')
              addNotification({ type: 'info', title: '维修开始', message: `${r.deviceName}维保工单已开始执行` })
            }}>开始维修</Button>
          )}
          {(r.status === 'in_progress') && (
            <Button size="small" danger ghost onClick={() => {
              Modal.confirm({
                title: '确认工单完成',
                content: (
                  <div>
                    <Paragraph>设备：{r.deviceName}</Paragraph>
                    <Paragraph>确认所有维修工作已完成，设备恢复正常？</Paragraph>
                  </div>
                ),
                onOk: () => {
                  updateWorkOrder(r.id, {
                    status: 'completed',
                    completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    actualHours: r.estimatedHours + Math.floor(Math.random() * 3 - 1)
                  })
                  message.success('工单已完成！')
                  addNotification({ type: 'success', title: '维保工单完成', message: `${r.deviceName}已恢复正常运行` })
                }
              })
            }}>完成</Button>
          )}
        </Space>
      )
    }
  ]

  const sparePartColumns: ColumnsType<SparePart> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 110, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '备件名称', dataIndex: 'name', key: 'name', width: 160,
      render: (n, r) => <Space><ContainerOutlined /><Text strong>{n}</Text></Space> },
    { title: '类别', dataIndex: 'category', key: 'category', width: 100, render: (c) => <Tag color="purple">{c}</Tag> },
    { title: '适用设备', dataIndex: 'compatibleDevices', key: 'compatible', width: 160,
      render: (list: DeviceType[]) => {
        const typeNames: Record<DeviceType, string> = { snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车' }
        return <Space wrap>{list.map((t, i) => <Tag key={i} color="blue" style={{ fontSize: 11 }}>{typeNames[t]}</Tag>)}</Space>
      }
    },
    { title: '库存状态', key: 'stock', width: 220,
      render: (_, r) => {
        const pct = Math.min(100, Math.floor(r.stock / r.safeStock * 100))
        const shortage = r.stock < r.safeStock
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ color: shortage ? '#ff4d4f' : '#52c41a' }}>
                {r.stock} {r.unit}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>安全库存 {r.safeStock}{r.unit}</Text>
            </div>
            <Progress percent={pct} size="small" showInfo={false} status={shortage ? 'exception' : 'normal'} />
            {shortage && <Tag color="red" style={{ fontSize: 10, marginTop: 2 }} icon={<WarningOutlined />}>
              缺货 {(r.safeStock - r.stock)}{r.unit}
            </Tag>}
          </Space>
        )
      }
    },
    { title: '存放位置', dataIndex: 'location', key: 'location', width: 120, render: (l) => <Text type="secondary" style={{ fontSize: 11 }}>{l}</Text> },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 150, render: (s) => <Text style={{ fontSize: 11 }}>{s}</Text> },
    { title: '上次补货', dataIndex: 'lastRestock', key: 'lastRestock', width: 100, render: (d) => <Text type="secondary" style={{ fontSize: 11 }}>{d.slice(5)}</Text> },
    { title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          {r.stock < r.safeStock && <Button size="small" type="primary" onClick={() => {
            message.success(`已发起采购申请：${r.name} x${r.safeStock - r.stock + 5}${r.unit}`)
          }}>补货</Button>}
          <Button size="small" type="link">记录</Button>
        </Space>
      )
    }
  ]

  const deviceColumns: ColumnsType<Device> = [
    { title: '设备', key: 'd', width: 170,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: r.status === 'running' ? '#52c41a' : r.status === 'fault' ? '#ff4d4f' : r.status === 'warning' ? '#faad14' : '#1677ff' }}>
            <ToolOutlined />
          </Avatar>
          <div>
            <Text strong>{r.name}</Text>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{r.code}</div>
          </div>
        </Space>
      )
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (t: DeviceType) => {
        const m: Record<DeviceType, { c: string; n: string }> = {
          snowmaker: { c: 'blue', n: '造雪机' }, cablecar: { c: 'purple', n: '缆车' },
          magicarpet: { c: 'cyan', n: '魔毯' }, snowgroomer: { c: 'geekblue', n: '压雪车' }
        }
        return <Tag color={m[t].c}>{m[t].n}</Tag>
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => ({
        running: <Badge status="success" text={<Tag color="green">运行中</Tag>} />,
        stopped: <Badge status="default" text={<Tag>停机</Tag>} />,
        warning: <Badge status="warning" text={<Tag color="orange">告警</Tag>} />,
        fault: <Badge status="error" text={<Tag color="red">故障</Tag>} />,
        maintenance: <Badge status="processing" text={<Tag color="purple">维保中</Tag>} />
      } as any)[s]
    },
    { title: '位置', dataIndex: 'location', key: 'location', ellipsis: true, width: 150 },
    { title: '运行时长', key: 'rh', width: 150,
      render: (_, r) => (
        <Tooltip title={`维保周期：${r.maintenanceInterval}小时，下次：${r.nextMaintenance}`}>
          <div>
            <Text strong>{r.runHours}h</Text>
            <Progress percent={Math.min(100, Math.floor(r.runHours / r.maintenanceInterval * 100))} size="small"
              status={r.runHours > r.maintenanceInterval ? 'exception' : r.runHours > r.maintenanceInterval * 0.85 ? 'active' : 'normal'} />
          </div>
        </Tooltip>
      )
    },
    { title: '效率', dataIndex: 'efficiency', key: 'eff', width: 100,
      render: (v, r) => r.status === 'running' ? (
        <Progress percent={v} size="small" status={v < 85 ? 'exception' : 'normal'} />
      ) : <Text type="secondary">-</Text>
    },
    { title: '告警信息', dataIndex: 'warningMessage', key: 'warn', width: 200,
      render: (v) => v ? <Alert type="warning" message={v} showIcon size="small" /> : <Text type="secondary">正常</Text>
    },
    { title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => message.info(`设备详情：${r.name}`)}>详情</Button>
          {(r.runHours >= r.maintenanceInterval * 0.85 || r.status === 'warning' || r.status === 'fault') && (
            <Button size="small" type="primary" onClick={() => {
              addWoForm.setFieldsValue({
                deviceId: r.id,
                deviceName: r.name,
                deviceType: r.type,
                type: r.status === 'fault' ? 'emergency' : 'preventive',
                priority: r.status === 'fault' ? 'urgent' : 'high',
                description: r.warningMessage || `运行${r.runHours}小时，到达维保周期`
              })
              setAddWoVisible(true)
            }}>创建工单</Button>
          )}
        </Space>
      )
    }
  ]

  const handleAssign = (values: any) => {
    if (!assignModal) return
    const team = repairTeams.find(t => t.id === values.teamId)
    updateWorkOrder(assignModal.id, {
      status: 'assigned',
      teamId: values.teamId,
      teamName: team?.name,
      assignee: team?.leader,
      scheduledDate: dayjs(values.scheduledDate).format('YYYY-MM-DD')
    })
    message.success(`工单已派发给 ${team?.name}！`)
    addNotification({ type: 'info', title: '维保工单已派单', message: `${assignModal.deviceName} 工单已分配给 ${team?.name}` })
    setAssignModal(null)
  }

  const handleAddWo = (values: any) => {
    const newWo: WorkOrder = {
      ...values,
      id: 'wo_' + Date.now().toString(36),
      deviceType: values.deviceType,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      partsRequired: []
    }
    workOrders.push(newWo)
    message.success('维保工单创建成功！')
    setAddWoVisible(false)
    addWoForm.resetFields()
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className={'stat-card ' + (urgentCount > 0 ? 'danger-card' : '')}>
            <Statistic title={<Space><WarningOutlined /> 紧急/高优工单</Space>}
              value={urgentCount} suffix="项"
              valueStyle={{ color: urgentCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning-card">
            <Statistic title={<Space><ClockCircleOutlined /> 待派单</Space>}
              value={pendingCount} suffix="项" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card info-card">
            <Statistic title={<Space><PlayCircleOutlined /> 维修中</Space>}
              value={inProgressCount} suffix="项" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={'stat-card ' + (lowStockParts.length > 0 ? 'danger-card' : 'success-card')}>
            <Statistic title={<Space><InboxOutlined /> 库存预警</Space>}
              value={lowStockParts.length} suffix="项"
              valueStyle={{ color: lowStockParts.length > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card className="stat-card" title={<Space><ToolOutlined style={{ color: '#1677ff' }} />设备运行健康度分布</Space>}
            extra={<Tag color="green">共 {devices.length} 台</Tag>}>
            <ReactECharts option={deviceHealthOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="stat-card" title={<Space><FileTextOutlined style={{ color: '#faad14' }} />近2周工单趋势</Space>}>
            <ReactECharts option={woTrendOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Card className="stat-card" style={{ marginTop: 16 }}
        tabList={[
          { key: 'workorders', tab: <span><FileTextOutlined /> 维保工单管理 <Badge count={pendingCount} size="small" /></span> },
          { key: 'devices', tab: <span><ToolOutlined /> 设备台账</span> },
          { key: 'spareparts', tab: <span><ContainerOutlined /> 备件库存 <Badge count={lowStockParts.length} size="small" offset={[4, -2]}/></span> },
          { key: 'teams', tab: <span><TeamOutlined /> 维修班组</span> }
        ]}
        activeTabKey={activeTab} onChange={setActiveTab}
        tabBarExtraContent={activeTab === 'workorders' ? (
          <Space>
            <Radio.Group value={woStatusFilter} onChange={(e) => setWoStatusFilter(e.target.value)} size="small">
              <Radio.Button value="all">全部状态</Radio.Button>
              <Radio.Button value="pending">待派单</Radio.Button>
              <Radio.Button value="assigned">已派单</Radio.Button>
              <Radio.Button value="in_progress">维修中</Radio.Button>
              <Radio.Button value="completed">已完成</Radio.Button>
            </Radio.Group>
            <Button icon={<ReloadOutlined />} size="small">刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => { addWoForm.resetFields(); setAddWoVisible(true) }}>创建工单</Button>
          </Space>
        ) : activeTab === 'spareparts' ? (
          <Space>
            <Select placeholder="按类别筛选" style={{ width: 140 }} size="small" allowClear>
              {Array.from(new Set(spareParts.map(p => p.category))).map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
            <Button icon={<ReloadOutlined />} size="small">刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} size="small">入库</Button>
          </Space>
        ) : <Button icon={<ReloadOutlined />} size="small">刷新</Button>}
      >
        {activeTab === 'workorders' && (
          <Table<WorkOrder>
            size="middle"
            dataSource={filteredWorkOrders}
            columns={workOrderColumns}
            rowKey="id"
            scroll={{ x: 1350 }}
            pagination={{ pageSize: 8 }}
          />
        )}
        {activeTab === 'devices' && (
          <Table<Device>
            size="middle"
            dataSource={devices}
            columns={deviceColumns}
            rowKey="id"
            scroll={{ x: 1300 }}
            pagination={{ pageSize: 8 }}
          />
        )}
        {activeTab === 'spareparts' && (
          <div>
            {lowStockParts.length > 0 && (
              <Alert type="error" showIcon style={{ marginBottom: 16 }}
                message={`有 ${lowStockParts.length} 项备件低于安全库存，建议及时补货`}
                action={<Button size="small" type="primary" danger>一键补货申请</Button>}
              />
            )}
            <Table<SparePart>
              size="middle"
              dataSource={spareParts}
              columns={sparePartColumns}
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={{ pageSize: 8 }}
            />
          </div>
        )}
        {activeTab === 'teams' && (
          <Row gutter={[16, 16]}>
            {repairTeams.map(t => (
              <Col xs={24} sm={12} lg={6} key={t.id}>
                <Card className={'stat-card ' + (t.status === 'available' ? 'success-card' : t.status === 'busy' ? 'info-card' : 'warning-card')}
                  hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0 }}><TeamOutlined /> {t.name}</Title>
                    <Tag color={t.status === 'available' ? 'green' : t.status === 'busy' ? 'blue' : 'default'}>
                      {t.status === 'available' ? '空闲' : t.status === 'busy' ? '作业中' : '休息'}
                    </Tag>
                  </div>
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>班组长：</Text>
                    <Text strong>{t.leader}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>成员（{t.members.length}人）：</Text>
                    <Avatar.Group style={{ marginLeft: 8 }}>
                      {t.members.map((m, i) =>
                        <Tooltip key={i} title={m}>
                          <Avatar style={{ background: ['#1677ff', '#52c41a', '#722ed1', '#faad14', '#eb2f96'][i], fontSize: 11 }} size={26}>{m[0]}</Avatar>
                        </Tooltip>
                      )}
                    </Avatar.Group>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>专长设备：</Text>
                    <Space wrap style={{ marginTop: 4 }}>
                      {t.specialties.map(s => {
                        const typeNames: Record<DeviceType, string> = { snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车' }
                        return <Tag key={s} color="purple" style={{ fontSize: 11 }}>{typeNames[s]}</Tag>
                      })}
                    </Space>
                  </div>
                  {t.currentWorkOrder && (
                    <Alert type="info" showIcon size="small" message={`正在执行工单：${t.currentWorkOrder}`} />
                  )}
                  <Divider style={{ margin: '10px 0' }} />
                  <Row gutter={8}>
                    <Col span={12}>
                      <Statistic title={<span style={{ fontSize: 11 }}>已完成</span>} value={Math.floor(Math.random() * 80 + 20)} valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title={<span style={{ fontSize: 11 }}>评分</span>} value={4.8} suffix="/5.0" valueStyle={{ fontSize: 16, color: '#faad14' }} />
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Drawer
        title={selectedWO ? `工单详情 - ${selectedWO.id.toUpperCase()}` : '工单详情'}
        width={600}
        open={woDrawerVisible}
        onClose={() => setWoDrawerVisible(false)}
        extra={selectedWO ? (
          <Space>
            {selectedWO.status === 'pending' && <Button type="primary" onClick={() => { setAssignModal(selectedWO); assignForm.resetFields() }}>派单</Button>}
            {selectedWO.status === 'assigned' && <Button type="primary" onClick={() => {
              updateWorkOrder(selectedWO.id, { status: 'in_progress', startedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') })
              message.success('已开始维修')
            }}>开始维修</Button>}
            {(selectedWO.status === 'in_progress' || selectedWO.status === 'assigned') && (
              <Button danger onClick={() => {
                Modal.confirm({
                  title: '确认工单完成',
                  onOk: () => {
                    updateWorkOrder(selectedWO.id, {
                      status: 'completed',
                      completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
                    })
                    message.success('工单完成！')
                  }
                })
              }}>完成</Button>
            )}
          </Space>
        ) : null}
      >
        {selectedWO ? (
          <div>
            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="优先级"
                    value={selectedWO.priority === 'urgent' ? '紧急' : selectedWO.priority === 'high' ? '高优' : selectedWO.priority === 'medium' ? '中' : '低'}
                    valueStyle={{ fontSize: 18, color: selectedWO.priority === 'urgent' ? '#ff4d4f' : selectedWO.priority === 'high' ? '#faad14' : '#1677ff' }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="预估工时" value={selectedWO.estimatedHours} suffix="小时" valueStyle={{ fontSize: 18 }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="创建时间" value={selectedWO.createdAt.slice(5)} valueStyle={{ fontSize: 14 }} />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left" style={{ marginTop: 16 }}>工单信息</Divider>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="设备">{selectedWO.deviceName}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {selectedWO.type === 'preventive' ? <Tag color="blue">预防性维保</Tag> :
                  selectedWO.type === 'corrective' ? <Tag color="orange">纠正性维修</Tag> :
                    <Tag color="red">紧急抢修</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="维修班组">
                {selectedWO.teamName ? <Text strong>{selectedWO.teamName}（{selectedWO.assignee}）</Text> : <Tag color="orange">待分配</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="问题描述">
                <Paragraph style={{ margin: 0 }}>{selectedWO.description}</Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="计划日期">{selectedWO.scheduledDate || <Text type="secondary">待定</Text>}</Descriptions.Item>
              <Descriptions.Item label="实际工时">
                {selectedWO.actualHours ? `${selectedWO.actualHours} 小时` : <Text type="secondary">进行中</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="所需备件">
                {selectedWO.partsRequired.length ? (
                  <Space direction="vertical" size={2}>
                    {selectedWO.partsRequired.map((p, i) => (
                      <Tag key={i} color={p.fulfilled ? 'green' : 'red'} icon={p.fulfilled ? <CheckCircleOutlined /> : <WarningOutlined />} style={{ fontSize: 12 }}>
                        {p.partName} × {p.quantity} {p.fulfilled ? '已出库' : '缺货'}
                      </Tag>
                    ))}
                  </Space>
                ) : <Text type="secondary">无需备件</Text>}
              </Descriptions.Item>
              {selectedWO.notes && <Descriptions.Item label="备注">{selectedWO.notes}</Descriptions.Item>}
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 16 }}>流程进度</Divider>
            <Steps size="small" current={['pending', 'assigned', 'in_progress', 'completed'].indexOf(selectedWO.status)}>
              <Step title="创建工单" description={selectedWO.createdAt.slice(11)} icon={<FileTextOutlined />} />
              <Step title="班组派单" description={selectedWO.teamName ? `${selectedWO.teamName} ${selectedWO.scheduledDate || ''}` : '待处理'} icon={<TeamOutlined />} />
              <Step title="开始维修" description={selectedWO.startedAt || '待开始'} icon={<PlayCircleOutlined />} />
              <Step title="维修完成" description={selectedWO.completedAt || '进行中'} icon={<CheckCircleOutlined />} />
            </Steps>

            {selectedWO.status === 'completed' && (
              <Timeline mode="left" style={{ marginTop: 16 }}>
                <Timeline.Item label={selectedWO.createdAt.slice(11)} color="blue">工单创建：{selectedWO.description}</Timeline.Item>
                {selectedWO.assignee && <Timeline.Item color="purple">派单给 {selectedWO.teamName}（{selectedWO.assignee}）</Timeline.Item>}
                {selectedWO.startedAt && <Timeline.Item label={selectedWO.startedAt.slice(11)} color="cyan">开始维修作业</Timeline.Item>}
                {selectedWO.completedAt && <Timeline.Item label={selectedWO.completedAt.slice(11)} color="green" dot={<CheckCircleOutlined />}>
                  维修完成，设备恢复正常运行
                </Timeline.Item>}
              </Timeline>
            )}
          </div>
        ) : <Empty />}
      </Drawer>

      <Modal
        title={<Space><TeamOutlined style={{ color: '#1677ff' }} /> 派发维修班组</Space>}
        open={!!assignModal}
        onCancel={() => setAssignModal(null)}
        footer={null}
        width={520}
      >
        {assignModal && (
          <div>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              title="工单信息"
              description={`${assignModal.deviceName} - ${assignModal.description.slice(0, 50)}...`}
            />
            <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
              <Row gutter={12}>
                <Col xs={24} sm={14}>
                  <Form.Item label="选择维修班组" name="teamId" rules={[{ required: true, message: '请选择班组' }]}>
                    <Select placeholder="系统已根据专长智能推荐">
                      {repairTeams.filter(t => {
                        if (assignModal.priority === 'urgent') return t.status === 'available' || t.status === 'busy'
                        return t.specialties.includes(assignModal.deviceType)
                      }).map(t => (
                        <Option key={t.id} value={t.id}>
                          <Space>
                            <Tag color={t.status === 'available' ? 'green' : 'blue'} style={{ fontSize: 11 }}>
                              {t.status === 'available' ? '✅可派' : t.status === 'busy' ? '⚠️作业中' : '休息'}
                            </Tag>
                            <Text strong>{t.name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {t.members.length}人 | 专长: {t.specialties.map(s => ({
                                snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车'
                              } as Record<DeviceType, string>)[s]).join('、')}
                            </Text>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={10}>
                  <Form.Item label="计划完成日期" name="scheduledDate" rules={[{ required: true }]} initialValue={dayjs()}>
                    <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs().subtract(1, 'day'))} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '6px 0 12px' }} />
              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Space>
                  <Button onClick={() => setAssignModal(null)}>取消</Button>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />}>确认派单</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={<Space><PlusOutlined style={{ color: '#1677ff' }} /> 创建维保工单</Space>}
        open={addWoVisible}
        onCancel={() => { setAddWoVisible(false); addWoForm.resetFields() }}
        footer={null}
        width={560}
      >
        <Form form={addWoForm} layout="vertical" onFinish={handleAddWo}>
          <Row gutter={12}>
            <Col xs={24} sm={14}>
              <Form.Item label="选择设备" name="deviceId" rules={[{ required: true }]}>
                <Select placeholder="选择需要维保的设备" showSearch optionFilterProp="label">
                  {devices.map(d => (
                    <Option key={d.id} value={d.id} label={d.name}>
                      <Space>
                        <Text strong>{d.name}</Text>
                        <Tag color={({ snowmaker: 'blue', cablecar: 'purple', magicarpet: 'cyan', snowgroomer: 'geekblue' } as Record<DeviceType, string>)[d.type]} style={{ fontSize: 11 }}>
                          ({ snowmaker: '造雪机', cablecar: '缆车', magicarpet: '魔毯', snowgroomer: '压雪车' }[d.type])
                        </Tag>
                        {d.status === 'fault' && <Tag color="red" style={{ fontSize: 11 }}>故障</Tag>}
                        {d.status === 'warning' && <Tag color="orange" style={{ fontSize: 11 }}>告警</Tag>}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item label="设备名称（回显）" name="deviceName">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="设备类型" name="deviceType" rules={[{ required: true }]} initialValue="snowmaker">
                <Select>
                  <Option value="snowmaker">造雪机</Option>
                  <Option value="cablecar">缆车</Option>
                  <Option value="magicarpet">魔毯</Option>
                  <Option value="snowgroomer">压雪车</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="工单类型" name="type" rules={[{ required: true }]} initialValue="preventive">
                <Select>
                  <Option value="preventive">预防性维保（定期）</Option>
                  <Option value="corrective">纠正性维修（故障）</Option>
                  <Option value="emergency">紧急抢修</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true }]} initialValue="medium">
                <Select>
                  <Option value="urgent">🔴 紧急</Option>
                  <Option value="high">🟠 高优</Option>
                  <Option value="medium">🔵 中</Option>
                  <Option value="low">⚪ 低</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="预估工时" name="estimatedHours" rules={[{ required: true }]} initialValue={4}>
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} addonAfter="小时" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="故障/维保描述" name="description" rules={[{ required: true, message: '请填写问题描述' }]}>
                <Input.TextArea rows={3} placeholder="请详细描述故障现象或维保需求" />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '4px 0 10px' }} />
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => { setAddWoVisible(false); addWoForm.resetFields() }}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>创建工单</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DeviceManagement
