import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  search: '鎼滅储鑿滃搧',
  blindBoxTitle: '鑿滃搧鐩茬洅',
  blindBoxSub: '鑺?30 鍏冩娊閬撴儕鍠滅編椋?,
  blindBoxTip: '姣忔鎶藉彇 1 浠介殢鏈鸿彍鍝?,
  draw: '鎶戒竴涓?,
  enter: '杩涘叆鐐归',
  noDishes: '鏆傛棤鑿滃搧'
}

interface Dish {
  id: number
  name: string
  price: number
  image?: string
  order_count?: number
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
  name: String(item?.name ?? '鏈煡鑿滃搧'),
  price: asNumber(item?.price, 0),
  image: item?.image,
  order_count: asNumber(item?.order_count ?? item?.orderCount, 0)
})

const toChef = (item: any): Chef => ({
  id: asNumber(item?.id ?? item?.chef_id, 0),
  name: String(item?.nickname ?? item?.username ?? `鍘ㄥ笀${item?.id}`),
  nickname: item?.nickname,
  username: String(item?.username ?? ''),
  rating: asNumber(item?.rating ?? item?.score, 5.0),
  specialty: String(item?.specialty ?? item?.description ?? '瀹跺父鑿?),
  avatar: item?.avatar,
  dish_count: asNumber(item?.dish_count ?? item?.dishCount, 0),
  top_dishes: []
})

const OrderScreen = () => {
  const [searchText, setSearchText] = useState('')
  const [chefs, setChefs] = useState<Chef[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { totalCount } = useCart()
  const { isLogin, authReady } = useUser()

  // 妫€鏌ョ櫥褰曠姸鎬?  useEffect(() => {
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
    Taro.navigateTo({ url: `/pages/chefDetail/index?chefId=${chef.id}&chefName=${encodeURIComponent(chef.name)}` })
  }

  const filteredChefs = chefs.filter((chef) => {
    if (!searchText.trim()) return true
    const keyword = searchText.trim().toLowerCase()
    return chef.name.toLowerCase().includes(keyword) || chef.specialty.toLowerCase().includes(keyword)
  })

  return (
    <View className="order-container">
      <View className="header">
        <View className="search-bar">
          <Text className="search-icon">馃攳</Text>
          <input
            type="text"
            placeholder={T.search}
            value={searchText}
            onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
            className="search-input"
          />
        </View>
        <View className="cart-icon-btn">
          <Text className="cart-icon">馃洅</Text>
          {totalCount > 0 && (
            <View className="badge">
              <Text className="badge-text">{totalCount > 99 ? '99+' : totalCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="blind-box-section">
          <View className="blind-box-card" onClick={goToBlindBox}>
            <View className="blind-box-left">
              <View className="blind-box-machine">
                <Text className="gift-icon">馃巵</Text>
              </View>
            </View>
            <View className="blind-box-right">
              <Text className="blind-box-title">{T.blindBoxTitle}</Text>
              <Text className="blind-box-sub">{T.blindBoxSub}</Text>
              <Text className="blind-box-tip">{T.blindBoxTip}</Text>
              <View className="draw-btn" onClick={goToBlindBox}>
                <Text className="draw-btn-text">{T.draw}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="chefs-list">
          {filteredChefs.map((chef) => (
            <View key={chef.id} className="chef-card" onClick={() => goToChefDetail(chef)}>
              <View className="chef-info-section">
                <View className="chef-header">
                  {chef.avatar ? (
                    <Image src={chef.avatar} className="chef-avatar" />
                  ) : (
                    <View className="chef-avatar chef-avatar-placeholder">
                      <Text className="chef-icon">馃懆馃嵆</Text>
                    </View>
                  )}
                  <View className="chef-name-section">
                    <Text className="chef-name">{chef.name}</Text>
                    <View className="rating-row">
                      <Text className="star-icon">猸?/Text>
                      <Text className="rating-text">{chef.rating.toFixed(1)}</Text>
                      <Text className="dish-count">路 {chef.dish_count}閬撹彍</Text>
                    </View>
                  </View>
                </View>
                <Text className="specialty-text">{chef.specialty}</Text>
                <View className="enter-btn">
                  <Text className="enter-btn-text">{T.enter}</Text>
                  <Text className="arrow-icon">鈥?/Text>
                </View>
              </View>

              <View className="dishes-section">
                {chef.top_dishes.length > 0 ? (
                  chef.top_dishes.slice(0, 2).map((dish, index) => (
                    <View key={dish.id} className={`top-dish-card ${index > 0 ? 'top-dish-card-margin' : ''}`}>
                      <View className="top-dish-image-placeholder">
                        {dish.image ? (
                          <Image src={dish.image} className="top-dish-image" />
                        ) : (
                          <Text className="dish-icon">馃嵄</Text>
                        )}
                      </View>
                      <Text className="top-dish-name">{dish.name}</Text>
                      <Text className="top-dish-price">楼{dish.price}</Text>
                    </View>
                  ))
                ) : (
                  <View className="no-dishes-placeholder">
                    <Text className="no-dishes-icon">馃嵔锔?/Text>
                    <Text className="no-dishes-text">{T.noDishes}</Text>
                  </View>
                )}
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

