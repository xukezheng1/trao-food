import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useUser } from '../../context/UserContext'
import api from '../../utils/api'
import { pickData, asNumber } from '../../utils/response'
import dachu from '../../assets/dachu.png'
import manghe from '../../assets/manghe.png'
import jizhang from '../../assets/jizhang.png'
import homeIcon from '../../assets/homeIcon.png'
import './index.scss'

const foodieTabs = [
  { pagePath: '/pages/order/index', text: '点餐', iconPath: dachu, selectedIconPath: dachu },
  { pagePath: '/pages/orders/index', text: '订单', iconPath: dachu, selectedIconPath: dachu, badge: true },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: manghe, selectedIconPath: manghe },
  { pagePath: '/pages/expense/index', text: '记账', iconPath: jizhang, selectedIconPath: jizhang },
  { pagePath: '/pages/family/index', text: '我的', iconPath: homeIcon, selectedIconPath: homeIcon }
]

const chefTabs = [
  { pagePath: '/pages/recipe/index', text: '菜谱', iconPath: dachu, selectedIconPath: dachu },
  { pagePath: '/pages/orders/index', text: '订单', iconPath: dachu, selectedIconPath: dachu, badge: true },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: manghe, selectedIconPath: manghe },
  { pagePath: '/pages/expense/index', text: '记账', iconPath: jizhang, selectedIconPath: jizhang },
  { pagePath: '/pages/family/index', text: '我的', iconPath: homeIcon, selectedIconPath: homeIcon }
]

// 判断当前环境
const isH5 = process.env.TARO_ENV === 'h5'

const CustomTabBar = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [orderBadge, setOrderBadge] = useState(0)
  const { user, isLogin } = useUser()
  const router = useRouter()

  // 根据用户角色选择对应的 tabs
  const isChef = user?.role === 'chef'
  const tabs = isChef ? chefTabs : foodieTabs
  
  // 调试：打印当前角色
  useEffect(() => {
    console.log('[TabBar] user.role:', user?.role, 'isChef:', isChef, 'tabs:', tabs.map(t => t.text))
  }, [user?.role, isChef, tabs])

  useEffect(() => {
    // H5 环境使用 router.path，小程序使用 getCurrentPages
    let currentPath = ''
    
    if (isH5) {
      currentPath = router.path || ''
    } else {
      const pages = Taro.getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        currentPath = '/' + currentPage.route
      }
    }
    
    if (currentPath) {
      const index = tabs.findIndex(item => item.pagePath === currentPath)
      if (index !== -1) {
        setActiveIndex(index)
      }
    }
  }, [tabs, router.path])

  const loadUnreadCount = useCallback(async () => {
    if (!isLogin) {
      setOrderBadge(0)
      return
    }

    try {
      const result = await api.order.unreadCount()
      const data = pickData<any>(result, {})
      setOrderBadge(asNumber(data?.count, 0))
    } catch (error) {
      console.error('加载未读订单数量失败:', error)
    }
  }, [isLogin])

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  const handleClick = (index: number) => {
    const item = tabs[index]
    
    // H5 环境使用 redirectTo 代替 navigateTo，避免页面堆叠
    if (isH5) {
      Taro.redirectTo({ url: item.pagePath })
      return
    }
    
    // 小程序环境
    if (item.pagePath === '/pages/recipe/index') {
      Taro.reLaunch({ url: item.pagePath })
      return
    }
    Taro.switchTab({ url: item.pagePath })
  }

  if (!isLogin) return null

  return (
    <View className='custom-tab-bar'>
      {tabs.map((item, index) => (
        <View
          key={index}
          className={`tab-item ${index === activeIndex ? 'active' : ''}`}
          onClick={() => handleClick(index)}
        >
          <View className='tab-icon-wrap'>
            <Image
              src={index === activeIndex ? item.selectedIconPath : item.iconPath}
              className='tab-icon'
              mode='aspectFit'
            />
            {item.badge && orderBadge > 0 && (
              <View className='badge'>
                <Text className='badge-text'>{orderBadge > 99 ? '99+' : orderBadge}</Text>
              </View>
            )}
          </View>
          <Text className='tab-text'>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}

export default CustomTabBar
