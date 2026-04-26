import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CustomTabBar from '../../components/tabBar'
import './index.scss'
import cander from '../../assets/icon/icon (1).jpg'
import gift from '../../assets/icon/gift.png'
import homeTop from '../../assets/icon/home-top.png'
import decorIcon from '../../assets/icon/icon (2).jpg'
import albumIcon from '../../assets/icon/icon (4).jpg'
import treeIcon from '../../assets/icon/icon (10).png'
import coinIcon from '../../assets/icon/coin.png'
// 任务图标
import taskEatIcon from '../../assets/icon/jpg (1).png'
import taskChatIcon from '../../assets/icon/jpg (2).png'
import taskPhotoIcon from '../../assets/icon/jpg (3).png'
import calendarIcon from '../../assets/icon/png.png'
import heartIcon from '../../assets/icon/heart.png'
import orderIcon from '../../assets/icon/orderIcon.png'
import photoIcon from '../../assets/icon/photoIcon.png'
import planCanderIcon from '../../assets/icon/plancander.png'
import planOrderIcon from '../../assets/icon/planorder.png'
import sweetMomentIcon from '../../assets/icon/jpg (1).png'
const T = {
  checkIn: '签到',
  calendar: '日历',
  daysTogether: '我们已相爱',
  days: '天',
  daysDesc: '一起走过的每一天，都值得纪念', 
  coupleCoins: '情侣币余额',
  exchange: '去兑换',
  coupleDecor: '情侣装扮',
  loveAlbum: '恋爱相册',
  coupleTree: '情侣树',
  growing: '成长中',
  todayTasks: '今日任务',
  more: '更多',
  ongoingOrder: '正在进行的点单',
  viewAll: '查看全部',
  messageWall: '甜蜜留言墙',
  leaveMessage: '我要留言',
  interactionStats: '互动统计',
  moreData: '更多数据',
  completedTasks: '已完成任务',
  cookTogether: '一起做饭',
  coupleCoinsEarned: '情侣币获得',
  sweetMoments: '甜蜜时刻',
  times: '次',
  items: '项'
}

// 模拟数据
const MOCK_DATA = {
  coupleNames: { name1: '小熊软糖', name2: '奶油泡芙' },
  daysCount: 520,
  coins: 2314,
  tasks: [
    { id: 1, title: '一起吃一顿饭', reward: 50, status: 'pending' },
    { id: 2, title: '互说早安晚安', reward: 20, status: 'completed' },
    { id: 3, title: '拍一张合照', reward: 30, status: 'progress', current: 0, total: 1 }
  ],
  ongoingOrder: {
    name: '草莓松饼早餐',
    type: '早餐',
    status: '还差1步完成',
    steps: [
      { icon: '👦', label: '下单', done: true },
      { icon: '🍳', label: '备餐中', done: true },
      { icon: '👧', label: '等待评价', done: false }
    ]
  },
  messages: [
    { id: 1, user: 'girl', content: '今天你做的早餐超好吃~爱你哟', time: '08:20', likes: 3 },
    { id: 2, user: 'boy', content: '看到你开心我也超幸福！么么哒~', time: '08:22', likes: 2 }
  ],
  stats: {
    completedTasks: 128,
    cookTogether: 32,
    coinsEarned: 2314,
    sweetMoments: 256
  },
  recentMoments: [
    { user: '奶油泡芙', action: '给小熊软糖送了一个拥抱', time: '2小时前' },
    { user: '小熊软糖', action: '完成了草莓松饼早餐的备餐', time: '3小时前' },
    { user: '奶油泡芙', action: '给小熊软糖留言了', time: '昨天 22:30' }
  ]
}

const HomeScreen = () => {
  const [data] = useState(MOCK_DATA)

  const goToCheckIn = () => {
    Taro.showToast({ title: '签到功能开发中', icon: 'none' })
  }

  const goToCalendar = () => {
    Taro.showToast({ title: '日历功能开发中', icon: 'none' })
  }

  const goToExchange = () => {
    Taro.showToast({ title: '兑换功能开发中', icon: 'none' })
  }

  const goToDecor = () => {
    Taro.navigateTo({ url: '/mallPackage/pages/bindRelation/index' })
  }

  const goToAlbum = () => {
    Taro.showToast({ title: '相册功能开发中', icon: 'none' })
  }

  const goToTree = () => {
    Taro.showToast({ title: '情侣树功能开发中', icon: 'none' })
  }

  const goToTasks = () => {
    Taro.navigateTo({ url: '/pages/orders/index' })
  }

  const goToOrder = () => {
    Taro.navigateTo({ url: '/pages/order/index' })
  }

  const goToMessageWall = () => {
    Taro.showToast({ title: '留言墙功能开发中', icon: 'none' })
  }

  const goToStats = () => {
    Taro.showToast({ title: '统计数据功能开发中', icon: 'none' })
  }

  const handleTaskAction = (taskId: number, status: string) => {
    if (status === 'completed') {
      Taro.showToast({ title: '已完成', icon: 'success' })
    } else {
      Taro.showToast({ title: '去完成任务', icon: 'none' })
    }
  }

  return (
    <View className="home-container">
      {/* 顶部导航 */}
      <View className="top-nav">
        <View className="check-in-btn" onClick={goToCheckIn}>
          <Image src={gift} className="check-in-icon-img" mode="aspectFill" />
          <Text className="check-in-text">{T.checkIn}</Text>
        </View>
        <View className="check-in-btn" onClick={goToCalendar}>
          <Image src={cander} className="check-in-icon-img" mode="aspectFill" />
          <Text className="check-in-text">{T.calendar}</Text>
        </View>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="content-wrap">
          {/* 情侣信息卡片 */}
          <View className="couple-card">
            {/* 右侧信息区域 */}
            <View className="couple-info">
              {/* 名称行 */}
              <View className="names-row">
                <Text className="couple-name name1">小熊软糖</Text>
                <Text className="couple-ampersand">&</Text>
                <Text className="couple-name name2">奶油泡芙</Text>
              </View>
              {/* 相恋天数 */}
              <View className="days-row">
                <Text className="days-label">我们已相爱</Text>
              </View>
              <View className="days-number-row">
                <Text className="heart-icon">💖</Text>
                <Text className="couple-days">520</Text>
                <Text className="days-unit">天</Text>
              </View>
            </View>
          </View>

        {/* 情侣币和功能入口 */}
        <View className="coins-section">
          {/* 左侧余额卡片 */}
          <View className="coins-card">
            <View className="coins-header">
              <Image src={coinIcon} className="coin-icon-img" mode="aspectFill" />
              <Text className="coins-label">{T.coupleCoins}</Text>
            </View>
            <View className="coins-row">
              <Text className="coins-amount">{data.coins.toLocaleString()}</Text>
              <View className="exchange-btn" onClick={goToExchange}>
                  <View className="exchange-line">去兑换›</View>
              </View>
            </View>
          </View>
          {/* 右侧功能按钮 */}
          <View className="feature-grid">
            <View className="feature-item" onClick={goToDecor}>
              <View className="feature-icon decor">
                <Image src={decorIcon} className="feature-img" mode="aspectFill" />
              </View>
              <Text className="feature-name">{T.coupleDecor}</Text>
            </View>
            <View className="feature-item" onClick={goToAlbum}>
              <View className="feature-icon album">
                <Image src={albumIcon} className="feature-img" mode="aspectFill" />
              </View>
              <Text className="feature-name">{T.loveAlbum}</Text>
            </View>
            <View className="feature-item" onClick={goToTree}>
              <View className="feature-icon tree">
                <Image src={treeIcon} className="feature-img" mode="aspectFill" />
              </View>
              <Text className="feature-name">{T.coupleTree}</Text>
            </View>
          </View>
        </View>

        {/* 今日任务和互动统计 */}
        <View className="tasks-stats-section">
          {/* 今日任务 */}
          <View className="tasks-card">
            <View className="card-header">
              <View className="header-left">
                <Image src={calendarIcon} className="header-title-img" mode="aspectFill" />
                <Text className="header-title">{T.todayTasks}</Text>
              </View>
              <View className="header-more" onClick={goToTasks}>
                <Text className="more-text">{T.more}</Text>
                <Text className="more-arrow">›</Text>
              </View>
            </View>
            <View className="task-list">
              {data.tasks.map((task) => (
                <View key={task.id} className="task-item">
                  <View className="task-icon">
                    {task.id === 1 && <Image src={taskEatIcon} className="task-icon-img" mode="aspectFill" />}
                    {task.id === 2 && <Image src={taskPhotoIcon} className="task-icon-img" mode="aspectFill" />}
                    {task.id === 3 && <Image src={taskChatIcon} className="task-icon-img" mode="aspectFill" />}
                  </View>
                  <View className="task-info">
                    <Text className="task-title">{task.title}</Text>
                    <Text className="task-reward">奖励 {task.reward} 币</Text>
                  </View>
                  <View
                    className={`task-action ${task.status}`}
                    onClick={() => handleTaskAction(task.id, task.status)}
                  >
                    {task.status === 'pending' && <Image src={heartIcon} className="action-icon-img" mode="aspectFill" />}
                    {task.status === 'progress' && <Text className="action-progress">0/1</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 互动统计 */}
          <View className="stats-card">
            <View className="card-header">
              <View className="header-left">
                <Text className="header-title">{T.interactionStats}</Text>
              </View>
            </View>
            <View className="stats-list">
              <View className="stat-row">
                <Image src={planCanderIcon} className="stat-icon-img" mode="aspectFill" />
                <Text className="stat-value">{data.stats.completedTasks}{T.items}</Text>
              </View>
              <View className="stat-row">
                <Image src={planOrderIcon} className="stat-icon-img" mode="aspectFill" />
                <Text className="stat-value">{data.stats.cookTogether}{T.times}</Text>
              </View>
              <View className="stat-row">
                <Image src={coinIcon} className="stat-icon-img" mode="aspectFill" />
                <Text className="stat-value">{data.stats.coinsEarned.toLocaleString()}枚</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 进行中的点单 */}
        <View className="order-section">
          <View className="order-card">
            <View className="card-header">
              <View className="header-left">
                <Image src={taskEatIcon} className="icon-img" mode="aspectFill" />
                <Text className="header-title">{T.ongoingOrder}</Text>
              </View>
              <View className="header-more" onClick={goToOrder}>
                <Text className="more-text">{T.viewAll}</Text>
                <Text className="more-arrow">›</Text>
              </View>
            </View>
            <View className="ongoing-order">
              <View className="order-content-card">
                <View className="order-header">
                  <View className="order-header-left">
                    <Text className="order-name">{data.ongoingOrder.name}</Text>
                    <View className="order-tags">
                      <Text className="order-type">{data.ongoingOrder.type}</Text>
                      <Text className="order-status">{data.ongoingOrder.status}</Text>
                    </View>
                  </View>
                </View>
                <View className="order-steps">
                  {data.ongoingOrder.steps.map((step, index) => (
                    <View key={index} className={`step-item ${step.done ? 'done' : ''}`}>
                      <View className="step-avatar">
                        <Text>{step.icon}</Text>
                      </View>
                      <Text className="step-label">{step.label}</Text>
                      {index < data.ongoingOrder.steps.length - 1 && (
                        <View className="step-line" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
              <Image src={orderIcon} className="order-corner-icon" mode="aspectFill" />
            </View>
          </View>
        </View>

        {/* 纪念日区域 */}
        <View className="anniversary-message-section">
          {/* 纪念日提醒 */}
          <View className="anniversary-card">
            <View className="card-header">
              <View className="header-left">
                  <Image src={cander} className="icon-img" mode="aspectFill" />
                <Text className="header-title">纪念日提醒</Text>
              </View>
            </View>
            <View className="anniversary-content">
              <View className="anniversary-info">
                <View className="anniversary-label">距离纪念日</View>
                <View className="anniversary-title-row"><View className="anniversary-title">我们的第一次旅行</View>还有 <View className="days-highlight">15</View> 天</View>
                <Text className="anniversary-date">2025.06.20 星期五</Text>
              </View>
            </View>
          </View>
          <Image src={photoIcon} className="anniversary-corner-icon" mode="aspectFill" />
        </View>

        {/* 底部留白 */}
        <View className="bottom-padding" />
    </View>
      </ScrollView >

  <CustomTabBar />
    </View >
  )
}

export default HomeScreen
