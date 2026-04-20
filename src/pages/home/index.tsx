import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import './index.scss'

const T = {
  pageTitle: '',
  search: '搜索菜品、大厨',
  blindBoxTitle: '菜品盲盒',
  blindBoxSub: '今天还能抽 2 次',
  openBox: '立即开启',
  systemRecommend: '今日推荐菜品',
  chefRecommend: '大厨推荐菜品',
  order: '去订单列表',
  ticket: '饭票',
  loading: '正在加载推荐...',
  noDishes: '暂无菜品'
}

interface HomeChef {
  id: number
  name: string
  rating: number
  specialty: string
  dish: string
  price: number
}

interface SystemDish {
  id: number
  name: string
  chefName: string
  price: number
}

const toChef = (item: any, index: number): HomeChef => ({
  id: asNumber(item?.id ?? item?.chef_id, index + 1),
  name: String(item?.name ?? item?.nickname ?? item?.username ?? `未知大厨${index + 1}`),
  rating: asNumber(item?.rating ?? item?.score, 5.0),
  specialty: String(item?.specialty ?? item?.description ?? '家常菜'),
  dish: String((item?.dishes?.[0] ?? item?.dish ?? {})?.name ?? item?.dish_name ?? '暂无菜品'),
  price: asNumber((item?.dishes?.[0] ?? item?.dish ?? {})?.price ?? item?.price, 0)
})

const toSystemDish = (chef: HomeChef, index: number): SystemDish => ({
  id: chef.id * 100 + index,
  name: chef.dish,
  chefName: chef.name,
  price: chef.price
})

const HomeScreen = () => {
  const [chefs, setChefs] = useState<HomeChef[]>([])
  const [systemDishes, setSystemDishes] = useState<SystemDish[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadChefs = async () => {
      setLoading(true)
      try {
        const result = await api.order.chefs()
        const list = pickList(result, ['chefs']).slice(0, 4)
        if (list.length > 0) {
          const mappedChefs = list.map(toChef)
          setChefs(mappedChefs)
          setSystemDishes(mappedChefs.slice(0, 2).map(toSystemDish))
        }
      } catch {
        setChefs([])
        setSystemDishes([])
      } finally {
        setLoading(false)
      }
    }
    loadChefs()
  }, [])

  const goToBlindBox = () => {
    Taro.navigateTo({ url: '/pages/blindBox/index' })
  }

  const goToOrderList = () => {
    Taro.navigateTo({ url: '/pages/orderList/index' })
  }

  return (
    <View className="home-container">
      <ScrollView className="scroll-content" scrollY>
        <View className="page-wrap">
          <Text className="page-title">{T.pageTitle}</Text>

          <View className="blind-box-card" onClick={goToBlindBox}>
            <View className="blind-box-text-wrap">
              <Text className="blind-box-title">{T.blindBoxTitle}</Text>
              <Text className="blind-box-sub-title">{T.blindBoxSub}</Text>
              <View className="open-btn">
                <Text className="open-btn-text">{T.openBox}</Text>
              </View>
            </View>
            <Image
              src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cartoon%20food%20blind%20box%20illustration%20pink%20background&image_size=square"
              mode="aspectFit"
              className="blind-box-icon"
            />
          </View>

          <View className="section-wrap">
            <Text className="section-title">{T.systemRecommend}</Text>
            {loading && <Text className="loading">{T.loading}</Text>}
            {systemDishes.length > 0 ? (
              systemDishes.map((dish) => (
                <View key={dish.id} className="system-dish-card">
                  <View className="system-dish-icon-box">
                    <Text className="system-dish-icon">🍳</Text>
                  </View>
                  <View className="system-dish-info">
                    <Text className="system-dish-name">{dish.name}</Text>
                    <Text className="system-dish-chef">{dish.chefName}</Text>
                  </View>
                  <Text className="system-dish-price">{dish.price} 币</Text>
                </View>
              ))
            ) : (
              <View className="empty-placeholder-card">
                <Text className="empty-icon">🍽️</Text>
                <Text className="empty-placeholder-text">{T.noDishes}</Text>
              </View>
            )}
          </View>

          <View className="section-wrap">
            <Text className="section-title">{T.chefRecommend}</Text>
            {chefs.length > 0 ? (
              chefs.map((chef) => (
                <View key={chef.id} className="chef-card">
                  <View className="chef-row">
                    <View className="avatar-box">
                      <Text className="avatar-icon">👨🍳</Text>
                    </View>
                    <View className="chef-info">
                      <View className="name-row">
                        <Text className="chef-name">{chef.name}</Text>
                        <View className="rating-badge">
                          <Text className="star-icon">⭐</Text>
                          <Text className="rating-num">{chef.rating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text className="specialty-text">{chef.specialty}</Text>
                    </View>
                    <View className="action-btn-small" onClick={goToOrderList}>
                      <Text className="action-btn-small-text">{T.order}</Text>
                    </View>
                  </View>

                  <View className="dish-preview">
                    <Text className="dish-preview-name">{chef.dish}</Text>
                    <View className="coin-badge">
                      <Text className="coin-icon">💰</Text>
                      <Text className="coin-text">{T.ticket} {chef.price} 币</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-placeholder-card">
                <Text className="empty-icon">👤</Text>
                <Text className="empty-placeholder-text">{T.noDishes}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default HomeScreen
