import React, { useMemo, useState, useRef } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Statistic, Progress, Typography, Space, Divider,
  Button, App as AntdApp, Select, DatePicker, Tooltip, Empty, Alert
} from 'antd'
import {
  BarChartOutlined, UserOutlined, ThunderboltOutlined, DatabaseOutlined,
  FilePdfOutlined, DownloadOutlined, GlobalOutlined, RiseOutlined,
  EnvironmentOutlined, CalendarOutlined, FundOutlined, TeamOutlined,
  LineChartOutlined, ClockCircleOutlined, HeatMapOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '@/store'
import type { StatisticsDaily, Slope } from '@/types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const difficultyMap: Record<string, { color: string; text: string }> = {
  beginner: { color: 'green', text: '初级' },
  intermediate: { color: 'blue', text: '中级' },
  advanced: { color: 'orange', text: '高级' },
  expert: { color: 'red', text: '专家' }
}

const Statistics: React.FC = () => {
  const { message } = AntdApp.useApp()
  const { statistics, slopes, devices, rescueRecords, scheduleTasks } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(29, 'day'), dayjs()])
  const chartRef = useRef<any>(null)

  const filteredStats = useMemo(() => {
    if (!dateRange || !dateRange[0]) return statistics
    return statistics.filter(s => {
      const d = dayjs(s.date)
      return d.isAfter(dateRange[0].subtract(1, 'day')) && d.isBefore(dateRange[1].add(1, 'day'))
    })
  }, [statistics, dateRange])

  const totals = useMemo(() => ({
    visitors: filteredStats.reduce((s, x) => s + x.totalVisitors, 0),
    revenue: filteredStats.reduce((s, x) => s + x.revenue, 0),
    power: filteredStats.reduce((s, x) => s + x.powerConsumption, 0),
    water: filteredStats.reduce((s, x) => s + x.waterConsumption, 0),
    snow: filteredStats.reduce((s, x) => s + x.snowMakingOutput, 0),
    incidents: filteredStats.reduce((s, x) => s + x.incidentsCount, 0),
    rescues: filteredStats.reduce((s, x) => s + x.rescueCount, 0),
    avgStay: (filteredStats.reduce((s, x) => s + x.avgStayHours, 0) / (filteredStats.length || 1)).toFixed(1)
  }), [filteredStats])

  const visitorTrendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['客流', '营收(万元)'], top: 0, right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: filteredStats.map(s => s.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 30, interval: Math.floor(filteredStats.length / 15) }
    },
    yAxis: [
      { type: 'value', name: '人次', axisLabel: { fontSize: 10 } },
      { type: 'value', name: '万元', axisLabel: { fontSize: 10 }, splitLine: { show: false } }
    ],
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 10 }],
    series: [
      {
        name: '客流', type: 'bar', data: filteredStats.map(s => s.totalVisitors),
        itemStyle: {
          color: (p: any) => {
            const v = p.data
            const peak = Math.max(...filteredStats.map(x => x.totalVisitors))
            return v >= peak * 0.9 ? '#ff4d4f' : v >= peak * 0.75 ? '#faad14' : '#1677ff'
          },
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 24,
        markPoint: {
          data: [
            { type: 'max', name: '峰值' },
            { type: 'min', name: '低谷' }
          ],
          label: { fontSize: 10 }
        }
      },
      {
        name: '营收(万元)', type: 'line', smooth: true, yAxisIndex: 1,
        data: filteredStats.map(s => (s.revenue / 10000).toFixed(1)),
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2.5 },
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { opacity: 0.12 }
      }
    ]
  }), [filteredStats])

  const slopeVisitorOption = useMemo(() => {
    const slopeStats = slopes.map(s => {
      let total = 0
      filteredStats.forEach(st => { total += (st.visitorsBySlope[s.id] || 0) })
      return { name: s.name, value: total, difficulty: s.difficulty }
    }).sort((a, b) => b.value - a.value)
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 110, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: '累计人次' },
      yAxis: {
        type: 'category',
        data: slopeStats.map(s => s.name),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: slopeStats.map(s => ({
          value: s.value,
          itemStyle: {
            color: difficultyMap[s.difficulty]?.color || '#1677ff'
          }
        })),
        label: { show: true, position: 'right', fontSize: 10 },
        barMaxWidth: 20
      }]
    }
  }, [slopes, filteredStats])

  const powerWaterOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['电耗(kWh)', '水耗(吨)', '产雪量(m³)'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: filteredStats.map(s => s.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 30, interval: Math.floor(filteredStats.length / 15) }
    },
    yAxis: [
      { type: 'value', name: 'kWh / 吨', axisLabel: { fontSize: 10 } },
      { type: 'value', name: 'm³', splitLine: { show: false } }
    ],
    series: [
      { name: '电耗(kWh)', type: 'line', smooth: true, data: filteredStats.map(s => s.powerConsumption), itemStyle: { color: '#722ed1' }, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
      { name: '水耗(吨)', type: 'line', smooth: true, data: filteredStats.map(s => s.waterConsumption), itemStyle: { color: '#13c2c2' }, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
      { name: '产雪量(m³)', type: 'bar', yAxisIndex: 1, data: filteredStats.map(s => s.snowMakingOutput), itemStyle: { color: '#1677ff' }, barMaxWidth: 14 }
    ]
  }), [filteredStats])

  const deviceUtilizationOption = useMemo(() => {
    const devIds = Object.keys(filteredStats[0]?.deviceUtilization || {})
    const devNames: Record<string, string> = {
      d9: '缆车A线', d10: '缆车B线', d11: '缆车C线',
      d12: '缆车D线', d14: '魔毯1号', d15: '魔毯2号', d16: '魔毯3号'
    }
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: devIds.map(id => devNames[id]), top: 0, type: 'scroll' },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      xAxis: {
        type: 'category',
        data: filteredStats.map(s => s.date.slice(5)),
        axisLabel: { fontSize: 10, interval: Math.floor(filteredStats.length / 10) }
      },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: devIds.map((id, i) => ({
        name: devNames[id] || id,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa541c'][i] },
        data: filteredStats.map(s => (s.deviceUtilization[id] || 0).toFixed(1))
      }))
    }
  }, [filteredStats])

  const heatMapOption = useMemo(() => {
    const slopeData = slopes.filter(s => s.status !== 'closed').map(s => ({
      value: [s.position.x, s.position.y, Math.floor((s.currentVisitors / s.capacity) * 100)],
      name: s.name,
      slopeId: s.id,
      current: s.currentVisitors,
      capacity: s.capacity
    }))
    const heatPoints: number[][] = []
    slopeData.forEach(s => {
      const count = Math.floor(s.value[2] / 10)
      for (let i = 0; i < count; i++) {
        heatPoints.push([
          s.value[0] + (Math.random() - 0.5) * 60,
          s.value[1] + (Math.random() - 0.5) * 40,
          s.value[2] / count
        ])
      }
    })
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => p.seriesName === '雪道' ?
          `<b>${p.data.name}</b><br/>当前/容量：${p.data.current}/${p.data.capacity}人<br/>密度：${p.data.value[2]}%` : ''
      },
      visualMap: {
        show: true,
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        inRange: {
          color: ['#52c41a', '#95de64', '#ffec3d', '#ffa940', '#ff4d4f']
        },
        text: ['高', '低'],
        textStyle: { fontSize: 10 }
      },
      grid: { left: 10, right: 10, top: 40, bottom: 60 },
      xAxis: { show: false, min: 100, max: 900 },
      yAxis: { show: false, min: 100, max: 620, inverse: true },
      series: [
        {
          name: '游客分布热力',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          data: heatPoints,
          symbolSize: (val: number[]) => Math.max(8, val[2] * 0.6),
          rippleEffect: { brushType: 'stroke', scale: 3 },
          itemStyle: {
            color: '#ff4d4f',
            shadowBlur: 10,
            shadowColor: 'rgba(255, 77, 79, 0.5)'
          },
          zlevel: 1
        },
        {
          name: '雪道',
          type: 'scatter',
          symbolSize: (val: number[]) => Math.max(50, val[2] * 0.8 + 30),
          data: slopeData,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            color: (p: any) => {
              const v = p.data.value[2]
              return v > 85 ? 'rgba(255,77,79,0.65)' : v > 70 ? 'rgba(250,173,20,0.65)' : v > 40 ? 'rgba(22,119,255,0.55)' : 'rgba(82,196,26,0.55)'
            }
          },
          label: {
            show: true,
            formatter: (p: any) => `${p.data.name.slice(0, 4)}\n${p.data.value[2]}%`,
            position: 'inside',
            fontSize: 12,
            color: '#fff',
            fontWeight: 'bold',
            lineHeight: 14
          },
          zlevel: 10
        }
      ],
      graphic: [
        { type: 'text', left: 20, top: 10, style: { text: '🗺️ 雪道电子地图 - 游客热力分布（实时）', fontSize: 13, fontWeight: 'bold', fill: '#262626' } },
        { type: 'text', right: 20, top: 10, style: { text: `📍 在场总人数：${slopes.reduce((x, s) => x + s.currentVisitors, 0)} 人`, fontSize: 12, fill: '#595959' } }
      ]
    }
  }, [slopes])

  const dailyColumns: ColumnsType<StatisticsDaily> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110, fixed: 'left',
      render: (d) => {
        const isWeekend = dayjs(d).day() === 0 || dayjs(d).day() === 6
        return <Space>
          <CalendarOutlined style={{ color: isWeekend ? '#1677ff' : '#888' }} />
          <Text strong style={{ color: isWeekend ? '#1677ff' : undefined }}>{d.slice(5)}</Text>
          <Text type="secondary">{dayjs(d).format('dd')}</Text>
          {isWeekend && <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>周末</Tag>}
        </Space>
      }
    },
    { title: '客流', dataIndex: 'totalVisitors', key: 'visitors', width: 100,
      render: (v, _, idx) => {
        const max = Math.max(...filteredStats.map(s => s.totalVisitors))
        return <Space>
          <Text strong>{v.toLocaleString()}</Text>
          {v >= max * 0.9 && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>高峰</Tag>}
        </Space>
      },
      sorter: (a, b) => a.totalVisitors - b.totalVisitors
    },
    { title: '营收', key: 'revenue', width: 120, render: (_, r) => <Text type="success" strong>¥{r.revenue.toLocaleString()}</Text> },
    { title: '平均停留', key: 'stay', width: 100, render: (_, r) => <Tag color="cyan">{r.avgStayHours}小时</Tag> },
    { title: '电耗(kWh)', dataIndex: 'powerConsumption', key: 'power', width: 100, render: (v) => v.toLocaleString(),
      sorter: (a, b) => a.powerConsumption - b.powerConsumption },
    { title: '水耗(吨)', dataIndex: 'waterConsumption', key: 'water', width: 90, render: (v) => v },
    { title: '产雪(m³)', dataIndex: 'snowMakingOutput', key: 'snow', width: 90, render: (v) => v },
    { title: '事件/救援', key: 'safety', width: 110,
      render: (_, r) => <Space size={4}>
        <Tag color={r.incidentsCount > 3 ? 'red' : 'orange'}>事件 {r.incidentsCount}</Tag>
        <Tag color={r.rescueCount > 1 ? 'red' : 'green'}>救援 {r.rescueCount}</Tag>
      </Space>
    },
    { title: '缆车利用率', key: 'util', width: 160, fixed: 'right',
      render: (_, r) => {
        const vals = Object.values(r.deviceUtilization)
        const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
        return <Progress percent={Math.floor(avg)} size="small" />
      }
    }
  ]

  const exportPDF = async (type: 'daily' | 'monthly' = 'monthly') => {
    message.loading({ content: '正在生成PDF报告...', key: 'pdf' })
    try {
      await new Promise(r => setTimeout(r, 800))
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFillColor(22, 119, 255)
      doc.rect(0, 0, pageWidth, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Ski Resort Management Report', pageWidth / 2, 12, { align: 'center' })

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report Period: ${filteredStats[0]?.date || '-'} ~ ${filteredStats[filteredStats.length - 1]?.date || '-'}`, 14, 28)
      doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 34)

      const summaryData = [
        ['Key Metrics', 'Value', '', 'Key Metrics', 'Value'],
        ['Total Visitors', totals.visitors.toLocaleString(), '', 'Total Revenue', `¥ ${totals.revenue.toLocaleString()}`],
        ['Avg Daily Visitors', Math.floor(totals.visitors / (filteredStats.length || 1)).toLocaleString(), '', 'Avg Stay Hours', `${totals.avgStay} h`],
        ['Power Consumption', `${totals.power.toLocaleString()} kWh`, '', 'Water Consumption', `${totals.water.toLocaleString()} T`],
        ['Snow Production', `${totals.snow.toLocaleString()} m³`, '', 'Safety Incidents', `${totals.incidents} / Rescue ${totals.rescues}`]
      ]

      autoTable(doc, {
        startY: 40,
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [22, 119, 255], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 2: { lineWidth: 0, fillColor: [255, 255, 255] } }
      })

      const yPos = (doc as any).lastAutoTable.finalY + 8
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Daily Operations Detail', 14, yPos)

      const bodyData: any[][] = filteredStats.slice().reverse().map(s => [
        s.date,
        s.totalVisitors.toLocaleString(),
        '¥ ' + s.revenue.toLocaleString(),
        `${s.avgStayHours} h`,
        s.powerConsumption.toLocaleString(),
        `${s.waterConsumption} T`,
        `${s.snowMakingOutput} m³`,
        `${s.incidentsCount}/${s.rescueCount}`
      ])

      autoTable(doc, {
        startY: yPos + 4,
        head: [['Date', 'Visitors', 'Revenue', 'Avg Stay', 'Power(kWh)', 'Water', 'Snow', 'Incidents/Rescue']],
        body: bodyData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [82, 196, 26], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 255] }
      })

      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Page ${i} of ${totalPages}  |  Ski Resort Intelligent Dispatch System`, pageWidth / 2, 200, { align: 'center' })
      }

      const fileName = type === 'monthly'
        ? `滑雪场月度运营报告_${dayjs().format('YYYY-MM')}.pdf`
        : `滑雪场日报_${dayjs().format('YYYY-MM-DD')}.pdf`
      doc.save(fileName)
      message.success({ content: `PDF报告已导出：${fileName}`, key: 'pdf' })
    } catch (e) {
      console.error(e)
      message.error({ content: 'PDF导出失败，请重试', key: 'pdf' })
    }
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 4 }}>
        <Col>
          <Space size={16}>
            <Title level={4} style={{ margin: 0 }}>
              <BarChartOutlined style={{ color: '#1677ff' }} /> 统计报表与数据大屏
            </Title>
            <Tag color="processing"><LineChartOutlined /> 数据分析模式</Tag>
          </Space>
        </Col>
        <Col>
          <Space>
            <RangePicker value={dateRange} onChange={(d) => setDateRange(d)} allowClear={false} />
            <Select defaultValue="all" style={{ width: 120 }} size="middle">
              <Option value="all">全部雪道</Option>
              {slopes.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
            <Button icon={<DownloadOutlined />} onClick={() => exportPDF('daily')}>导出日报</Button>
            <Button type="primary" icon={<FilePdfOutlined />} onClick={() => exportPDF('monthly')}>
              导出月度PDF报告
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card info-card" hoverable>
            <Statistic title={<Space><UserOutlined /> 统计周期总客流</Space>}
              value={totals.visitors} prefix="" suffix="人次"
              valueStyle={{ color: '#1677ff' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>日均 {(totals.visitors / Math.max(1, filteredStats.length)).toFixed(0)} 人次</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card success-card" hoverable>
            <Statistic title={<Space><RiseOutlined /> 累计营收</Space>}
              value={totals.revenue} prefix="¥" suffix=""
              valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>人均消费 ¥{(totals.revenue / Math.max(1, totals.visitors)).toFixed(0)}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning-card" hoverable>
            <Statistic title={<Space><ThunderboltOutlined /> 能源消耗（电/水）</Space>}
              value={totals.power} suffix="kWh"
              valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>耗水 {totals.water.toLocaleString()} 吨 | 产雪 {totals.snow}m³</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card danger-card" hoverable>
            <Statistic title={<Space><TeamOutlined /> 安全事件 / 救援</Space>}
              value={totals.incidents} suffix="起"
              valueStyle={{ color: totals.incidents > 50 ? '#ff4d4f' : '#1677ff' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>救援 {totals.rescues} 起 | 平均停留 {totals.avgStay}h</Text>
          </Card>
        </Col>
      </Row>

      <Card className="stat-card" style={{ marginTop: 16 }}
        tabList={[
          { key: 'overview', tab: <span><FundOutlined /> 综合经营概览</span> },
          { key: 'map', tab: <span><HeatMapOutlined /> 电子地图 & 热力分布</span> },
          { key: 'slope', tab: <span><EnvironmentOutlined /> 雪道维度分析</span> },
          { key: 'energy', tab: <span><ThunderboltOutlined /> 能源与产雪</span> },
          { key: 'device', tab: <span><BarChartOutlined /> 设备利用率</span> },
          { key: 'detail', tab: <span><CalendarOutlined /> 每日明细报表</span> }
        ]}
        activeTabKey={activeTab} onChange={setActiveTab}
        tabBarExtraContent={<Space>
          <Alert type="success" showIcon message="数据自动每5分钟刷新" style={{ padding: '2px 8px', margin: 0 }} size="small" />
        </Space>}
      >
        {activeTab === 'overview' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} xl={18}>
                <Card size="small" title={<Space><UserOutlined style={{ color: '#1677ff' }} />客流与营收趋势（{filteredStats.length}天）</Space>}
                  extra={<Tooltip title="客流柱状图+营收折线图，支持缩放"><FundOutlined /></Tooltip>}>
                  <ReactECharts ref={chartRef} option={visitorTrendOption} style={{ height: 340 }} />
                </Card>
              </Col>
              <Col xs={24} xl={6}>
                <Card size="small" title="关键指标分析">
                  <Space direction="vertical" style={{ width: '100%' }} size={10}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12 }}>周末客流占比</Text>
                        <Text strong style={{ fontSize: 12, color: '#1677ff' }}>
                          {Math.floor(filteredStats.filter(s => {
                            const d = dayjs(s.date).day()
                            return d === 0 || d === 6
                          }).reduce((x, s) => x + s.totalVisitors, 0) / totals.visitors * 100)}%
                        </Text>
                      </div>
                      <Progress percent={Math.floor(filteredStats.filter(s => {
                        const d = dayjs(s.date).day()
                        return d === 0 || d === 6
                      }).reduce((x, s) => x + s.totalVisitors, 0) / totals.visitors * 100)} size="small" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12 }}>平均缆车利用率</Text>
                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                          {Math.floor(filteredStats.reduce((x, s) => {
                            const v = Object.values(s.deviceUtilization)
                            return x + v.reduce((a, b) => a + b, 0) / (v.length || 1)
                          }, 0) / filteredStats.length)}%
                        </Text>
                      </div>
                      <Progress percent={Math.floor(filteredStats.reduce((x, s) => {
                        const v = Object.values(s.deviceUtilization)
                        return x + v.reduce((a, b) => a + b, 0) / (v.length || 1)
                      }, 0) / filteredStats.length)} status="active" size="small" strokeColor="#52c41a" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12 }}>安全达标率</Text>
                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                          {Math.max(0, 100 - Math.floor(totals.incidents / filteredStats.length * 10))}%
                        </Text>
                      </div>
                      <Progress percent={Math.max(0, 100 - Math.floor(totals.incidents / filteredStats.length * 10))} size="small" status="success" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12 }}>造雪机利用</Text>
                        <Text strong style={{ fontSize: 12 }}>87%</Text>
                      </div>
                      <Progress percent={87} size="small" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12 }}>营收 vs 成本</Text>
                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>利润率 38%</Text>
                      </div>
                      <Progress percent={38} size="small" strokeColor="#52c41a" />
                    </div>
                  </Space>
                  <Divider style={{ margin: '12px 0' }} />
                  <ReactECharts
                    style={{ height: 140 }}
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
                      series: [{
                        type: 'pie', radius: ['40%', '65%'], center: ['50%', '40%'], avoidLabelOverlap: true,
                        label: { show: false },
                        data: [
                          { value: Math.floor(totals.revenue * 0.32), name: '门票', itemStyle: { color: '#1677ff' } },
                          { value: Math.floor(totals.revenue * 0.28), name: '租赁', itemStyle: { color: '#52c41a' } },
                          { value: Math.floor(totals.revenue * 0.2), name: '教练课', itemStyle: { color: '#722ed1' } },
                          { value: Math.floor(totals.revenue * 0.12), name: '餐饮', itemStyle: { color: '#faad14' } },
                          { value: Math.floor(totals.revenue * 0.08), name: '其他', itemStyle: { color: '#eb2f96' } }
                        ]
                      }]
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>营收结构分布</Text>
                </Card>
              </Col>
            </Row>
            <Card size="small" title={<Space><ClockCircleOutlined style={{ color: '#faad14' }} /> 24小时时段客流分布（平均）</Space>}>
              <ReactECharts
                style={{ height: 220 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  legend: { data: ['工作日平均', '周末平均'], top: 0 },
                  grid: { left: 45, right: 20, top: 35, bottom: 30 },
                  xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
                  yAxis: { type: 'value', name: '人次' },
                  series: [
                    {
                      name: '工作日平均', type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: '#1677ff' },
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 200, 480, 760, 1020, 1150, 1320, 1480, 1380, 1150, 980, 720, 480, 220, 80, 0, 0]
                    },
                    {
                      name: '周末平均', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#faad14' }, lineStyle: { width: 2.5 },
                      data: [0, 0, 0, 0, 0, 0, 0, 120, 520, 980, 1480, 1920, 2180, 2450, 2680, 2520, 2180, 1850, 1420, 980, 580, 260, 80, 0]
                    }
                  ]
                }}
              />
            </Card>
          </div>
        )}
        {activeTab === 'map' && (
          <div>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              message="电子地图使用说明"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>气泡大小代表雪道面积/容量，颜色代表实时密度（绿→黄→红）</li>
                  <li>涟漪动画点代表实时游客UWB定位信号，分布越集中表示人流越密集</li>
                  <li>底部颜色条显示密度刻度范围，可通过视觉直观评估客流分布</li>
                </ul>
              }
            />
            <ReactECharts option={heatMapOption} style={{ height: 520 }} notMerge />
          </div>
        )}
        {activeTab === 'slope' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} xl={16}>
                <Card size="small" title={<Space><EnvironmentOutlined /> 各雪道累计客流排名</Space>}>
                  <ReactECharts option={slopeVisitorOption} style={{ height: 380 }} />
                </Card>
              </Col>
              <Col xs={24} xl={8}>
                <Card size="small" title="雪道综合评分">
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {slopes.filter(s => s.status !== 'closed').map(s => {
                      const score = Math.floor(
                        (s.status === 'open' ? 25 : s.status === 'partial' ? 15 : 0) +
                        Math.min(25, s.snowThickness / 4) +
                        Math.min(25, 100 - (s.currentVisitors / s.capacity * 100)) +
                        25
                      )
                      return (
                        <div key={s.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Space size={4}>
                              <Tag color={difficultyMap[s.difficulty].color} style={{ fontSize: 10, margin: 0 }}>{difficultyMap[s.difficulty].text}</Tag>
                              <Text style={{ fontSize: 12 }}>{s.name}</Text>
                            </Space>
                            <Text strong style={{ fontSize: 12, color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>{score}分</Text>
                          </div>
                          <Progress percent={score} size="small" status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'} />
                        </div>
                      )
                    })}
                  </Space>
                </Card>
              </Col>
            </Row>
            <Table<Slope>
              size="small"
              dataSource={slopes}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1100 }}
              columns={[
                { title: '雪道名称', dataIndex: 'name', key: 'name', width: 130,
                  render: (n, r) => <Space><Tag color={difficultyMap[r.difficulty].color}>{difficultyMap[r.difficulty].text}</Tag><Text strong>{n}</Text></Space>
                },
                { title: '难度', dataIndex: 'difficulty', key: 'diff', width: 80 },
                { title: '长度/宽度', key: 'size', width: 120, render: (_, r) => <Text>{r.length}m × {r.width}m</Text> },
                { title: '积雪厚度', key: 'snow', width: 140,
                  render: (_, r) => <Progress percent={Math.min(100, r.snowThickness)}
                    format={() => `${r.snowThickness}/${r.minSnowThickness}cm`}
                    status={r.snowThickness < r.minSnowThickness ? 'exception' : 'success'} size="small" />
                },
                { title: '状态', dataIndex: 'status', key: 'status', width: 90,
                  render: (s) => ({ open: <Tag color="green">开放</Tag>, partial: <Tag color="orange">部分</Tag>, closed: <Tag color="red">关闭</Tag>, maintenance: <Tag color="purple">维护</Tag> } as any)[s]
                },
                { title: '统计客流(累计)', key: 'total', width: 110,
                  render: (_, r) => {
                    const t = filteredStats.reduce((x, s) => x + (s.visitorsBySlope[r.id] || 0), 0)
                    return <Text strong type={t > 8000 ? 'danger' : t > 4000 ? 'warning' : 'success'}>{t.toLocaleString()}</Text>
                  },
                  sorter: (a, b) => filteredStats.reduce((x, s) => x + (s.visitorsBySlope[a.id] || 0), 0) - filteredStats.reduce((x, s) => x + (s.visitorsBySlope[b.id] || 0), 0)
                },
                { title: '当前/容量', key: 'curr', width: 110, render: (_, r) => <Text>{r.currentVisitors}/{r.capacity}</Text> },
                { title: '推荐指数', key: 'rec', width: 100,
                  render: (_, r) => {
                    const t = filteredStats.reduce((x, s) => x + (s.visitorsBySlope[r.id] || 0), 0)
                    return <Space>
                      {[1, 2, 3, 4, 5].map(i =>
                        <span key={i} style={{ color: t > i * 2000 ? '#faad14' : '#d9d9d9', fontSize: 14 }}>★</span>
                      )}
                    </Space>
                  }
                }
              ]}
            />
          </div>
        )}
        {activeTab === 'energy' && (
          <div>
            <ReactECharts option={powerWaterOption} style={{ height: 360 }} />
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card info-card">
                  <Statistic title="累计电耗" value={totals.power.toLocaleString()} suffix="kWh" valueStyle={{ fontSize: 20, color: '#722ed1' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>日均 {(totals.power / filteredStats.length).toFixed(0)} kWh</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card success-card">
                  <Statistic title="累计水耗" value={totals.water.toLocaleString()} suffix="吨" valueStyle={{ fontSize: 20, color: '#13c2c2' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>日均 {(totals.water / filteredStats.length).toFixed(0)} 吨</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card warning-card">
                  <Statistic title="累计造雪" value={totals.snow.toLocaleString()} suffix="m³" valueStyle={{ fontSize: 20, color: '#1677ff' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>日均 {(totals.snow / filteredStats.length).toFixed(0)} m³</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card danger-card">
                  <Statistic title="单位能耗成本" value={0.38} prefix="¥" suffix="/kWh" valueStyle={{ fontSize: 20, color: '#ff4d4f' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>水电总成本：¥{(totals.power * 0.38 + totals.water * 4).toLocaleString()}</Text>
                </Card>
              </Col>
            </Row>
          </div>
        )}
        {activeTab === 'device' && (
          <div>
            <ReactECharts option={deviceUtilizationOption} style={{ height: 360 }} />
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {devices.filter(d => ['cablecar', 'magicarpet'].includes(d.type)).map(d => {
                const avg = filteredStats.reduce((x, s) => x + (s.deviceUtilization[d.id] || 0), 0) / filteredStats.length
                return (
                  <Col xs={24} sm={12} lg={6} key={d.id}>
                    <Card size="small" className="stat-card" hoverable>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 12 }}>{d.name}</Text>
                        <Tag color={({ cablecar: 'purple', magicarpet: 'cyan' } as any)[d.type]} style={{ fontSize: 10, margin: 0 }}>
                          {({ cablecar: '缆车', magicarpet: '魔毯' } as any)[d.type]}
                        </Tag>
                      </div>
                      <Progress type="dashboard" percent={Math.floor(avg)} size={100}
                        strokeColor={avg > 85 ? '#52c41a' : avg > 60 ? '#1677ff' : '#faad14'} />
                      <Row gutter={8} style={{ marginTop: 4 }}>
                        <Col span={12}><Text type="secondary" style={{ fontSize: 10 }}>运行时长</Text><br /><Text strong style={{ fontSize: 11 }}>{d.runHours}h</Text></Col>
                        <Col span={12}><Text type="secondary" style={{ fontSize: 10 }}>当前状态</Text><br />
                          <Tag color={({ running: 'green', stopped: 'default', warning: 'orange', fault: 'red' } as any)[d.status]} style={{ fontSize: 10, margin: 0 }}>
                            {({ running: '运行', stopped: '停机', warning: '告警', fault: '故障' } as any)[d.status]}
                          </Tag>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        )}
        {activeTab === 'detail' && (
          <div>
            <Table<StatisticsDaily>
              size="middle"
              dataSource={filteredStats.slice().reverse()}
              columns={dailyColumns}
              rowKey="date"
              scroll={{ x: 1100 }}
              pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: [12, 20, 30, 50] }}
              summary={(pageData) => {
                const v = pageData.reduce((s, x) => s + x.totalVisitors, 0)
                const r = pageData.reduce((s, x) => s + x.revenue, 0)
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                      <Table.Summary.Cell index={0}>本页合计/平均</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}><Text type="primary" strong>{v.toLocaleString()} 人次</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={2}><Text type="success" strong>¥{r.toLocaleString()}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}><Tag>{(pageData.reduce((s, x) => s + x.avgStayHours, 0) / pageData.length).toFixed(1)}h</Tag></Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>{pageData.reduce((s, x) => s + x.powerConsumption, 0).toLocaleString()} kWh</Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>{pageData.reduce((s, x) => s + x.waterConsumption, 0)} T</Table.Summary.Cell>
                      <Table.Summary.Cell index={6}>{pageData.reduce((s, x) => s + x.snowMakingOutput, 0)} m³</Table.Summary.Cell>
                      <Table.Summary.Cell index={7}>
                        <Tag>事件 {pageData.reduce((s, x) => s + x.incidentsCount, 0)}</Tag>
                        <Tag color="red">救援 {pageData.reduce((s, x) => s + x.rescueCount, 0)}</Tag>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8}>-</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default Statistics
