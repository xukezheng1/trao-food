import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import './index.scss'

const T = {
  title: '组单',
  noDishes: '暂无菜品',
  addDish: '添加菜品',
  total: '合计',
  submit: '提交订单'
}

interface Dish {
  id: number
  name: string
  price: number
  description?: string
  image?: string
}

const OrderListScreen = () => {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})

  const loadDishes = useCallback(async () => {
    try {
      const result = await api.order.dishes(1)
      const list = pickList(result, ['dishes', 'data']).map((item: any) => ({
        id: asNumber(item?.id, 0),
        name: String(item?.name ?? '未知菜品'),
        price: asNumber(item?.price, 0),
        description: item?.description,
        image: item?.image
      }))
      setDishes(list)
    } catch (err) {
      console.error('Load dishes error:', err)
      setDishes([])
    }
  }, [])

  useEffect(() => {
    loadDishes()
  }, [loadDishes])

  const handleAdd = (dishId: number) => {
    setCart(prev => ({ ...prev, [dishId]: (prev[dishId] || 0) + 1 }))
  }

  const handleDecrease = (dishId: number) => {
    const current = cart[dishId] || 0
    if (current > 1) {
      setCart(prev => ({ ...prev, [dishId]: prev[dishId] - 1 }))
    } else {
      setCart(prev => {
        const newCart = { ...prev }
        delete newCart[dishId]
        return newCart
      })
    }
  }

  const totalPrice = Object.entries(cart).reduce((sum, [dishId, quantity]) => {
    const dish = dishes.find(d => d.id === Number(dishId))
    return sum + (dish?.price || 0) * (quantity || 0)
  }, 0)

  const totalCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  const handleSubmit = () => {
    if (totalCount === 0) {
      Taro.showToast({ title: '请先添加菜品', icon: 'none' })
      return
    }
    Taro.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => {
      Taro.navigateBack()
    }, 1500)
  }

  return (
    <View className="order-list-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        {dishes.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🍽️</Text>
            <Text className="empty-text">{T.noDishes}</Text>
          </View>
        ) : (
          <View className="dishes-grid">
            {dishes.map((dish) => (
              <View key={dish.id} className="dish-card">
                <View className="dish-image-wrapper">
                  {dish.image ? (
                    <img src={dish.image} className="dish-image" />
                  ) : (
                    <View className="dish-image-placeholder">
                      <Text className="dish-icon">🍱</Text>
                    </View>
                  )}
                </View>
                <Text className="dish-name">{dish.name}</Text>
                {dish.description && (
                  <Text className="dish-desc">{dish.description}</Text>
                )}
                <View className="dish-bottom">
                  <Text className="dish-price">¥{dish.price}</Text>
                  <View className="quantity-control">
                    {(cart[dish.id] || 0) > 0 && (
                      <>
                        <View className="qty-btn" onClick={() => handleDecrease(dish.id)}>
                          <Text className="qty-icon">-</Text>
                        </View>
                        <Text className="qty-num">{cart[dish.id]}</Text>
                      </>
                    )}
                    <View className="qty-btn add" onClick={() => handleAdd(dish.id)}>
                      <Text className="qty-icon">+</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {totalCount > 0 && (
        <View className="bottom-bar">
          <View className="total-info">
            <Text className="total-label">{T.total}</Text>
            <Text className="total-price">¥{totalPrice}</Text>
          </View>
          <View className="submit-btn" onClick={handleSubmit}>
            <Text className="submit-text">{T.submit}</Text>
            <Text className="submit-count">({totalCount})</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderListScreen
