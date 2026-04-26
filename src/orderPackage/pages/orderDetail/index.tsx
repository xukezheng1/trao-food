import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { asNumber, pickList } from '../../../utils/response'
import './index.scss'

const T = {
  title: '订单详情',
  orderId: '订单号',
  status: '状态',
  createTime: '下单时间',
  chef: '大厨',
  dishes: '菜品',
  total: '合计',
  accept: '接单',
  complete: '完成制作',
  rate: '去评价',
  statusPending: '待接单',
  statusAccepted: '制作中',
  statusCompleted: '已完成',
  statusFoodieComplete: '已评价'
}

type OrderStatus = 'pending' | 'accepted' | 'completed' | 'foodie_complete'

interface OrderDetail {
  id: number
  order_no: string
  status: OrderStatus
  created_at: string
  chef_name: string
  chef_id: number
  chef_avatar?: string
  foodie_name?: string
  foodie_avatar?: string
  total_price: number
  items: Array<{ dish_id: number; name: string; price: number; quantity: number }>
}

const statusMap: Record<OrderStatus, string> = {
  pending: T.statusPending,
  accepted: T.statusAccepted,
  completed: T.statusCompleted,
  foodie_complete: T.statusFoodieComplete
}

const statusColors: Record<OrderStatus, string> = {
  pending: '#E6A23C',
  accepted: '#409EFF',
  completed: '#67C23A',
  foodie_complete: '#909399'
}

const OrderDetailScreen = () => {
  const router = useRouter()
  const [orderId, setOrderId] = useState(0)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = router.params as Record<string, string>
    setOrderId(parseInt(params?.orderId || '0'))
  }, [router.params])

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!orderId) return
      setLoading(true)
      try {
        const result = await api.order.detail(orderId)
        const data = result?.data || {}
        console.log('Order detail data:', data)

        // 处理API返回的数据结构
        const chefInfo = data?.chef || {}
        const foodieInfo = data?.foodie || {}

        setOrder({
          id: asNumber(data?.id, 0),
          order_no: String(data?.order_no ?? `ORD${data?.id ?? ''}`),
          status: (data?.status ?? 'pending') as OrderStatus,
          created_at: String(data?.createdAt ?? data?.created_at ?? ''),
          chef_name: String(chefInfo?.nickname ?? chefInfo?.username ?? '未知大厨'),
          chef_id: asNumber(chefInfo?.id ?? data?.chefId, 0),
          chef_avatar: chefInfo?.avatar,
          foodie_name: String(foodieInfo?.nickname ?? foodieInfo?.username ?? '未知用户'),
          foodie_avatar: foodieInfo?.avatar,
          total_price: asNumber(data?.totalAmount ?? data?.total_price ?? 0),
          items: (data?.items ?? []).map((d: any) => ({
            dish_id: asNumber(d?.dish?.id ?? d?.dishId ?? 0),
            name: String(d?.dish?.name ?? '未知菜品'),
            price: asNumber(d?.price ?? d?.dish?.price ?? 0),
            quantity: asNumber(d?.quantity ?? 1)
          }))
        })
      } catch (err) {
        console.error('Load order detail error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadOrderDetail()
  }, [orderId])

  const handleAccept = async () => {
    try {
      await api.order.accept(orderId)
      Taro.showToast({ title: '接单成功', icon: 'success' })
      setOrder(prev => prev ? { ...prev, status: 'accepted' } : null)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '接单失败', icon: 'none' })
    }
  }

  const handleComplete = async () => {
    try {
      await api.order.chefComplete(orderId)
      Taro.showToast({ title: '完成制作', icon: 'success' })
      setOrder(prev => prev ? { ...prev, status: 'completed' } : null)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
    }
  }

  const handleRate = async () => {
    Taro.showModal({
      title: '评价订单',
      editable: true,
      placeholderText: '请输入评价（1-5星）',
      success: async (res) => {
        if (res.confirm && res.content) {
          const rating = Math.min(5, Math.max(1, parseInt(res.content) || 5))
          try {
            await api.order.foodieComplete(orderId, { rating })
            Taro.showToast({ title: '评价成功', icon: 'success' })
            setOrder(prev => prev ? { ...prev, status: 'foodie_complete' } : null)
          } catch (err: any) {
            Taro.showToast({ title: err?.message || '评价失败', icon: 'none' })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className="loading-container">
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  if (!order) {
    return (
      <View className="empty-container">
        <Text className="empty-text">订单不存在</Text>
      </View>
    )
  }

  return (
    <View className="order-detail-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="order-info-card">
          <View className="order-info-row">
            <Text className="info-label">{T.orderId}</Text>
            <Text className="info-value">{order.order_no}</Text>
          </View>
          <View className="order-info-row">
            <Text className="info-label">{T.status}</Text>
            <View className="status-badge" style={{ backgroundColor: statusColors[order.status] }}>
              <Text className="status-text">{statusMap[order.status]}</Text>
            </View>
          </View>
          <View className="order-info-row">
            <Text className="info-label">{T.createTime}</Text>
            <Text className="info-value">{order.created_at}</Text>
          </View>
        </View>

        <View className="chef-card">
          <Text className="card-title">{T.chef}</Text>
          <View className="chef-content">
            <View className="chef-avatar">
              {order.chef_avatar ? (
                <Image src={order.chef_avatar} className="chef-avatar-img" mode="aspectFill" />
              ) : (
                <Text className="chef-icon">👨🍳</Text>
              )}
            </View>
            <View className="chef-info">
              <Text className="chef-name">{order.chef_name}</Text>
              {order.foodie_name && (
                <Text className="foodie-name">食客: {order.foodie_name}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="dishes-card">
          <Text className="card-title">{T.dishes}</Text>
          <View className="dishes-list">
            {order.items.map((item) => (
              <View key={item.dish_id} className="dish-row">
                <View className="dish-info">
                  <Text className="dish-name">{item.name}</Text>
                  <Text className="dish-qty">x{item.quantity}</Text>
                </View>
                <Text className="dish-price">¥{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
          <View className="total-row">
            <Text className="total-label">{T.total}</Text>
            <Text className="total-price">¥{order.total_price}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="bottom-bar">
        {order.status === 'pending' && (
          <View className="action-btn primary" onClick={handleAccept}>
            <Text className="action-text">{T.accept}</Text>
          </View>
        )}
        {order.status === 'accepted' && (
          <View className="action-btn primary" onClick={handleComplete}>
            <Text className="action-text">{T.complete}</Text>
          </View>
        )}
        {order.status === 'completed' && (
          <View className="action-btn primary" onClick={handleRate}>
            <Text className="action-text">{T.rate}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default OrderDetailScreen


