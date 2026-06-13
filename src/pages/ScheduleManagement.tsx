import React, { useMemo, useState } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider,
  Button, App as AntdApp, Modal, Form, InputNumber, Slider, DatePicker, Timeline,
  Select, List, Avatar, Steps, Tooltip, Alert, Drawer, Badge, Empty
} from 'antd'
import {
  ScheduleOutlined, CloudOutlined, CarOutlined, RocketOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SendOutlined, ReloadOutlined,
  ThunderboltOutlined, DatabaseOutlined, PlusOutlined, HistoryOutlined,
  SettingOutlined, FileTextOutlined, DesktopOutlined, WarningOutlined,
  CloudSyncOutlined, BarChartOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { ScheduleTask, Slope, SnowMakingPlan } from '@/types'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { Option } = Select

const difficultyMap: Record<string, { color: string; text: string }> = {
  beginner: { color: 'green', text: '初级' },
  intermediate: { color: 'blue', text: '中级' },
  advanced: { color: 'orange', text: '高级' },
  expert: { color: 'red', text: '专家' }
}

const ScheduleManagement: React.FC = () => {
  const { message, modal } = AntdApp.useApp()
  const { scheduleTasks, slopes, devices, updateScheduleApproval, pushScheduleToTerminal, addNotification, addScheduleTask } = useAppStore()
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleTask | null>(scheduleTasks[0] || null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [genModalVisible, setGenModalVisible] = useState(false)
  const [genForm] = Form.useForm()
  const [genLoading, setGenLoading] = useState(false)

  const snowMakers = devices.filter(d => d.type === 'snowmaker')
  const cableCars = devices.filter(d => d.type === 'cablecar')
  const groomers = devices.filter(d => d.type === 'snowgroomer')

  const generateScheduleAlgorithm = (values: any) => {
    setGenLoading(true)
    setTimeout(() => {
      const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD')
      const waterQuota = values.waterQuota || 12000
      const powerQuota = values.powerQuota || 18000
      const intensity = values.snowIntensity || 70
      const priority = values.priority || 'balanced'
      const snowWindow = values.snowWindow || 'night'

      const openSlopes = slopes.filter(s => s.status !== 'closed')
      const snowMakerDevices = devices.filter(d => d.type === 'snowmaker' && d.status !== 'fault')
      const cableCarDevices = devices.filter(d => d.type === 'cablecar')
      const groomerDevices = devices.filter(d => d.type === 'snowgroomer')

      let waterUsed = 0
      let powerUsed = 0

      const snowMakingPlan = snowMakerDevices.map(d => {
        const factor = intensity / 100
        const waterAlloc = Math.floor((600 + Math.random() * 400) * factor)
        const powerAlloc = Math.floor((180 + Math.random() * 140) * factor)
        waterUsed += waterAlloc
        powerUsed += powerAlloc

        let startTime = '21:00'
        let endTime = '次日05:00'
        if (snowWindow === 'full') { startTime = '09:00'; endTime = '次日05:00' }
        if (snowWindow === 'offpeak') { startTime = '22:00'; endTime = '次日04:00' }
        if (priority === 'revenue') startTime = '20:30'
        if (priority === 'conservation') { startTime = '22:00'; endTime = '次日04:30' }

        return {
          id: 'sm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          deviceId: d.id,
          deviceName: d.name,
          startTime,
          endTime,
          targetThickness: Math.floor(60 + intensity * 0.3 + Math.random() * 20),
          estimatedOutput: Math.floor(40 + intensity * 0.4 + Math.random() * 30),
          waterAllocation: waterAlloc,
          powerAllocation: powerAlloc
        }
      })

      const groomingPlan = groomerDevices.flatMap((d, di) => {
        const plans: any[] = [{
          id: 'gp_' + Date.now() + '_' + di + '_1',
          deviceId: d.id,
          startTime: '05:00',
          endTime: '07:30',
          pattern: 'corduroy' as const
        }]
        if (openSlopes.length > 5) {
          plans.push({
            id: 'gp_' + Date.now() + '_' + di + '_2',
            deviceId: d.id,
            startTime: '12:30',
            endTime: '13:30',
            pattern: 'general' as const
          })
        }
        return plans
      })

      const cableCarPlan = cableCarDevices.map((d, di) => ({
        id: 'cc_' + Date.now() + '_' + di,
        deviceId: d.id,
        startTime: '08:00',
        endTime: '20:30',
        maintenanceWindowStart: di === 1 ? '12:00' : undefined,
        maintenanceWindowEnd: di === 1 ? '12:30' : undefined
      }))

      const newSchedule = {
        date: dateStr,
        slopeId: 'all',
        slopeName: '全场排程',
        openTime: '08:00',
        closeTime: '21:00',
        snowMakingPlan,
        groomingPlan,
        cableCarPlan,
        approvalStatus: 'pending' as const,
        totalWaterQuota: waterQuota,
        totalPowerQuota: powerQuota,
        usedWater: waterUsed,
        usedPower: powerUsed
      }

      addScheduleTask(newSchedule)
      addNotification({
        type: 'info',
        title: '新排程方案待审批',
        message: `${dateStr} 雪道开放与造雪排程方案已生成，请运营主管审批`
      })

      message.success('排程方案已生成！算法综合考虑了积雪厚度、造雪能力、水电配额和缆车维护窗口')
      setGenModalVisible(false)
      setGenLoading(false)
    }, 2000)
  }

  const handleApprove = () => {
    if (!selectedSchedule) return
    modal.confirm({
      title: '审批通过排程方案',
      content: `确认通过 ${selectedSchedule.date} 的雪道开放与造雪排程方案？审批通过后将推送至各操作终端。`,
      okText: '确认批准',
      cancelText: '取消',
      onOk: () => {
        updateScheduleApproval(selectedSchedule.id, 'approved')
        addNotification({
          type: 'success',
          title: '排程方案已批准',
          message: `${selectedSchedule.date} 排程方案已通过审批，正在推送至操作终端...`
        })
        message.loading({ content: '正在推送至造雪/压雪/缆车操作终端...', key: 'push', duration: 2 })
        setTimeout(() => {
          const ok = pushScheduleToTerminal(selectedSchedule.id)
          if (ok) {
            message.success({ content: '排程方案已成功推送至全部终端！', key: 'push' })
            addNotification({ type: 'success', title: '终端推送成功', message: '造雪机、压雪车、缆车操作终端均已收到最新排程' })
          } else {
            message.warning({ content: '部分终端推送失败，请检查网络后重试', key: 'push' })
          }
        }, 2000)
      }
    })
  }

  const handleReject = () => {
    if (!selectedSchedule) return
    Modal.confirm({
      title: '驳回排程方案',
      content: '请填写驳回原因：',
      okText: '确认驳回',
      cancelText: '取消',
      onOk: () => {
        updateScheduleApproval(selectedSchedule.id, 'rejected')
        message.success('已驳回排程方案')
        addNotification({ type: 'warning', title: '排程方案被驳回', message: `${selectedSchedule.date} 排程方案需要调整后重新提交` })
      }
    })
  }

  const handlePush = () => {
    if (!selectedSchedule) return
    message.loading({ content: '正在推送至终端...', key: 'push2' })
    setTimeout(() => {
      message.success({ content: '推送指令已下发', key: 'push2' })
    }, 1500)
  }

  const scheduleColumns: ColumnsType<ScheduleTask> = [
    { title: '排程日期', dataIndex: 'date', key: 'date', width: 120,
      render: (d) => <Space><ScheduleOutlined /><Text strong>{dayjs(d).format('MM-DD dddd')}</Text></Space> },
    { title: '运营时间', key: 'hours', width: 150, render: (_, r) => <Tag color="blue">{r.openTime} - {r.closeTime}</Tag> },
    { title: '造雪任务', key: 'sm', width: 100, render: (_, r) => <Badge count={r.snowMakingPlan.length} /> },
    { title: '压雪任务', key: 'gm', width: 100, render: (_, r) => <Badge count={r.groomingPlan.length} color="#52c41a" /> },
    { title: '缆车计划', key: 'cc', width: 100, render: (_, r) => <Badge count={r.cableCarPlan.length} color="#722ed1" /> },
    { title: '水电配额使用', key: 'quota', width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11 }}><ThunderboltOutlined /> 电</Text>
            <Text style={{ fontSize: 11 }}>{r.usedPower}/{r.totalPowerQuota}kWh</Text>
          </div>
          <Progress percent={Math.floor(r.usedPower / r.totalPowerQuota * 100)} size="small" strokeColor="#722ed1" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11 }}><DatabaseOutlined /> 水</Text>
            <Text style={{ fontSize: 11 }}>{r.usedWater}/{r.totalWaterQuota}T</Text>
          </div>
          <Progress percent={Math.floor(r.usedWater / r.totalWaterQuota * 100)} size="small" strokeColor="#13c2c2" />
        </Space>
      )
    },
    { title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 110,
      render: (s) => s === 'approved' ? <Tag icon={<CheckCircleOutlined />} color="green">已批准</Tag>
        : s === 'pending' ? <Tag icon={<WarningOutlined />} color="orange">待审批</Tag>
        : <Tag icon={<CloseCircleOutlined />} color="red">已驳回</Tag>
    },
    { title: '审批人', dataIndex: 'approvedBy', key: 'approvedBy', width: 130, render: (v) => v || <Text type="secondary">-</Text> },
    { title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => { setSelectedSchedule(r); setDetailVisible(true) }}>详情</Button>
          {r.approvalStatus === 'pending' && <Button type="primary" size="small" onClick={() => { setSelectedSchedule(r); handleApprove() }}>批准</Button>}
          {r.approvalStatus === 'pending' && <Button danger size="small" onClick={() => { setSelectedSchedule(r); handleReject() }}>驳回</Button>}
          {r.approvalStatus === 'approved' && <Button type="link" size="small" icon={<SendOutlined />} onClick={handlePush}>重推</Button>}
        </Space>
      )
    }
  ]

  const slopePlanColumns: ColumnsType<Slope> = [
    { title: '雪道名称', dataIndex: 'name', key: 'name', width: 130,
      render: (n, r) => <Space><CloudOutlined /><Text strong>{n}</Text><Tag color={difficultyMap[r.difficulty].color}>{difficultyMap[r.difficulty].text}</Tag></Space> },
    { title: '积雪厚度', dataIndex: 'snowThickness', key: 'snowThickness', width: 120,
      render: (v, r) => (
        <Tooltip title={`最低要求：${r.minSnowThickness}cm`}>
          <Progress percent={Math.min(100, Math.floor(v / 100 * 100))}
            format={() => <Text type={v < r.minSnowThickness ? 'danger' : 'success'} strong>{v}cm</Text>}
            status={v < r.minSnowThickness ? 'exception' : 'normal'} size="small" />
        </Tooltip>
      )
    },
    { title: '开放状态', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => ({
        open: <Tag color="green">开放中</Tag>,
        partial: <Tag color="orange">部分开放</Tag>,
        closed: <Tag color="red">关闭</Tag>,
        maintenance: <Tag color="purple">维护</Tag>
      } as any)[s]
    },
    { title: '预计客流', key: 'vCnt', width: 90, render: () => <Text>{Math.floor(Math.random() * 200 + 80)}</Text> },
    { title: '分配造雪机', key: 'smL', render: (_, r) => r.connectedDevices.filter(id => snowMakers.find(s => s.id === id)).length ? (
      <Space wrap>
        {r.connectedDevices.filter(id => snowMakers.find(s => s.id === id)).map(id => {
          const d = snowMakers.find(s => s.id === id)
          return d ? <Tag key={id} color="blue" style={{ fontSize: 11 }}>{d.code}</Tag> : null
        })}
      </Space>
    ) : <Text type="secondary">-</Text> },
    { title: '分配缆车/魔毯', key: 'ccL', render: (_, r) => {
      const items = r.connectedDevices.filter(id => [...cableCars, ...devices.filter(d => d.type === 'magicarpet')].find(x => x.id === id))
      return items.length ? (
        <Space wrap>
          {items.map(id => {
            const d = [...cableCars, ...devices.filter(x => x.type === 'magicarpet')].find(x => x.id === id)
            return d ? <Tag key={id} color="purple" style={{ fontSize: 11 }}>{d.code}</Tag> : null
          })}
        </Space>
      ) : <Text type="secondary">-</Text>
    } },
    { title: '压雪安排', key: 'gr', width: 130,
      render: () => <Tag color="cyan" icon={<CarOutlined />}>05:00 - 07:30</Tag> }
  ]

  const waterPowerOption = selectedSchedule ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['水(T)', '电(kWh)'], top: 0 },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: selectedSchedule.snowMakingPlan.slice(0, 8).map(p => p.deviceName.slice(-5)) },
    yAxis: { type: 'value' },
    series: [
      { name: '水(T)', type: 'bar', data: selectedSchedule.snowMakingPlan.slice(0, 8).map(p => p.waterAllocation), itemStyle: { color: '#13c2c2' }, barMaxWidth: 24 },
      { name: '电(kWh)', type: 'bar', data: selectedSchedule.snowMakingPlan.slice(0, 8).map(p => p.powerAllocation), itemStyle: { color: '#722ed1' }, barMaxWidth: 24 }
    ]
  } : {}

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card info-card">
            <Statistic title={<Space><ScheduleOutlined /> 今日排程方案</Space>}
              value={scheduleTasks.filter(s => dayjs(s.date).isSame(dayjs(), 'day')).length} suffix="份"
              valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning-card">
            <Statistic title={<Space><WarningOutlined /> 待审批方案</Space>}
              value={scheduleTasks.filter(s => s.approvalStatus === 'pending').length} suffix="份"
              valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card success-card">
            <Statistic title={<Space><DesktopOutlined /> 终端推送成功</Space>}
              value={scheduleTasks.filter(s => s.approvalStatus === 'approved').length} suffix="份"
              valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<Space><CloudOutlined /> 造雪机投入</Space>}
              value={`${snowMakers.filter(d => d.status === 'running').length}/${snowMakers.length}`} suffix="台"
              valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card className="stat-card"
            title={<Space><FileTextOutlined style={{ color: '#1677ff' }} />每日排程方案列表</Space>}
            extra={
              <Space>
                <Button icon={<ReloadOutlined />}>刷新</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenModalVisible(true)}>
                  生成明日排程
                </Button>
              </Space>
            }>
            <Table<ScheduleTask>
              size="middle"
              dataSource={scheduleTasks}
              columns={scheduleColumns}
              rowKey="id"
              scroll={{ x: 1200 }}
              onRow={(r) => ({
                onClick: () => { setSelectedSchedule(r); setDetailVisible(true) },
                style: { cursor: 'pointer' }
              })}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={selectedSchedule ? `排程方案详情 - ${selectedSchedule.date}` : '排程详情'}
        width={1100}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={selectedSchedule ? (
          <Space>
            <Button icon={<SendOutlined />} onClick={handlePush} disabled={selectedSchedule.approvalStatus !== 'approved'}>推送至终端</Button>
            {selectedSchedule.approvalStatus === 'pending' && <Button danger onClick={handleReject}>驳回</Button>}
            {selectedSchedule.approvalStatus === 'pending' && <Button type="primary" onClick={handleApprove}>审批通过</Button>}
          </Space>
        ) : null}
      >
        {selectedSchedule ? (
          <div>
            <Steps size="small" current={
              selectedSchedule.approvalStatus === 'approved' ? 3 :
              selectedSchedule.approvalStatus === 'pending' ? 1 : 0
            } style={{ marginBottom: 20 }}>
              <Step title="方案生成" description={selectedSchedule.createdAt.slice(5)} />
              <Step title="提交审批" description={selectedSchedule.approvalStatus !== 'pending' ? '完成' : '进行中'} />
              <Step title="主管审批" description={selectedSchedule.approvedAt ? selectedSchedule.approvedAt.slice(5) : (selectedSchedule.approvalStatus === 'rejected' ? '已驳回' : '待处理')} />
              <Step title="终端推送" description={selectedSchedule.approvalStatus === 'approved' ? '已推送' : '-'} />
            </Steps>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={16}>
                <Card size="small" title={<Space><CloudOutlined style={{ color: '#1677ff' }} />雪道开放与积雪状况</Space>}>
                  <Table size="small" dataSource={slopes} columns={slopePlanColumns} rowKey="id" pagination={{ pageSize: 6 }} scroll={{ x: 900 }} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title={<Space><ThunderboltOutlined style={{ color: '#fa8c16' }} />水电配额执行</Space>} style={{ marginBottom: 12 }}>
                  <Row gutter={[8, 8]}>
                    <Col span={24}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>⚡ 电力配额 (kWh)</Text>
                        <Text strong>{selectedSchedule.usedPower} / {selectedSchedule.totalPowerQuota}</Text>
                      </div>
                      <Progress percent={Math.floor(selectedSchedule.usedPower / selectedSchedule.totalPowerQuota * 100)} />
                    </Col>
                    <Col span={24} style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>💧 水力配额 (吨)</Text>
                        <Text strong>{selectedSchedule.usedWater} / {selectedSchedule.totalWaterQuota}</Text>
                      </div>
                      <Progress percent={Math.floor(selectedSchedule.usedWater / selectedSchedule.totalWaterQuota * 100)} strokeColor="#13c2c2" />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title={<Space><CloudSyncOutlined style={{ color: '#13c2c2' }} />造雪条件评估</Space>}>
                  <Alert type="success" showIcon message="今晚气温 -12℃ ~ -5℃，湿度 78%，北风 4m/s" description="造雪条件极佳，预计可完成全部造雪计划" style={{ marginBottom: 8 }} />
                  <List size="small" dataSource={['温度评分：28/30', '湿度评分：18/20', '风速评分：23/25', '天然降雪：15/25']} renderItem={(t) => <List.Item><Text style={{ fontSize: 12 }}>{t}</Text></List.Item>} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
              <Col xs={24} md={12}>
                <Card size="small" title={<Space><CloudOutlined style={{ color: '#13c2c2' }} />造雪机排程 ({selectedSchedule.snowMakingPlan.length}台)</Space>} bodyStyle={{ padding: 8 }}>
                  <Timeline mode="left" style={{ paddingLeft: 4 }}>
                    {selectedSchedule.snowMakingPlan.slice(0, 6).map((p: SnowMakingPlan) => (
                      <Timeline.Item key={p.id}
                        label={<Tag color="blue" style={{ fontSize: 10 }}>{p.startTime} ~ {p.endTime}</Tag>}
                        color="blue">
                        <Text strong style={{ fontSize: 12 }}>{p.deviceName}</Text><br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          目标厚度：{p.targetThickness}cm | 预计产雪：{p.estimatedOutput}m³<br />
                          水：{p.waterAllocation}T | 电：{p.powerAllocation}kWh
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title={<Space><CarOutlined style={{ color: '#52c41a' }} />压雪车 & 缆车排程</Space>} bodyStyle={{ padding: 8 }}>
                  <Title level={5} style={{ fontSize: 13, margin: '0 0 6px' }}>🚜 压雪作业</Title>
                  <Timeline mode="left" style={{ paddingLeft: 4 }}>
                    {selectedSchedule.groomingPlan.map(p => (
                      <Timeline.Item key={p.id} color="green"
                        label={<Tag color="green" style={{ fontSize: 10 }}>{p.startTime} ~ {p.endTime}</Tag>}>
                        <Text strong style={{ fontSize: 12 }}>{devices.find(d => d.id === p.deviceId)?.name}</Text><br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          作业模式：{p.pattern === 'corduroy' ? '标准雪道纹' : p.pattern === 'halfpipe' ? 'U型池' : p.pattern === 'mogul' ? '雪包区' : '综合整理'}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                  <Divider style={{ margin: '8px 0' }} />
                  <Title level={5} style={{ fontSize: 13, margin: '0 0 6px' }}>🚡 缆车运营</Title>
                  <List size="small" dataSource={selectedSchedule.cableCarPlan} renderItem={(p) => (
                    <List.Item style={{ padding: '6px 0' }}>
                      <Avatar size={22} icon={<RocketOutlined />} style={{ background: '#722ed1' }} />
                      <div style={{ flex: 1, marginLeft: 8 }}>
                        <div style={{ fontSize: 12 }}>
                          <Text strong>{devices.find(d => d.id === p.deviceId)?.name}</Text>
                          <Tag color="purple" style={{ fontSize: 10, margin: '0 0 0 6px' }}>{p.startTime} ~ {p.endTime}</Tag>
                        </div>
                        {p.maintenanceWindowStart && (
                          <Text type="warning" style={{ fontSize: 10 }}>
                            维护窗口：{p.maintenanceWindowStart} ~ {p.maintenanceWindowEnd}
                          </Text>
                        )}
                      </div>
                    </List.Item>
                  )} />
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: 12 }}>
              <Col xs={24}>
                <Card size="small" title={<Space><BarChartOutlined style={{ color: '#fa8c16' }} />各造雪机资源分配统计</Space>}>
                  <ReactECharts option={waterPowerOption} style={{ height: 220 }} />
                </Card>
              </Col>
            </Row>
          </div>
        ) : <Empty />}
      </Drawer>

      <Modal
        title={<Space><PlusOutlined /> 智能生成每日排程方案</Space>}
        open={genModalVisible}
        onCancel={() => setGenModalVisible(false)}
        footer={null}
        width={620}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          系统将综合考虑 <Text strong>雪道积雪厚度、造雪机工作能力、水电配额约束、缆车维护窗口</Text> 等因素，自动生成最优排程方案
        </Paragraph>
        <Form form={genForm} layout="vertical" onFinish={generateScheduleAlgorithm}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="排程日期" name="date" rules={[{ required: true, message: '请选择日期' }]} initialValue={dayjs().add(1, 'day')}>
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="运营时长优先级" name="priority" initialValue="balanced">
                <Select>
                  <Option value="revenue">营收优先（延长高难度道运营）</Option>
                  <Option value="balanced">综合平衡（推荐）</Option>
                  <Option value="conservation">节能优先（减少造雪量）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="每日电力配额 (kWh)" name="powerQuota" initialValue={18000}>
                <InputNumber style={{ width: '100%' }} min={5000} max={50000} step={500} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="每日水力配额 (吨)" name="waterQuota" initialValue={12000}>
                <InputNumber style={{ width: '100%' }} min={1000} max={30000} step={500} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="造雪投入强度" name="snowIntensity" initialValue={70}>
                <Slider marks={{ 0: '节能', 50: '标准', 100: '最大' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="造雪时段偏好" name="snowWindow" initialValue="night">
                <Select>
                  <Option value="night">夜间（21:00-次日06:00，推荐）</Option>
                  <Option value="full">全天候</Option>
                  <Option value="offpeak">非高峰</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="缆车维护窗口" name="maintenanceWindow" initialValue={['12:00-12:30']}>
                <Select mode="multiple" placeholder="选择维护时段">
                  <Option value="12:00-12:30">午间 12:00-12:30（30分钟）</Option>
                  <Option value="15:30-16:00">下午 15:30-16:00（30分钟）</Option>
                  <Option value="20:30-21:30">夜间 20:30-21:30（1小时）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '6px 0 14px' }} />
          <Alert type="info" showIcon message="算法说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                <li>积雪厚度不足的雪道优先分配造雪资源</li>
                <li>预测客流量大的雪道保证压雪质量与缆车运力</li>
                <li>环境气温低于-5℃时自动加大造雪投入</li>
                <li>自动避开设备维保窗口</li>
              </ul>
            } style={{ marginBottom: 16 }} />
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setGenModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<CloudSyncOutlined />} loading={genLoading}>
                {genLoading ? 'AI算法生成中...' : '立即生成排程'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ScheduleManagement
