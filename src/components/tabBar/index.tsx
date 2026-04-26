import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter, useDidShow, useDidHide } from '@tarojs/taro'
import { useUser } from '../../context/UserContext'
import api from '../../utils/api'
import { pickData, asNumber } from '../../utils/response'
import homeIcon from '../../assets/homeIcon.jpg'
import diandanIcon from '../../assets/diandan.jpg'
import myIcon from '../../assets/my.jpg'
import shangchengIcon from '../../assets/sahngcheng.jpg'
import planIcon from '../../assets/plan.jpg'
import './index.scss'

// 根据图片顺序：首页、任务、点餐、商城、我的
const foodieTabs = [
  { pagePath: '/pages/home/index', text: '首页', iconPath: homeIcon, selectedIconPath: homeIcon },
  { pagePath: '/pages/orders/index', text: '任务', iconPath: planIcon, selectedIconPath: planIcon, badge: true },
  { pagePath: '/pages/order/index', text: '点餐', iconPath: diandanIcon, selectedIconPath: diandanIcon, isCenter: true },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: shangchengIcon, selectedIconPath: shangchengIcon },
  { pagePath: '/pages/family/index', text: '我的', iconPath: myIcon, selectedIconPath: myIcon }
]

const chefTabs = [
  { pagePath: '/pages/home/index', text: '首页', iconPath: homeIcon, selectedIconPath: homeIcon },
  { pagePath: '/pages/orders/index', text: '任务', iconPath: planIcon, selectedIconPath: planIcon, badge: true },
  { pagePath: '/recipePackage/pages/recipe/index', text: '菜品', iconPath: diandanIcon, selectedIconPath: diandanIcon, isCenter: true },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: shangchengIcon, selectedIconPath: shangchengIcon },
  { pagePath: '/pages/family/index', text: '我的', iconPath: myIcon, selectedIconPath: myIcon }
]

// 判断当前环境
const isH5 = process.env.TARO_ENV === 'h5'

const CustomTabBar = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [orderBadge, setOrderBadge] = useState(0)
  const { user, isLogin } = useUser()
  const router = useRouter()
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pageVisibleRef = useRef(false)

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
      // H5 中 router.path 可能包含查询参数，需要去除
      currentPath = (router.path || '').split('?')[0]
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
    if (!pageVisibleRef.current) {
      return
    }

    if (!isLogin) {
      setOrderBadge(0)
      return
    }

    try {
      const result = await api.order.unreadCount()
      const data = pickData<any>(result, {})
      if (!pageVisibleRef.current) {
        return
      }
      setOrderBadge(asNumber(data?.count, 0))
    } catch (error) {
      console.error('加载未读订单数量失败:', error)
    }
  }, [isLogin])

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    loadUnreadCount()
    pollingTimerRef.current = setInterval(() => {
      void loadUnreadCount()
    }, 30000)
  }, [loadUnreadCount, stopPolling])

  useDidShow(() => {
    pageVisibleRef.current = true
    startPolling()
  })

  useDidHide(() => {
    pageVisibleRef.current = false
    stopPolling()
  })

  useEffect(() => {
    return () => {
      pageVisibleRef.current = false
      stopPolling()
    }
  }, [stopPolling])

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
          className={`tab-item ${index === activeIndex ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
          onClick={() => handleClick(index)}
        >
          <View className={`tab-icon-wrap ${item.isCenter ? 'center-icon-wrap' : ''}`}>
            <Image
              src={index === activeIndex ? item.selectedIconPath : item.iconPath}
              className={`tab-icon ${item.isCenter ? 'center-icon' : ''}`}
              mode='aspectFit'
            />
            {item.badge && orderBadge > 0 && (
              <View className='badge'>
                <Text className='badge-text'>{orderBadge > 99 ? '99+' : orderBadge}</Text>
              </View>
            )}
          </View>
          <Text className={`tab-text ${item.isCenter ? 'center-text' : ''}`}>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}

export default CustomTabBar
