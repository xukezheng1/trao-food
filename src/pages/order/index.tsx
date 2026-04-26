import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import CustomTabBar from '../../components/tabBar'
import orderCarIcon from '../../assets/icon/orderCar.png'
import zaocanIcon from '../../assets/icon/zaocan.png'
import wucanIcon from '../../assets/icon/wucan.png'
import wancanIcon from '../../assets/icon/wancan.png'
import shucaiIcon from '../../assets/icon/shucai.png'
import huncaiIcon from '../../assets/icon/huncai.png'
import tianpinIcon from '../../assets/icon/tianpin.png'
import yinpinIcon from '../../assets/icon/yinpin.png'
import wangheIcon from '../../assets/icon/manghe.png'
import xianshiIcon from '../../assets/icon/xainshi.png'
import './index.scss'

const T = {
  location: '想要小厨房呀',
  noDishes: '暂无菜品',
  goOrder: '去下单',
  total: '合计'
}

interface Dish {
  id: number
  name: string
  price: number
  image?: string
  order_count?: number
  rating?: number
  category?: string
}

interface Chef {
  id: number
  nickname?: string
  username?: string
  avatar?: string
}

const toDish = (item: any): Dish => ({
  id: asNumber(item?.id, 0),
  name: String(item?.name ?? '未知菜品'),
  price: asNumber(item?.price, 0),
  image: item?.image,
  order_count: asNumber(item?.order_count ?? item?.orderCount, 0),
  rating: asNumber(item?.rating ?? 98, 0),
  category: normalizeCategory(item?.category)
})

const categories = [
    { id: 'all', name: '全部', icon: '' },
  { id: 'zaocan', name: '早餐', icon: zaocanIcon },
  { id: 'wucan', name: '午餐', icon: wucanIcon },
  { id: 'wancan', name: '晚餐', icon: wancanIcon },
  { id: 'shucai', name: '蔬菜', icon: shucaiIcon },
  { id: 'huncai', name: '荤菜', icon: huncaiIcon },
  { id: 'tianpin', name: '甜品', icon: tianpinIcon },
  { id: 'yinpin', name: '饮品', icon: yinpinIcon },
  { id: 'wanghe', name: '盲盒', icon: wangheIcon },
  { id: 'xianshi', name: '限时', icon: xianshiIcon },
]

const categoryAlias: Record<string, string> = {
  breakfast: 'zaocan',
  lunch: 'wucan',
  dinner: 'wancan',
  dessert: 'tianpin',
  drink: 'yinpin',
  manghe: 'wanghe',
  xainshi: 'xianshi'
}

const normalizeCategory = (category: any) => {
  const key = String(category ?? 'all')
  return categoryAlias[key] || key
}

const localDishImages: Record<number, string> = {
  1: zaocanIcon,
  2: shucaiIcon,
  3: tianpinIcon,
  4: wucanIcon,
  5: zaocanIcon,
  6: wucanIcon,
  7: huncaiIcon,
  8: shucaiIcon
}

const OrderScreen = () => {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [currentChef, setCurrentChef] = useState<Chef | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const { items, totalCount, totalPrice, addItem, removeItem } = useCart()
  const { isLogin, authReady } = useUser()

  useEffect(() => {
    if (authReady && !isLogin) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [authReady, isLogin])

  const loadDishes = useCallback(async () => {
    if (!isLogin) return
    setRefreshing(true)
    try {
      const chefsResult = await api.order.chefs()
      const chefs = pickList(chefsResult, ['chefs', 'data']) as Chef[]
      const chef = chefs[0] || null
      setCurrentChef(chef)

      const result = await api.order.dishes(chef?.id)
      const dishList = pickList(result, ['data']).map(toDish)
      setDishes(dishList)
    } catch (err) {
      console.error('Load dishes error:', err)
      setDishes([
        { id: 1, name: '火腿煎蛋三明治', price: 18, category: 'zaocan', image: '', order_count: 120, rating: 98 },
        { id: 2, name: '牛油果鸡蛋沙拉', price: 22, category: 'shucai', image: '', order_count: 85, rating: 96 },
        { id: 3, name: '燕麦水果酸奶杯', price: 16, category: 'tianpin', image: '', order_count: 200, rating: 99 },
        { id: 4, name: '鲜虾粥', price: 20, category: 'wucan', image: '', order_count: 150, rating: 97 },
        { id: 5, name: '豆浆油条套餐', price: 12, category: 'zaocan', image: '', order_count: 300, rating: 95 },
        { id: 6, name: '番茄牛肉饭', price: 28, category: 'wucan', image: '', order_count: 180, rating: 98 },
        { id: 7, name: '宫保鸡丁套餐', price: 26, category: 'huncai', image: '', order_count: 220, rating: 97 },
        { id: 8, name: '香煎三文鱼沙拉', price: 30, category: 'shucai', image: '', order_count: 90, rating: 99 }
      ])
    } finally {
      setRefreshing(false)
    }
  }, [isLogin])

  useEffect(() => {
    if (isLogin) {
      loadDishes()
    }
  }, [loadDishes, isLogin])

  const getItemCount = (dishId: number) => {
    const item = items.find(i => i.dish_id === dishId)
    return item ? item.quantity : 0
  }

  const goToOrderConfirm = () => {
    if (totalCount === 0) {
      Taro.showToast({ title: '请先选择菜品', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/orderPackage/pages/orderConfirm/index' })
  }

  const handleAddDish = (dish: Dish) => {
    addItem({
      dish_id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      image: getDishImage(dish),
      category: dish.category
    }, currentChef?.id || 0, {
      name: currentChef?.nickname || currentChef?.username || '大厨',
      avatar: currentChef?.avatar
    })
  }

  const handleRemoveDish = (dishId: number) => {
    removeItem(dishId)
  }

  const filteredDishes = dishes.filter((dish) => (
    activeCategory === 'all' || dish.category === activeCategory
  ))

  const groupedDishes = activeCategory === 'all'
    ? categories
        .filter(cat => cat.id !== 'all')
        .map(cat => ({
          category: cat,
          dishes: dishes.filter(dish => dish.category === cat.id)
        }))
        .filter(group => group.dishes.length > 0)
    : [{
        category: categories.find(cat => cat.id === activeCategory) || categories[0],
        dishes: filteredDishes
      }]

  const getDishImage = (dish: Dish) => {
    return dish.image || localDishImages[dish.id] || zaocanIcon
  }

  return (
    <View className="order-container">
      <View className="order-top">
        <View className="hero-card" />
      </View>

      <View className="notice-row">
        <Text className="notice-location">♡ {T.location}</Text>
      </View>

      <View className="main-content">
        <View className="category-sidebar">
          {categories.map((cat) => (
            <View
              key={cat.id}
              className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon ? (
                <Image className="category-icon-img" src={cat.icon} mode="aspectFit" />
              ) : (
                <Text className="category-grid-icon">▦</Text>
              )}
              <Text className="category-name">{cat.name}</Text>
            </View>
          ))}
        </View>

        <View className="dish-panel">
          <ScrollView className="dish-scroll" scrollY>
            <View className="dish-board">
              {refreshing && dishes.length === 0 ? (
                <View className="no-dishes">
                  <Text className="no-dishes-text">加载中...</Text>
                </View>
              ) : groupedDishes.length === 0 || groupedDishes.every(group => group.dishes.length === 0) ? (
                <View className="no-dishes">
                  <Text className="no-dishes-text">{T.noDishes}</Text>
                </View>
              ) : (
                groupedDishes.map(group => (
                  <View className="dish-group" key={group.category.id}>
                    <View className="group-title-row">
                      <Text className="group-title-mark">!</Text>
                      <Text className="group-title">{group.category.name}</Text>
                      <Text className="group-subtitle">营养均衡，能量满满</Text>
                      <Text className="group-decor">💪</Text>
                    </View>
                    {group.dishes.map((dish) => {
                      const count = getItemCount(dish.id)
                      return (
                        <View key={dish.id} className="dish-card">
                          <Image src={getDishImage(dish)} className="dish-image" mode="aspectFill" />
                          <View className="dish-info">
                            <View className="dish-name-row">
                              <Text className="dish-name">{dish.name}</Text>
                              <Text className="favorite-icon">♡</Text>
                            </View>
                            <Text className="dish-desc">经典搭配，香气满满</Text>
                            <View className="dish-bottom-row">
                              <Text className="dish-price">{dish.price} 爱心币</Text>
                              <View className="dish-actions">
                                {count > 0 && (
                                  <>
                                    <View className="action-btn minus" onClick={() => handleRemoveDish(dish.id)}>
                                      <Text className="action-icon">−</Text>
                                    </View>
                                    <Text className="dish-count">{count}</Text>
                                  </>
                                )}
                                <View className="action-btn plus" onClick={() => handleAddDish(dish)}>
                                  <Text className="action-icon">+</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {totalCount > 0 ? (
        <View className="cart-bar">
          <View className="cart-icon-wrap">
            <Image className="cart-icon" src={orderCarIcon} mode="aspectFit" />
            <Text className="cart-badge">{totalCount}</Text>
          </View>
          <View className="cart-info">
            <Text className="cart-selected">已选商品 {totalCount} 件</Text>
            <Text className="cart-total">{T.total}：{totalPrice.toFixed(0)} 爱心币</Text>
          </View>
          <View className="cart-btn" onClick={goToOrderConfirm}>
            <Text className="cart-btn-text">{T.goOrder}</Text>
          </View>
        </View>
      ) : (
        <View className="cart-empty-tip">
          <Image className="cart-icon" src={orderCarIcon} mode="aspectFit" />
        </View>
      )}

      <CustomTabBar />
    </View>
  )
}

export default OrderScreen
