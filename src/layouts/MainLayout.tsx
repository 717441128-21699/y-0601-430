import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography, App as AntdApp } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined, DatabaseOutlined, ScheduleOutlined, TeamOutlined,
  SafetyOutlined, ToolOutlined, BarChartOutlined, BellOutlined,
  UserOutlined, LogoutOutlined, SettingOutlined, QuestionCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '驾驶舱概览' },
  { key: '/data-center', icon: <DatabaseOutlined />, label: '数据接入中心' },
  { key: '/schedule', icon: <ScheduleOutlined />, label: '雪道排程管理' },
  { key: '/coach', icon: <TeamOutlined />, label: '教练排班管理' },
  { key: '/safety', icon: <SafetyOutlined />, label: '安全监控救援' },
  { key: '/device', icon: <ToolOutlined />, label: '设备维保管理' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '统计报表分析' }
]

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { message, notification } = AntdApp.useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'))

  const { currentUser, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAppStore()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      message.success('已退出登录（模拟）')
    } else {
      message.info(`功能开发中：${key}`)
    }
  }

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id)
  }

  const notificationDropdown: MenuProps['items'] = [
    {
      key: 'header',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px' }}>
          <Text strong>通知中心（{unreadCount}条未读）</Text>
          <a onClick={(e) => { e.stopPropagation(); markAllNotificationsRead() }}>全部已读</a>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    ...notifications.slice(0, 8).map(n => ({
      key: n.id,
      label: (
        <div
          onClick={() => handleNotificationClick(n.id)}
          style={{ padding: '8px 12px', cursor: 'pointer', borderLeft: n.read ? 'none' : '3px solid #1677ff', background: n.read ? 'transparent' : '#f6ffed' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: 13 }}>{n.title}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{n.timestamp.slice(11)}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{n.message}</Text>
        </div>
      )
    })),
    { type: 'divider' },
    {
      key: 'viewAll',
      label: <div style={{ textAlign: 'center', padding: '6px 12px', color: '#1677ff' }}>查看全部通知</div>
    }
  ]

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{ background: '#001529' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 20,
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? (
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>雪</span>
          ) : (
            <Space>
              <span style={{
                width: 32, height: 32, borderRadius: 6,
                background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 'bold', fontSize: 16
              }}>雪</span>
              <Title level={5} style={{ color: '#fff', margin: 0 }}>
                滑雪场智慧调度系统
              </Title>
            </Space>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          height: 64
        }}>
          <Space size={16}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 20, cursor: 'pointer', color: '#595959' },
              onClick: () => setCollapsed(!collapsed)
            })}
            <Text type="secondary" style={{ fontSize: 14 }}>
              当前时间：<Text style={{ color: '#262626', fontFamily: 'monospace' }}>{currentTime}</Text>
            </Text>
            <Badge status="processing" text={<Text type="success" style={{ fontSize: 13 }}>系统运行正常</Text>} />
          </Space>
          <Space size={16}>
            <Dropdown menu={{ items: notificationDropdown }} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <span style={{ cursor: 'pointer', fontSize: 18, color: '#595959', padding: 8 }}>
                  <BellOutlined />
                </span>
              </Badge>
            </Dropdown>
            <QuestionCircleOutlined style={{ fontSize: 18, color: '#595959', cursor: 'pointer' }} onClick={() => message.info('帮助文档正在建设中')} />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 6 }}>
                <Avatar style={{ background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)' }}>
                  {currentUser.avatar}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{currentUser.name}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{currentUser.role}</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ overflow: 'hidden', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
