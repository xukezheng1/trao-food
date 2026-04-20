import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useUser } from '../../context/UserContext'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  title: '订单',
  all: '全部',
  pending: '待接单',
  accepted: '制作中',
  completed: '已完成',
  noOrders: '暂无订单',
  orderId: '订单号:',
  chef: '大厨:',
  total: '合计:',
  statusPending: '待接单',
  statusAccepted: '制作中',
  statusCompleted: '已完成',
  statusFoodieComplete: '已评价',
  accept: '接单',
  complete: '完成制作',
  rate: '去评价',
  detail: '查看详情'
}

type OrderStatus = 'pending' | 'accepted' | 'completed' | 'foodie_complete'

interface OrderItem {
  id: number
  order_no: string
  chef_name: string
  chef_id: number
  chef_avatar?: string
  total_price: number
  status: OrderStatus
  created_at: string
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

const toOrder = (item: any, isChefView: boolean): OrderItem => {
  // 处理API返回的数据结构
  // items中的每个元素有dish对象
  const orderItems = (item?.items ?? []).map((d: any) => ({
    dish_id: asNumber(d?.dish?.id ?? d?.dish_id ?? 0),
    name: String(d?.dish_name ?? d?.dish?.name ?? '未知菜品'),
    price: asNumber(d?.price ?? d?.dish?.price ?? 0),
    quantity: asNumber(d?.quantity ?? 1)
  }))

  // 根据视角确定显示谁的信息
  // 大厨视角：显示食客信息（foodie字段）
  // 吃货视角：显示大厨信息（chef字段）
  const personInfo = isChefView 
    ? (item?.foodie || {})
    : (item?.chef || { name: item?.chef_name, avatar: item?.chef_avatar })

  return {
    id: asNumber(item?.id, 0),
    order_no: String(item?.order_no ?? `ORD${item?.id ?? Date.now()}`),
    chef_name: String(personInfo?.nickname ?? personInfo?.username ?? personInfo?.name ?? '未知用户'),
    chef_id: asNumber(personInfo?.id, 0),
    chef_avatar: personInfo?.avatar,
    total_price: asNumber(item?.total_amount ?? item?.total_price ?? 0),
    status: (item?.status ?? 'pending') as OrderStatus,
    created_at: String(item?.created_at ?? new Date().toLocaleString()),
    items: orderItems
  }
}

const OrdersTabScreen = () => {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useUser()
  const isChef = user.role === 'chef'

  const loadOrders = useCallback(async () => {
    setRefreshing(true)
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const result = isChef
        ? await api.order.chefOrders(params)
        : await api.order.myOrders(params)
      const list = pickList(result, ['orders', 'data']).map((item: any) => toOrder(item, isChef))
      setOrders(list)
    } catch (err) {
      console.error('Load orders error:', err)
      setOrders([])
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, isChef])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleAccept = async (orderId: number) => {
    try {
      await api.order.accept(orderId)
      Taro.showToast({ title: '接单成功', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '接单失败', icon: 'none' })
    }
  }

  const handleChefComplete = async (orderId: number) => {
    try {
      await api.order.chefComplete(orderId)
      Taro.showToast({ title: '订单完成', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
    }
  }

  const handleFoodieComplete = async (orderId: number) => {
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
            loadOrders()
          } catch (err: any) {
            Taro.showToast({ title: err?.message || '评价失败', icon: 'none' })
          }
        }
      }
    })
  }

  const goToDetail = (orderId: number) => {
    Taro.navigateTo({ url: `/pages/orderDetail/index?orderId=${orderId}` })
  }

  const tabs = [
    { key: 'all', label: T.all },
    { key: 'pending', label: T.pending },
    { key: 'accepted', label: T.accepted },
    { key: 'completed', label: T.completed }
  ]

  return (
    <View className="orders-container">
      <View className="tabs-bar">
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={`tab-text ${activeTab === tab.key ? 'active' : ''}`}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className="scroll-content" scrollY>
        {orders.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📋</Text>
            <Text className="empty-text">{T.noOrders}</Text>
          </View>
        ) : (
          <View className="orders-list">
            {orders.map((order) => (
              <View key={order.id} className="order-card">
                <View className="order-header">
                  <View className="order-info">
                    <Text className="order-id">{T.orderId} {order.order_no}</Text>
                    <Text className="order-time">{order.created_at}</Text>
                  </View>
                  <View className="status-badge" style={{ backgroundColor: statusColors[order.status] }}>
                    <Text className="status-text">{statusMap[order.status]}</Text>
                  </View>
                </View>

                <View className="order-content">
                  <View className="chef-info">
                    <View className="chef-avatar">
                      {order.chef_avatar ? (
                        <Image src={order.chef_avatar} className="chef-avatar-img" mode="aspectFill" />
                      ) : (
                        <Text className="chef-icon">👨🍳</Text>
                      )}
                    </View>
                    <View className="chef-detail">
                      <Text className="chef-name">{isChef ? '食客' : '大厨'}: {order.chef_name}</Text>
                    </View>
                  </View>

                  <View className="dishes-list">
                    {order.items.slice(0, 3).map((item) => (
                      <View key={item.dish_id} className="dish-item">
                        <Text className="dish-name">{item.name}</Text>
                        <Text className="dish-price">¥{item.price}</Text>
                        <Text className="dish-qty">x{item.quantity}</Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text className="more-dishes">...等{order.items.length}道菜</Text>
                    )}
                  </View>

                  <View className="order-footer">
                    <Text className="total-price">{T.total} ¥{order.total_price}</Text>
                    <View className="order-actions">
                      {isChef && order.status === 'pending' && (
                        <View className="action-btn primary" onClick={() => handleAccept(order.id)}>
                          <Text className="action-btn-text">{T.accept}</Text>
                        </View>
                      )}
                      {isChef && order.status === 'accepted' && (
                        <View className="action-btn primary" onClick={() => handleChefComplete(order.id)}>
                          <Text className="action-btn-text">{T.complete}</Text>
                        </View>
                      )}
                      {!isChef && order.status === 'completed' && (
                        <View className="action-btn primary" onClick={() => handleFoodieComplete(order.id)}>
                          <Text className="action-btn-text">{T.rate}</Text>
                        </View>
                      )}
                      <View className="action-btn secondary" onClick={() => goToDetail(order.id)}>
                        <Text className="action-btn-text">{T.detail}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CustomTabBar />
    </View>
  )
}

export default OrdersTabScreen
