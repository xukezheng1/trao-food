import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../../utils/api'
import { asNumber, pickList } from '../../../utils/response'
import './index.scss'

const T = {
  title: '我的订单',
  all: '全部',
  pending: '待接单',
  accepted: '制作中',
  completed: '已完成',
  noOrders: '暂无订单',
  orderId: '订单号:',
  foodie: '吃货:',
  total: '合计:',
  accept: '接单',
  complete: '完成制作',
  detail: '查看详情'
}

type OrderStatus = 'pending' | 'accepted' | 'completed' | 'foodie_complete'

interface OrderItem {
  id: number
  order_no: string
  foodie_name: string
  total_price: number
  status: OrderStatus
  created_at: string
  items: Array<{ dish_id: number; name: string; price: number; quantity: number }>
}

const statusMap: Record<OrderStatus, string> = {
  pending: '待接单',
  accepted: '制作中',
  completed: '已完成',
  foodie_complete: '已评价'
}

const statusColors: Record<OrderStatus, string> = {
  pending: '#E6A23C',
  accepted: '#409EFF',
  completed: '#67C23A',
  foodie_complete: '#909399'
}

const ChefOrdersScreen = () => {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadOrders = useCallback(async () => {
    setRefreshing(true)
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const result = await api.order.chefOrders(params)
      const list = pickList(result, ['orders', 'data']).map((item: any) => ({
        id: asNumber(item?.id ?? item?.order_id, 0),
        order_no: String(item?.order_no ?? item?.orderNo ?? `ORD${Date.now()}`),
        foodie_name: String(item?.foodie?.name ?? item?.foodie_name ?? '未知吃货'),
        total_price: asNumber(item?.total_price ?? item?.totalPrice ?? 0),
        status: (item?.status ?? 'pending') as OrderStatus,
        created_at: String(item?.created_at ?? item?.createTime ?? new Date().toLocaleString()),
        items: (item?.items ?? item?.dishes ?? []).map((d: any) => ({
          dish_id: asNumber(d?.dish_id ?? d?.id, 0),
          name: String(d?.name ?? '未知菜品'),
          price: asNumber(d?.price ?? 0),
          quantity: asNumber(d?.quantity ?? 1)
        }))
      }))
      setOrders(list)
    } catch (err) {
      console.error('Load orders error:', err)
      setOrders([])
    } finally {
      setRefreshing(false)
    }
  }, [activeTab])

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

  const handleComplete = async (orderId: number) => {
    try {
      await api.order.chefComplete(orderId)
      Taro.showToast({ title: '订单完成', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
    }
  }

  const goToDetail = (orderId: number) => {
    Taro.navigateTo({ url: `/orderPackage/pages/orderDetail/index?orderId=${orderId}` })
  }

  const tabs = [
    { key: 'all', label: T.all },
    { key: 'pending', label: T.pending },
    { key: 'accepted', label: T.accepted },
    { key: 'completed', label: T.completed }
  ]

  return (
    <View className="chef-orders-container">
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
                  <View className="foodie-info">
                    <View className="foodie-avatar">
                      <Text className="foodie-icon">👤</Text>
                    </View>
                    <View className="foodie-detail">
                      <Text className="foodie-name">{T.foodie} {order.foodie_name}</Text>
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
                      {order.status === 'pending' && (
                        <View className="action-btn primary" onClick={() => handleAccept(order.id)}>
                          <Text className="action-btn-text">{T.accept}</Text>
                        </View>
                      )}
                      {order.status === 'accepted' && (
                        <View className="action-btn primary" onClick={() => handleComplete(order.id)}>
                          <Text className="action-btn-text">{T.complete}</Text>
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
    </View>
  )
}

export default ChefOrdersScreen


