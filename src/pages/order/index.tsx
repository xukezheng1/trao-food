﻿import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  search: '搜索菜品、商家',
  blindBoxTitle: '盲盒',
  blindBoxSub: '菜品盲盒',
  blindBoxTip: '花 30 元抽惊喜美食',
  blindBoxTip2: '每次抽取 1 份随机菜品',
  draw: '抽一个',
  enter: '进入点餐',
  noDishes: '暂无菜品',
  topDishes: '常点菜品',
  viewAll: '查看全部',
  monthSales: '月售',
  rating: '好评率'
}

interface Dish {
  id: number
  name: string
  price: number
  image?: string
  order_count?: number
  rating?: number
}

interface Chef {
  id: number
  name: string
  nickname?: string
  username: string
  rating: number
  specialty: string
  avatar?: string
  dish_count: number
  top_dishes: Dish[]
}

const toDish = (item: any): Dish => ({
  id: asNumber(item?.id, 0),
  name: String(item?.name ?? '未知菜品'),
  price: asNumber(item?.price, 0),
  image: item?.image,
  order_count: asNumber(item?.order_count ?? item?.orderCount, 0),
  rating: asNumber(item?.rating ?? 98, 0)
})

const toChef = (item: any): Chef => ({
  id: asNumber(item?.id, 0),
  name: String(item?.nickname ?? item?.username ?? '未知大厨'),
  nickname: item?.nickname,
  username: String(item?.username ?? ''),
  rating: asNumber(item?.rating ?? 5.0, 0),
  specialty: String(item?.specialty ?? '未填专业'),
  avatar: item?.avatar,
  dish_count: asNumber(item?.dish_count ?? item?.dishCount ?? 0, 0),
  top_dishes: []
})

const OrderScreen = () => {
  const [searchText, setSearchText] = useState('')
  const [chefs, setChefs] = useState<Chef[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { totalCount } = useCart()
  const { isLogin, authReady } = useUser()

  // 检查登录状态
  useEffect(() => {
    if (authReady && !isLogin) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [authReady, isLogin])

  const loadChefs = useCallback(async () => {
    if (!isLogin) return
    setRefreshing(true)
    try {
      const result = await api.order.chefs()
      let chefList = pickList(result, ['data']).map(toChef)

      chefList = await Promise.all(
        chefList.map(async (chef) => {
          try {
            const topDishesResult = await api.order.topDishes(chef.id)
            const topDishes = pickList(topDishesResult, ['data']).map(toDish)
            return { ...chef, top_dishes: topDishes }
          } catch {
            return chef
          }
        })
      )

      setChefs(chefList)
    } catch (err) {
      console.error('Load chefs error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [isLogin])

  useEffect(() => {
    if (isLogin) {
      loadChefs()
    }
  }, [loadChefs, isLogin])

  const goToBlindBox = () => {
    Taro.navigateTo({ url: '/pages/blindBox/index' })
  }

  const goToChefDetail = (chef: Chef) => {
    Taro.navigateTo({
      url: `/pages/chefDetail/index?chefId=${chef.id}&chefName=${encodeURIComponent(chef.name)}&chefAvatar=${encodeURIComponent(chef.avatar || '')}`
    })
  }

  const filteredChefs = chefs.filter((chef) => {
    if (!searchText.trim()) return true
    const keyword = searchText.trim().toLowerCase()
    return chef.name.toLowerCase().includes(keyword) || chef.specialty.toLowerCase().includes(keyword)
  })

  return (
    <View className="order-container">
      {/* 顶部搜索栏 */}
      <View className="header">
        <View className="search-bar">
          <Text className="search-icon">🔍</Text>
          <input
            type="text"
            placeholder={T.search}
            value={searchText}
            onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
            className="search-input"
          />
        </View>
        <View className="cart-icon-btn">
          <Text className="cart-icon">🛒</Text>
          {totalCount > 0 && (
            <View className="badge">
              <Text className="badge-text">{totalCount > 99 ? '99+' : totalCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="scroll-content" scrollY>
        {/* 盲盒区域 */}
        <View className="blind-box-section">
          <View className="blind-box-card" onClick={goToBlindBox}>
            <View className="blind-box-left">
              <View className="blind-box-title-large">
                <Text className="blind-box-title-text">{T.blindBoxTitle}</Text>
                <Text className="sparkle-icon">✨</Text>
              </View>
              <View className="gift-box">
                <Text className="gift-icon">🎁</Text>
                <Text className="question-mark">?</Text>
              </View>
            </View>
            <View className="blind-box-right">
              <Text className="blind-box-sub">{T.blindBoxSub}</Text>
              <Text className="blind-box-tip">{T.blindBoxTip}</Text>
              <Text className="blind-box-tip2">{T.blindBoxTip2}</Text>
              <View className="draw-btn" onClick={goToBlindBox}>
                <Text className="draw-btn-text">{T.draw}</Text>
                <Text className="finger-icon">👆</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 大厨列表 */}
        <View className="chefs-section">
          {filteredChefs.map((chef) => (
            <View key={chef.id} className="chef-card" onClick={() => goToChefDetail(chef)}>
              <View className="chef-main">
                <View className="chef-header">
                  {chef.avatar ? (
                    <Image src={chef.avatar} className="chef-avatar" mode="aspectFill" />
                  ) : (
                    <View className="chef-avatar chef-avatar-placeholder">
                      <Text className="chef-icon">👨‍🍳</Text>
                    </View>
                  )}
                  <View className="chef-info">
                    <Text className="chef-name">{chef.name}</Text>
                    <View className="rating-row">
                      <Text className="star-icon">⭐</Text>
                      <Text className="rating-text">{chef.rating.toFixed(1)}</Text>
                      <Text className="dot">·</Text>
                      <Text className="dish-count">{chef.dish_count}个</Text>
                    </View>
                  </View>
                </View>
                <Text className="specialty-text">{chef.specialty}</Text>
                <View className="enter-btn">
                  <Text className="enter-btn-text">{T.enter}</Text>
                  <Text className="arrow-icon">›</Text>
                </View>
              </View>

              {/* 常点菜品 */}
              <View className="top-dishes-section">
                <View className="section-header">
                  <Text className="section-icon">🍱</Text>
                  <Text className="section-title">{T.topDishes}</Text>
                  <Text className="view-all">{T.viewAll} ›</Text>
                </View>
                <View className="dishes-list">
                  {chef.top_dishes.length > 0 ? (
                    chef.top_dishes.slice(0, 2).map((dish) => (
                      <View key={dish.id} className="dish-item">
                        <View className="dish-image-wrapper">
                          {dish.image ? (
                            <Image src={dish.image} className="dish-image" mode="aspectFill" />
                          ) : (
                            <View className="dish-image-placeholder">
                              <Text className="dish-icon">🍱</Text>
                            </View>
                          )}
                        </View>
                        <View className="dish-info">
                          <View className="dish-name-row">
                            <Text className="dish-name">{dish.name}</Text>
                            <Text className="recommend-tag">推荐</Text>
                          </View>
                          <View className="dish-stats">
                            <Text className="dish-sales">{T.monthSales} {dish.order_count || 128}</Text>
                            <Text className="dish-rating">{T.rating} {dish.rating || 98}%</Text>
                          </View>
                          <View className="dish-price-row">
                            <Text className="dish-price">¥{dish.price}</Text>
                            <View className="add-btn">
                              <Text className="add-icon">+</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="no-dishes">
                      <Text className="no-dishes-text">{T.noDishes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <CustomTabBar />
    </View>
  )
}

export default OrderScreen
