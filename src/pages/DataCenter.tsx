import React, { useMemo, useState } from 'react'
import { Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider, Badge, App as AntdApp, Tooltip, DatePicker, Select, Alert } from 'antd'
import {
  CloudOutlined, CloudServerOutlined, ThunderboltOutlined,
  UserOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, DatabaseOutlined, WifiOutlined,
  RiseOutlined, ArrowUpOutlined, ArrowDownOutlined, LineChartOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { WeatherForecast, VisitorForecast, Device } from '@/types'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const DataSourceStatus = [
  { name: '气象局API', type: 'weather', status: 'connected', latency: 128, lastSync: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 48 },
  { name: '客流预测引擎', type: 'forecast', status: 'connected', latency: 256, lastSync: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 168 },
  { name: '造雪机IoT传感器', type: 'snowmaker', status: 'connected', latency: 86, lastSync: dayjs().subtract(30, 'second').format('YYYY-MM-DD HH:mm:ss'), dataCount: 8 },
  { name: '缆车状态系统', type: 'cablecar', status: 'connected', latency: 142, lastSync: dayjs().subtract(15, 'second').format('YYYY-MM-DD HH:mm:ss'), dataCount: 5 },
  { name: '魔毯终端', type: 'magicarpet', status: 'connected', latency: 95, lastSync: dayjs().subtract(45, 'second').format('YYYY-MM-DD HH:mm:ss'), dataCount: 3 },
  { name: '闸机客流统计', type: 'turnstile', status: 'connected', latency: 310, lastSync: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 16 },
  { name: '人员定位UWB', type: 'location', status: 'warning', latency: 580, lastSync: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 589, warning: '部分区域信号弱' },
  { name: '雪道测厚传感器', type: 'sensor', status: 'connected', latency: 185, lastSync: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 22 },
  { name: '水电计量系统', type: 'meter', status: 'disconnected', latency: 0, lastSync: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'), dataCount: 0, warning: '离线，正在排查' }
]

const DataCenter: React.FC = () => {
  const { message } = AntdApp.useApp()
  const { weather, visitorForecast, devices } = useAppStore()
  const [weatherDays, setWeatherDays] = useState(2)

  const currentWeather = weather[0]

  const weatherByDay = useMemo(() => {
    const days: Record<string, WeatherForecast[]> = {}
    weather.slice(0, weatherDays * 24).forEach(w => {
      if (!days[w.date]) days[w.date] = []
      days[w.date].push(w)
    })
    return days
  }, [weather, weatherDays])

  const weatherChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['温度', '风速', '降雪量', '湿度'], top: 0, right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: weather.slice(0, weatherDays * 24).map(w => w.date.slice(5) + ' ' + w.time),
      axisLabel: { rotate: 45, fontSize: 10, interval: 2 }
    },
    yAxis: [
      { type: 'value', name: '°C / m/s', position: 'left', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
      { type: 'value', name: '%', position: 'right', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } }
    ],
    series: [
      { name: '温度', type: 'line', smooth: true, data: weather.slice(0, weatherDays * 24).map(w => w.temperature), yAxisIndex: 0, itemStyle: { color: '#1677ff' }, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
      { name: '风速', type: 'line', smooth: true, data: weather.slice(0, weatherDays * 24).map(w => w.windSpeed), yAxisIndex: 0, itemStyle: { color: '#52c41a' }, lineStyle: { width: 1.5, type: 'dashed' } },
      { name: '降雪量', type: 'bar', data: weather.slice(0, weatherDays * 24).map(w => w.snowfall * 10), yAxisIndex: 0, itemStyle: { color: '#13c2c2' }, barMaxWidth: 12 },
      { name: '湿度', type: 'line', smooth: true, data: weather.slice(0, weatherDays * 24).map(w => w.humidity), yAxisIndex: 1, itemStyle: { color: '#722ed1' }, lineStyle: { width: 1.5, type: 'dotted' } }
    ]
  }), [weather, weatherDays])

  const forecastData = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const result = visitorForecast.filter(f => {
      const d = dayjs(f.date)
      return d.isSame(today, 'day') || d.isSame(dayjs().add(1, 'day'), 'day') || d.isSame(dayjs().add(2, 'day'), 'day')
    })
    return result
  }, [visitorForecast])

  const forecastChartOption = useMemo(() => {
    const dates = [...new Set(forecastData.map(f => f.date))]
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: dates.map(d => dayjs(d).format('MM-DD')), top: 0 },
      grid: { left: 45, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: '预测人次' },
      series: dates.map((d, idx) => {
        const dayData = forecastData.filter(f => f.date === d).sort((a, b) => a.hour - b.hour)
        return {
          name: dayjs(d).format('MM-DD'),
          type: idx === 0 ? 'line' : 'line',
          smooth: true,
          symbol: idx === 0 ? 'circle' : 'none',
          data: dayData.map(d2 => d2.totalVisitors),
          itemStyle: { color: idx === 0 ? '#1677ff' : idx === 1 ? '#52c41a' : '#faad14' },
          lineStyle: { width: idx === 0 ? 2.5 : 1.8, type: idx === 2 ? 'dashed' : 'solid' },
          areaStyle: idx === 0 ? { opacity: 0.15 } : undefined
        }
      })
    }
  }, [forecastData])

  const deviceColumns: ColumnsType<Device> = [
    { title: '设备名称', dataIndex: 'name', key: 'name', width: 150, fixed: 'left',
      render: (_, r) => <Space><DatabaseOutlined style={{ color: '#1677ff' }} /><Text strong>{r.name}</Text></Space> },
    { title: '编号', dataIndex: 'code', key: 'code', width: 90 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (t) => {
        const map: Record<string, { tag: string; color: string }> = {
          snowmaker: { tag: '造雪机', color: 'blue' }, cablecar: { tag: '缆车', color: 'purple' },
          magicarpet: { tag: '魔毯', color: 'cyan' }, snowgroomer: { tag: '压雪车', color: 'geekblue' }
        }
        return <Tag color={map[t].color}>{map[t].tag}</Tag>
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => {
        const map: Record<string, any> = {
          running: { color: 'green', text: '运行中' }, stopped: { color: 'default', text: '停机' },
          warning: { color: 'orange', text: '告警' }, fault: { color: 'red', text: '故障' },
          maintenance: { color: 'purple', text: '维保中' }
        }
        return <Badge status={s === 'running' ? 'success' : s === 'warning' ? 'warning' : s === 'fault' ? 'error' : s === 'maintenance' ? 'processing' : 'default'} text={<Tag color={map[s].color}>{map[s].text}</Tag>} />
      }
    },
    { title: '位置', dataIndex: 'location', key: 'location', ellipsis: true, width: 150 },
    { title: '累计运行', dataIndex: 'runHours', key: 'runHours', width: 100,
      render: (h, r) => (
        <Tooltip title={`下次维保: ${r.nextMaintenance}`}>
          <span>
            <Text>{h}h</Text>
            <Progress
              percent={Math.min(100, Math.floor(h / r.maintenanceInterval * 100))}
              size="small"
              status={h > r.maintenanceInterval ? 'exception' : h > r.maintenanceInterval * 0.85 ? 'active' : 'normal'}
              style={{ marginTop: 2 }}
            />
          </span>
        </Tooltip>
      )
    },
    { title: '功率(kW)', dataIndex: 'powerConsumption', key: 'powerConsumption', width: 90,
      render: (v) => <Text type={v > 80 ? 'danger' : v > 40 ? 'warning' : 'success'}>{v || '-'}</Text> },
    { title: '耗水(L/h)', dataIndex: 'waterConsumption', key: 'waterConsumption', width: 90, render: (v) => v ? v : '-' },
    { title: '效率', dataIndex: 'efficiency', key: 'efficiency', width: 100,
      render: (v, r) => r.status === 'running' ? (
        <Progress percent={v} size="small" status={v < 85 ? 'exception' : 'normal'} />
      ) : <Text type="secondary">-</Text>
    },
    { title: '上次维保', dataIndex: 'lastMaintenance', key: 'lastMaintenance', width: 110 },
    { title: '告警信息', dataIndex: 'warningMessage', key: 'warningMessage', width: 180,
      render: (v) => v ? <Tag color="red" icon={<Alert />}>{v}</Tag> : <Text type="secondary">无</Text> }
  ]

  const handleRefresh = () => {
    message.loading({ content: '正在刷新数据源...', key: 'refresh' })
    setTimeout(() => {
      message.success({ content: '数据刷新完成！', key: 'refresh' })
    }, 1200)
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="stat-card" title={<Space><WifiOutlined style={{ color: '#1677ff' }} />数据源接入状态监控</Space>}
            extra={
              <Space>
                <Badge status="success" text={`${DataSourceStatus.filter(d => d.status === 'connected').length} 在线`} />
                <Badge status="warning" text={`${DataSourceStatus.filter(d => d.status === 'warning').length} 告警`} />
                <Badge status="error" text={`${DataSourceStatus.filter(d => d.status === 'disconnected').length} 离线`} />
                <a onClick={handleRefresh} style={{ marginLeft: 12 }}><ReloadOutlined /> 刷新</a>
              </Space>
            }>
            <Row gutter={[12, 12]}>
              {DataSourceStatus.map((d, i) => (
                <Col xs={24} sm={12} md={8} xl={8 / 3} key={i}>
                  <div style={{
                    padding: 12, borderRadius: 8,
                    border: '1px solid ' + (d.status === 'connected' ? '#b7eb8f' : d.status === 'warning' ? '#ffd591' : '#ffa39e'),
                    background: d.status === 'connected' ? '#f6ffed' : d.status === 'warning' ? '#fffbe6' : '#fff1f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text strong style={{ fontSize: 13 }}>{d.name}</Text>
                      <Badge status={d.status === 'connected' ? 'success' : d.status === 'warning' ? 'warning' : 'error'} />
                    </div>
                    <Row gutter={[4, 4]}>
                      <Col span={12}>
                        <div style={{ fontSize: 10, color: '#8c8c8c' }}><ClockCircleOutlined /> 延迟</div>
                        <Text type={d.latency > 400 ? 'danger' : d.latency > 200 ? 'warning' : 'success'} style={{ fontSize: 13, fontWeight: 500 }}>{d.latency}ms</Text>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 10, color: '#8c8c8c' }}><DatabaseOutlined /> 数据量</div>
                        <Text strong style={{ fontSize: 13 }}>{d.dataCount}</Text>
                      </Col>
                    </Row>
                    <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4 }}>上次：{d.lastSync.slice(11)}</div>
                    {d.warning && <Alert type={d.status === 'disconnected' ? 'error' : 'warning'} message={d.warning} showIcon size="small" style={{ marginTop: 6, padding: '4px 8px' }} />}
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            className="stat-card"
            title={<Space><CloudOutlined style={{ color: '#13c2c2' }} />气象预报数据中心</Space>}
            tabList={[{ key: 'chart', tab: <span><LineChartOutlined /> 趋势图</span> }, { key: 'table', tab: <span><DatabaseOutlined /> 详细数据</span> }]}
            tabBarExtraContent={
              <Space>
                <Select value={weatherDays} onChange={setWeatherDays} style={{ width: 130 }} size="small">
                  <Option value={1}>未来24小时</Option>
                  <Option value={2}>未来48小时</Option>
                  <Option value={3}>未来72小时</Option>
                </Select>
                <Tag icon={<CheckCircleOutlined />} color="green">气象局API</Tag>
              </Space>
            }
          >
            {(tab) => {
              if (tab === 'chart') {
                return (
                  <div>
                    <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
                      {Object.keys(weatherByDay).map(date => {
                        const wd = weatherByDay[date]
                        const maxT = Math.max(...wd.map(w => w.temperature))
                        const minT = Math.min(...wd.map(w => w.temperature))
                        const avgWind = (wd.reduce((s, w) => s + w.windSpeed, 0) / wd.length).toFixed(1)
                        const totalSnow = (wd.reduce((s, w) => s + w.snowfall, 0)).toFixed(1)
                        const isWeekend = dayjs(date).day() === 0 || dayjs(date).day() === 6
                        return (
                          <Col xs={24} sm={12} md={6} key={date}>
                            <div style={{ padding: 12, borderRadius: 8, background: isWeekend ? '#e6f7ff' : '#fafafa', border: '1px solid #e8e8e8' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text strong>{dayjs(date).format('MM-DD dddd')}</Text>
                                {isWeekend && <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>周末</Tag>}
                              </div>
                              <Row>
                                <Col span={12}><Statistic title={<span style={{ fontSize: 11 }}>气温范围</span>} prefix={<ArrowDownOutlined style={{ color: '#1677ff' }} />} value={minT} suffix={`~ ${maxT}°C`} valueStyle={{ fontSize: 16 }} /></Col>
                                <Col span={12}><Statistic title={<span style={{ fontSize: 11 }}>降雪总量</span>} value={totalSnow} suffix="mm" valueStyle={{ fontSize: 16, color: '#13c2c2' }} /></Col>
                              </Row>
                              <Row>
                                <Col span={12}><div style={{ fontSize: 11, color: '#8c8c8c' }}>平均风速</div><Text strong style={{ color: '#52c41a' }}>{avgWind} m/s</Text></Col>
                                <Col span={12}><div style={{ fontSize: 11, color: '#8c8c8c' }}>造雪条件</div>
                                  {minT < -2 && avgWind < 15
                                    ? <Tag color="green" style={{ fontSize: 10, margin: 0 }}>极佳</Tag>
                                    : minT < 0 && avgWind < 20
                                      ? <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>良好</Tag>
                                      : minT < 2 && avgWind < 25
                                        ? <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>一般</Tag>
                                        : <Tag color="red" style={{ fontSize: 10, margin: 0 }}>不宜</Tag>
                                  }
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        )
                      })}
                    </Row>
                    <ReactECharts option={weatherChartOption} style={{ height: 340 }} notMerge />
                  </div>
                )
              }
              return (
                <Table<WeatherForecast>
                  size="small"
                  dataSource={weather.slice(0, weatherDays * 24)}
                  columns={[
                    { title: '日期', dataIndex: 'date', key: 'date', width: 100, fixed: 'left',
                      render: (d) => <Tag color="blue">{dayjs(d).format('MM-DD ddd')}</Tag> },
                    { title: '时间', dataIndex: 'time', key: 'time', width: 70 },
                    { title: '天气', dataIndex: 'weatherCondition', key: 'weatherCondition', width: 80,
                      render: (w) => <Tag icon={<CloudOutlined />}>{w}</Tag> },
                    { title: '温度(°C)', dataIndex: 'temperature', key: 'temperature', width: 90,
                      render: (t) => <Text type={t < -10 ? 'danger' : t < 0 ? 'warning' : 'success'} strong>{t}°</Text> },
                    { title: '风速', dataIndex: 'windSpeed', key: 'windSpeed', width: 80,
                      render: (v, r) => <span>{v}m/s <Text type="secondary">({r.windDirection})</Text></span> },
                    { title: '湿度', dataIndex: 'humidity', key: 'humidity', width: 80, render: (h) => `${h}%` },
                    { title: '降雪', dataIndex: 'snowfall', key: 'snowfall', width: 80,
                      render: (s) => s > 0 ? <Text type="primary">{s} mm/h</Text> : <Text type="secondary">无</Text> },
                    { title: '能见度', dataIndex: 'visibility', key: 'visibility', width: 90,
                      render: (v) => <Text type={v < 500 ? 'danger' : v < 1000 ? 'warning' : 'success'}>{v}m</Text> },
                    { title: '气压', dataIndex: 'pressure', key: 'pressure', width: 80, render: (p) => `${p}hPa` },
                    { title: '造雪评估', key: 'sRating', width: 100, fixed: 'right',
                      render: (_, r) => {
                        const score = (r.temperature <= -5 ? 30 : r.temperature <= -2 ? 20 : r.temperature <= 0 ? 10 : 0)
                          + (r.humidity >= 70 ? 20 : r.humidity >= 50 ? 10 : 0)
                          + (r.windSpeed <= 10 ? 25 : r.windSpeed <= 15 ? 15 : r.windSpeed <= 20 ? 5 : 0)
                          + (r.snowfall > 2 ? 25 : r.snowfall > 0.5 ? 15 : 5)
                        return <Tag color={score >= 75 ? 'green' : score >= 50 ? 'blue' : score >= 25 ? 'orange' : 'red'}>
                          {score >= 75 ? '优' : score >= 50 ? '良' : score >= 25 ? '中' : '差'} ({score}分)
                        </Tag>
                      }
                    }
                  ]}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  rowKey={r => r.id}
                  scroll={{ x: 1100 }}
                />
              )
            }}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card className="stat-card" title={<Space><UserOutlined style={{ color: '#52c41a' }} />客流预测引擎</Space>}
            extra={
              <Space>
                <RangePicker size="small" defaultValue={[dayjs(), dayjs().add(2, 'day')]} />
                <Tag icon={<RiseOutlined />} color="green">AI模型</Tag>
              </Space>
            }>
            <ReactECharts option={forecastChartOption} style={{ height: 320 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[12, 8]}>
              {[0, 1, 2].map(i => {
                const d = dayjs().add(i, 'day').format('YYYY-MM-DD')
                const dayData = forecastData.filter(f => f.date === d)
                const total = dayData.reduce((s, f) => s + f.totalVisitors, 0)
                const peak = Math.max(...dayData.map(f => f.totalVisitors), 0)
                const peakHour = dayData.find(f => f.totalVisitors === peak)?.hour
                return (
                  <Col xs={24} sm={8} key={i}>
                    <Card size="small" style={{ borderRadius: 6, background: i === 0 ? '#f0f9ff' : undefined }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(d).format('MM-DD')}</Text>
                      <Statistic title={<span style={{ fontSize: 11, color: '#8c8c8c' }}>预计客流（人次）</span>} value={total} valueStyle={{ fontSize: 20, color: '#1677ff' }} />
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <Text type="secondary">高峰：</Text>
                        <Text strong>{peak}人</Text>
                        <Text type="secondary"> ( {peakHour}:00 )</Text>
                      </div>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className="stat-card"
            title={<Space><ThunderboltOutlined style={{ color: '#faad14' }} />设备实时状态数据流</Space>}
            extra={<Tag icon={<CloudServerOutlined />} color="purple">IoT实时</Tag>}
          >
            <Table<Device>
              size="small"
              dataSource={devices}
              columns={deviceColumns}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              rowKey={r => r.id}
              scroll={{ x: 1300, y: 360 }}
              onRow={(r) => ({
                onClick: () => r.warningMessage && message.warning(r.warningMessage)
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DataCenter
