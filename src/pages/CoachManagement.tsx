import React, { useMemo, useState } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider,
  Button, App as AntdApp, Modal, Form, Input, InputNumber, Select, Avatar, List,
  Drawer, Badge, Tooltip, Descriptions, Timeline, Empty, Alert, DatePicker, TimePicker,
  Radio
} from 'antd'
import {
  TeamOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined,
  CloseCircleOutlined, PlusOutlined, ReloadOutlined, PhoneOutlined,
  MailOutlined, StarOutlined, BookOutlined, SwapOutlined, WarningOutlined,
  ScheduleOutlined, SafetyCertificateOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { Coach, CourseBooking, DifficultyLevel, CoachLevel } from '@/types'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = TimePicker

const levelColorMap: Record<CoachLevel, string> = {
  L1: '#8c8c8c', L2: '#52c41a', L3: '#1677ff', L4: '#722ed1', L5: '#faad14'
}
const levelNameMap: Record<CoachLevel, string> = {
  L1: '初级', L2: '中级', L3: '高级', L4: '国家级', L5: '国际级'
}
const statusColorMap: Record<string, string> = {
  on_duty: 'green', off_duty: 'default', leave: 'orange', training: 'purple'
}
const statusNameMap: Record<string, string> = {
  on_duty: '在岗', off_duty: '休息', leave: '请假', training: '培训'
}

const CoachManagement: React.FC = () => {
  const { message, modal } = AntdApp.useApp()
  const {
    coaches, students, bookings, slopes,
    updateBookingApproval, addBooking, addNotification, rescheduleBooking
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [coachDrawerVisible, setCoachDrawerVisible] = useState(false)
  const [addBookingVisible, setAddBookingVisible] = useState(false)
  const [rescheduleModal, setRescheduleModal] = useState<CourseBooking | null>(null)
  const [rescheduleForm] = Form.useForm()
  const [bookingForm] = Form.useForm()

  const today = dayjs().format('YYYY-MM-DD')
  const todayBookings = useMemo(() => bookings.filter(b => b.date === today), [bookings, today])
  const pendingBookings = useMemo(() => bookings.filter(b => b.approvalStatus === 'pending'), [bookings])

  const handleApprove = (b: CourseBooking) => {
    modal.confirm({
      title: '审批课程预约',
      content: `确认批准【${b.studentName}】的课程预约？\n教练：${b.coachName}\n时间：${b.date} ${b.startTime}-${b.endTime}`,
      onOk: () => {
        updateBookingApproval(b.id, 'approved', b.status === 'reschedule_requested' ? 'scheduled' : b.status)
        message.success('已批准课程预约')
        addNotification({ type: 'success', title: '课程预约已通过', message: `${b.studentName}的${b.date}课程已批准` })
      }
    })
  }

  const handleReject = (b: CourseBooking) => {
    Modal.confirm({
      title: '驳回课程预约',
      content: '请填写驳回原因（将通知学员）：',
      onOk: () => {
        updateBookingApproval(b.id, 'rejected', 'cancelled')
        message.success('已驳回课程预约')
        addNotification({ type: 'warning', title: '课程预约被驳回', message: `${b.studentName}的预约未通过审批` })
      }
    })
  }

  const handleAddBooking = (values: any) => {
    const coach = coaches.find(c => c.id === values.coachId)
    const student = students.find(s => s.id === values.studentId) || { name: values.studentName, id: 'new' }
    if (!coach) return
    addBooking({
      studentId: student.id,
      studentName: student.name,
      coachId: coach.id,
      coachName: coach.name,
      date: dayjs(values.date).format('YYYY-MM-DD'),
      startTime: values.timeRange[0].format('HH:mm'),
      endTime: values.timeRange[1].format('HH:mm'),
      courseType: values.courseType,
      difficultyLevel: values.difficultyLevel,
      slopeId: values.slopeId,
      status: 'scheduled',
      approvalStatus: values.needApproval ? 'pending' : 'approved'
    })
    message.success('课程预约创建成功！')
    setAddBookingVisible(false)
    bookingForm.resetFields()
  }

  const handleReschedule = (values: any) => {
    if (!rescheduleModal) return
    const newDate = dayjs(values.newDate).format('YYYY-MM-DD')
    const startTime = values.newTime ? values.newTime[0].format('HH:mm') : rescheduleModal.startTime
    const endTime = values.newTime ? values.newTime[1].format('HH:mm') : rescheduleModal.endTime
    const newCoachId = values.newCoachId
    const newCoach = newCoachId ? coaches.find(c => c.id === newCoachId) : null

    const updates: any = {
      date: newDate,
      startTime,
      endTime
    }
    if (newCoach) {
      updates.coachId = newCoach.id
      updates.coachName = newCoach.name
    }

    rescheduleBooking(rescheduleModal.id, updates)
    message.success('调课申请已处理并重新安排')
    addNotification({
      type: 'success',
      title: '调课申请已批准',
      message: `${rescheduleModal.studentName}的课程已调整至${newDate} ${startTime}-${endTime}`
    })
    setRescheduleModal(null)
  }

  const recommendCoaches = (level: DifficultyLevel): Coach[] => {
    const levelReq: Record<DifficultyLevel, CoachLevel[]> = {
      beginner: ['L2', 'L3', 'L4', 'L5'],
      intermediate: ['L3', 'L4', 'L5'],
      advanced: ['L4', 'L5'],
      expert: ['L5']
    }
    return coaches.filter(c => levelReq[level].includes(c.level) && c.status === 'on_duty')
      .sort((a, b) => Number(b.level.slice(1)) - Number(a.level.slice(1)))
  }

  const coachColumns: ColumnsType<Coach> = [
    { title: '教练', key: 'coach', width: 200, fixed: 'left',
      render: (_, c) => (
        <Space>
          <Avatar style={{ background: `linear-gradient(135deg, ${levelColorMap[c.level]} 0%, #1677ff 100%)`, fontSize: 14 }}>
            {c.name[0]}
          </Avatar>
          <div>
            <Text strong>{c.name}</Text>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{c.employeeId}</div>
          </div>
        </Space>
      )
    },
    { title: '资质等级', dataIndex: 'level', key: 'level', width: 120,
      render: (l: CoachLevel) => (
        <Tag color={levelColorMap[l]} icon={<SafetyCertificateOutlined />} style={{ fontSize: 12 }}>
          {levelNameMap[l]} L{l.slice(1)}
        </Tag>
      )
    },
    { title: '专长项目', dataIndex: 'specialties', key: 'specialties',
      render: (s: string[]) => <Space wrap>{s.map((sp, i) => <Tag key={i} color="blue" style={{ fontSize: 11 }}>{sp}</Tag>)}</Space>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => <Badge status={s === 'on_duty' ? 'success' : s === 'leave' ? 'warning' : s === 'training' ? 'processing' : 'default'}
        text={<Tag color={statusColorMap[s]}>{statusNameMap[s]}</Tag>} />
    },
    { title: '联系方式', key: 'contact', width: 180,
      render: (_, c) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}><PhoneOutlined /> {c.phone}</span>
          <span style={{ fontSize: 11, color: '#8c8c8c' }}><MailOutlined /> {c.email}</span>
        </Space>
      )
    },
    { title: '课时费', dataIndex: 'hourlyRate', key: 'hourlyRate', width: 90,
      render: (r) => <Text type="success" strong>¥{r}/h</Text>
    },
    { title: '今日课时', key: 'todayCount', width: 90,
      render: (_, c) => {
        const cnt = todayBookings.filter(b => b.coachId === c.id).length
        return <Text strong style={{ color: cnt > 4 ? '#ff4d4f' : cnt > 2 ? '#faad14' : '#52c41a' }}>{cnt}节</Text>
      }
    },
    { title: '日程', key: 'schedule', width: 280,
      render: (_, c) => {
        const cbs = todayBookings.filter(b => b.coachId === c.id).sort((a, b) => a.startTime.localeCompare(b.startTime))
        if (!cbs.length) return <Text type="secondary">无课</Text>
        return (
          <Space wrap size={3}>
            {cbs.map(b => (
              <Tooltip key={b.id} title={`${b.studentName} | ${b.courseType === 'private' ? '私教课' : '团体课'}`}>
                <Tag color={b.status === 'in_progress' ? 'processing' : b.status === 'scheduled' ? 'blue' : 'default'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                  {b.startTime}-{b.endTime.slice(0, 5)} {b.studentName.slice(0, 2)}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        )
      }
    },
    { title: '操作', key: 'action', fixed: 'right', width: 110,
      render: (_, c) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => { setSelectedCoach(c); setCoachDrawerVisible(true) }}>详情</Button>
          <Button type="link" size="small" onClick={() => {
            bookingForm.setFieldsValue({ coachId: c.id, date: dayjs() })
            setAddBookingVisible(true)
          }}>排课</Button>
        </Space>
      )
    }
  ]

  const bookingColumns: ColumnsType<CourseBooking> = [
    { title: '预约编号', dataIndex: 'id', key: 'id', width: 70, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '学员', dataIndex: 'studentName', key: 'studentName', width: 90,
      render: (n, r) => (
        <Space>
          <Avatar size={22} style={{ background: '#52c41a', fontSize: 11 }}>{n[0]}</Avatar>
          <Text strong>{n}</Text>
          <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>{r.difficultyLevel === 'beginner' ? '初级' : r.difficultyLevel === 'intermediate' ? '中级' : '高级'}</Tag>
        </Space>
      )
    },
    { title: '教练', dataIndex: 'coachName', key: 'coachName', width: 90,
      render: (n, r) => {
        const c = coaches.find(x => x.id === r.coachId)
        return <Space>
          <Avatar size={22} style={{ background: c ? levelColorMap[c.level] : '#1677ff', fontSize: 11 }}>{n[0]}</Avatar>
          <Text>{n}</Text>
          {c && <Tag color={levelColorMap[c.level]} style={{ fontSize: 10, margin: 0 }}>{levelNameMap[c.level]}</Tag>}
        </Space>
      }
    },
    { title: '日期时间', key: 'dt', width: 170,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text><CalendarOutlined /> {r.date}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}><ClockCircleOutlined /> {r.startTime} - {r.endTime}</Text>
        </Space>
      )
    },
    { title: '课程类型', dataIndex: 'courseType', key: 'courseType', width: 90,
      render: (t) => <Tag color={t === 'private' ? 'purple' : 'blue'} icon={<BookOutlined />}>{t === 'private' ? '私教课' : '团体课'}</Tag>
    },
    { title: '雪道', dataIndex: 'slopeId', key: 'slopeId', width: 110,
      render: (id) => {
        const s = slopes.find(x => x.id === id)
        return s ? <Tag color="geekblue">{s.name}</Tag> : <Text type="secondary">-</Text>
      }
    },
    { title: '上课状态', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => ({
        scheduled: <Tag color="blue">已排期</Tag>,
        in_progress: <Badge status="processing" text={<Tag color="processing">上课中</Tag>} />,
        completed: <Tag color="green">已完成</Tag>,
        cancelled: <Tag color="default">已取消</Tag>,
        reschedule_requested: <Tag color="orange" icon={<SwapOutlined />}>调课申请中</Tag>
      } as any)[s]
    },
    { title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 100,
      render: (s) => s === 'approved' ? <Tag icon={<CheckCircleOutlined />} color="green">已通过</Tag>
        : s === 'pending' ? <Tag icon={<WarningOutlined />} color="orange">待审批</Tag>
        : <Tag icon={<CloseCircleOutlined />} color="red">已拒绝</Tag>
    },
    { title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          {r.status === 'reschedule_requested' && (
            <Button type="link" size="small" onClick={() => { setRescheduleModal(r); rescheduleForm.resetFields() }}>处理调课</Button>
          )}
          {r.approvalStatus === 'pending' && <Button type="primary" size="small" onClick={() => handleApprove(r)}>批准</Button>}
          {r.approvalStatus === 'pending' && <Button danger size="small" onClick={() => handleReject(r)}>驳回</Button>}
          {r.approvalStatus === 'approved' && <Button type="link" size="small">详情</Button>}
        </Space>
      )
    }
  ]

  const weekWorkloadOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: coaches.slice(0, 6).map(c => c.name) },
    grid: { left: 35, right: 10, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value', name: '课时' },
    series: coaches.slice(0, 6).map((c, i) => ({
      name: c.name, type: 'bar', stack: 'total',
      data: [4, 6, 3, 5, 7, 10, 8].map(x => x + i % 2 + Math.floor(Math.random() * 2)),
      itemStyle: { color: ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'][i] }
    }))
  }

  const qualifiedDistributionOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'],
      data: (['L1', 'L2', 'L3', 'L4', 'L5'] as CoachLevel[]).map(l => ({
        value: coaches.filter(c => c.level === l).length,
        name: levelNameMap[l] + '(' + l + ')',
        itemStyle: { color: levelColorMap[l] }
      }))
    }]
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card info-card">
            <Statistic title={<Space><TeamOutlined /> 教练总人数</Space>} value={coaches.length} suffix="人" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card success-card">
            <Statistic title={<Space><UserOutlined /> 今日在岗</Space>} value={coaches.filter(c => c.status === 'on_duty').length} suffix="人" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning-card">
            <Statistic title={<Space><CalendarOutlined /> 今日课时</Space>} value={todayBookings.length} suffix="节" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<Space><WarningOutlined /> 待审批</Space>} value={pendingBookings.length} suffix="项" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card className="stat-card" style={{ marginTop: 16 }} tabList={[
        { key: 'schedule', tab: <span><ScheduleOutlined /> 教练排班表</span> },
        { key: 'bookings', tab: <span><BookOutlined /> 课程预约管理 <Badge count={pendingBookings.length} size="small" offset={[4, -2]}/></span> },
        { key: 'stats', tab: <span><StarOutlined /> 教练资质统计</span> }
      ]} activeTabKey={activeTab} onChange={setActiveTab}
        tabBarExtraContent={
          activeTab === 'bookings' ? (
            <Space>
              <Button icon={<ReloadOutlined />}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddBookingVisible(true)}>新建预约</Button>
            </Space>
          ) : activeTab === 'schedule' ? (
            <Space>
              <DatePicker defaultValue={dayjs()} style={{ width: 160 }} />
              <Select defaultValue="all" style={{ width: 120 }} size="small">
                <Option value="all">全部等级</Option>
                <Option value="L5">国际级L5</Option>
                <Option value="L4">国家级L4</Option>
                <Option value="L3">高级L3</Option>
              </Select>
              <Button icon={<ReloadOutlined />}>刷新</Button>
            </Space>
          ) : null
        }
      >
        {activeTab === 'schedule' && (
          <div>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col xs={24} lg={16}>
                <Card size="small" title="周教练工作负载">
                  <ReactECharts option={weekWorkloadOption} style={{ height: 240 }} />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card size="small" title="教练资质分布">
                  <ReactECharts option={qualifiedDistributionOption} style={{ height: 240 }} />
                </Card>
              </Col>
            </Row>
            <Table<Coach>
              size="middle"
              dataSource={coaches}
              columns={coachColumns}
              rowKey="id"
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 8 }}
            />
          </div>
        )}
        {activeTab === 'bookings' && (
          <div>
            {pendingBookings.length > 0 && (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }}
                message={`有 ${pendingBookings.length} 项课程预约/调课申请等待审批`}
                action={
                  <Button size="small" type="primary" onClick={() => handleApprove(pendingBookings[0])}>去审批</Button>
                }
              />
            )}
            <Table<CourseBooking>
              size="middle"
              dataSource={bookings}
              columns={bookingColumns}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{ pageSize: 8 }}
            />
          </div>
        )}
        {activeTab === 'stats' && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="按等级统计教练数">
                <List
                  dataSource={(['L5', 'L4', 'L3', 'L2', 'L1'] as CoachLevel[])}
                  renderItem={(l) => {
                    const list = coaches.filter(c => c.level === l)
                    return (
                      <List.Item style={{ padding: '8px 0' }}>
                        <Tag color={levelColorMap[l]} style={{ fontSize: 13, padding: '2px 8px', minWidth: 80 }}>
                          {levelNameMap[l]} L{l.slice(1)}
                        </Tag>
                        <Progress percent={Math.floor(list.length / coaches.length * 100)} style={{ flex: 1, margin: '0 16px' }} />
                        <Text strong style={{ width: 80, textAlign: 'right' }}>{list.length} 人</Text>
                      </List.Item>
                    )
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="专长领域分布">
                <List
                  dataSource={['高山滑雪', '儿童教学', '单板', '自由式', '竞技训练', '入门启蒙']}
                  renderItem={(sp) => {
                    const cnt = coaches.filter(c => c.specialties.some(s => s.includes(sp))).length
                    return (
                      <List.Item style={{ padding: '8px 0' }}>
                        <Text style={{ minWidth: 80 }}>{sp}</Text>
                        <Progress percent={Math.floor(cnt / coaches.length * 100)}
                          strokeColor={['#1677ff', '#52c41a', '#722ed1', '#faad14', '#eb2f96', '#13c2c2'][['高山滑雪', '儿童教学', '单板', '自由式', '竞技训练', '入门启蒙'].indexOf(sp)]}
                          style={{ flex: 1, margin: '0 16px' }} />
                        <Text strong style={{ width: 50, textAlign: 'right' }}>{cnt}</Text>
                      </List.Item>
                    )
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="智能匹配推荐 - 按难度等级">
                {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map(level => {
                  const names: Record<DifficultyLevel, string> = { beginner: '初级学员', intermediate: '中级学员', advanced: '高级学员', expert: '专家级' }
                  const recs = recommendCoaches(level).slice(0, 4)
                  return (
                    <div key={level} style={{ marginBottom: 14 }}>
                      <Title level={5} style={{ fontSize: 12, margin: '0 0 6px', color: '#8c8c8c' }}>{names[level]} 推荐教练：</Title>
                      <Space wrap size={4}>
                        {recs.length ? recs.map(c => (
                          <Tooltip key={c.id} title={`${levelNameMap[c.level]} | ¥${c.hourlyRate}/h | ${c.specialties.join('、')}`}>
                            <Tag color={levelColorMap[c.level]} style={{ margin: 0, fontSize: 11 }}>
                              <Avatar size={16} style={{ background: levelColorMap[c.level], fontSize: 9, marginRight: 4 }}>{c.name[0]}</Avatar>
                              {c.name}
                            </Tag>
                          </Tooltip>
                        )) : <Text type="danger">暂无合适教练</Text>}
                      </Space>
                    </div>
                  )
                })}
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Drawer
        title={selectedCoach ? `教练档案 - ${selectedCoach.name}` : '教练详情'}
        width={560}
        open={coachDrawerVisible}
        onClose={() => setCoachDrawerVisible(false)}
      >
        {selectedCoach ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', padding: 12, borderRadius: 8, background: `linear-gradient(135deg, ${levelColorMap[selectedCoach.level]}22 0%, #1677ff22 100%)`, border: `1px solid ${levelColorMap[selectedCoach.level]}44` }}>
              <Avatar size={72} style={{ background: levelColorMap[selectedCoach.level], fontSize: 28, fontWeight: 'bold' }}>
                {selectedCoach.name[0]}
              </Avatar>
              <div style={{ marginLeft: 16, flex: 1 }}>
                <Title level={3} style={{ margin: 0 }}>{selectedCoach.name}</Title>
                <Space size={8} style={{ marginTop: 4 }}>
                  <Tag color={levelColorMap[selectedCoach.level]} icon={<SafetyCertificateOutlined />}>{levelNameMap[selectedCoach.level]} L{selectedCoach.level.slice(1)}</Tag>
                  <Tag color={statusColorMap[selectedCoach.status]}>{statusNameMap[selectedCoach.status]}</Tag>
                  <Tag icon={<StarOutlined />} color="gold">¥{selectedCoach.hourlyRate}/课时</Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 11 }}>工号：{selectedCoach.employeeId}</Text>
              </div>
            </div>

            <Divider orientation="left">基本信息</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="手机">{selectedCoach.phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedCoach.email}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">资质证书</Divider>
            <Timeline>
              {selectedCoach.certifications.map((c, i) => (
                <Timeline.Item key={i} color="green" dot={<SafetyCertificateOutlined />}>{c}</Timeline.Item>
              ))}
            </Timeline>

            <Divider orientation="left">专长领域</Divider>
            <Space wrap>
              {selectedCoach.specialties.map((s, i) => <Tag key={i} color="blue">{s}</Tag>)}
            </Space>

            <Divider orientation="left">最近课程</Divider>
            <List
              size="small"
              dataSource={bookings.filter(b => b.coachId === selectedCoach.id).slice(0, 6)}
              locale={{ emptyText: '暂无课程记录' }}
              renderItem={(b) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size={26} style={{ background: '#52c41a', fontSize: 12 }}>{b.studentName[0]}</Avatar>}
                    title={<Text strong>{b.studentName}</Text>}
                    description={`${b.date} ${b.startTime}-${b.endTime} | ${b.courseType === 'private' ? '私教课' : '团体课'}`}
                  />
                  <Tag color={b.status === 'completed' ? 'green' : b.status === 'in_progress' ? 'processing' : 'blue'}>
                    {b.status === 'completed' ? '已完成' : b.status === 'in_progress' ? '上课中' : '已排期'}
                  </Tag>
                </List.Item>
              )}
            />
          </div>
        ) : <Empty />}
      </Drawer>

      <Modal
        title={<Space><PlusOutlined /> 新建课程预约</Space>}
        open={addBookingVisible}
        onCancel={() => { setAddBookingVisible(false); bookingForm.resetFields() }}
        footer={null}
        width={560}
      >
        <Form form={bookingForm} layout="vertical" onFinish={handleAddBooking}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="学员姓名" name="studentName" rules={[{ required: true, message: '请输入学员姓名' }]}>
                <Select showSearch placeholder="选择或输入学员" optionFilterProp="children">
                  {students.map(s => <Option key={s.id} value={s.name}>{s.name} ({s.phone.slice(-4)})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="学员水平" name="difficultyLevel" rules={[{ required: true }]} initialValue="beginner">
                <Select>
                  <Option value="beginner">初学者</Option>
                  <Option value="intermediate">中级</Option>
                  <Option value="advanced">高级</Option>
                  <Option value="expert">专家级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="课程类型" name="courseType" rules={[{ required: true }]} initialValue="private">
                <Radio.Group>
                  <Radio.Button value="private">私教 1v1</Radio.Button>
                  <Radio.Button value="group">团体课</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="分配教练" name="coachId" rules={[{ required: true, message: '请选择教练' }]}>
                <Select placeholder="系统推荐+手动选择" optionFilterProp="label">
                  {coaches.filter(c => c.status === 'on_duty').map(c => (
                    <Option key={c.id} value={c.id} label={c.name}>
                      <Space>
                        <Avatar size={18} style={{ background: levelColorMap[c.level], fontSize: 10 }}>{c.name[0]}</Avatar>
                        <Text strong>{c.name}</Text>
                        <Tag color={levelColorMap[c.level]} style={{ fontSize: 10 }}>{levelNameMap[c.level]}</Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>¥{c.hourlyRate}/h</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="上课日期" name="date" rules={[{ required: true }]} initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs().subtract(1, 'day'))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="上课时间段" name="timeRange" rules={[{ required: true, message: '请选择时间' }]} initialValue={[dayjs().hour(9).minute(0), dayjs().hour(11).minute(0)]}>
                <RangePicker minuteStep={30} style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24}>
              <Form.Item label="指定雪道（可选）" name="slopeId">
                <Select placeholder="根据教练与学员水平自动推荐">
                  {slopes.filter(s => s.status === 'open').map(s => (
                    <Option key={s.id} value={s.id}>
                      <Tag color={difficultyMap[s.difficulty].color}>{difficultyMap[s.difficulty].text}</Tag> {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24}>
              <Form.Item label="需要主管审批？" name="needApproval" valuePropName="checked" initialValue={false}>
                <Radio.Group>
                  <Radio value={true}>需要审批（复杂/特级）</Radio>
                  <Radio value={false}>自动通过（常规）</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '6px 0 12px' }} />
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => { setAddBookingVisible(false); bookingForm.resetFields() }}>取消</Button>
              <Button type="primary" htmlType="submit">创建预约</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><SwapOutlined /> 处理调课申请</Space>}
        open={!!rescheduleModal}
        onCancel={() => setRescheduleModal(null)}
        footer={null}
      >
        {rescheduleModal && (
          <div>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              title="原课程信息"
              description={`学员：${rescheduleModal.studentName} | 教练：${rescheduleModal.coachName} | 原时间：${rescheduleModal.date} ${rescheduleModal.startTime}-${rescheduleModal.endTime}`}
            />
            <Paragraph type="secondary" style={{ fontSize: 12 }}>申请原因：{rescheduleModal.rescheduleReason || '未填写'}</Paragraph>
            <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item label="新日期" name="newDate" rules={[{ required: true }]} initialValue={dayjs().add(1, 'day')}>
                    <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs())} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="新时间段" name="newTime" rules={[{ required: true }]} initialValue={[dayjs().hour(10).minute(0), dayjs().hour(12).minute(0)]}>
                    <RangePicker minuteStep={30} style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="更换教练" name="newCoachId">
                    <Select placeholder="如不更换，则保留原教练">
                      {coaches.filter(c => c.status === 'on_duty').map(c => (
                        <Option key={c.id} value={c.id}>
                          <Tag color={levelColorMap[c.level]}>{levelNameMap[c.level]}</Tag> {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '6px 0 12px' }} />
              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Space>
                  <Button onClick={() => handleReject(rescheduleModal)} danger>驳回申请</Button>
                  <Button type="primary" htmlType="submit">批准并按以上安排</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

const difficultyMap: Record<string, { color: string; text: string }> = {
  beginner: { color: 'green', text: '初级' },
  intermediate: { color: 'blue', text: '中级' },
  advanced: { color: 'orange', text: '高级' },
  expert: { color: 'red', text: '专家' }
}

export default CoachManagement
