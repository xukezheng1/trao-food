import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import api from '../../../utils/api'
import { asNumber, pickList } from '../../../utils/response'
import './index.scss'

const T = {
  title: '账单统计',
  totalIncome: '总收入',
  totalOrders: '订单总数',
  avgOrder: '平均订单金额',
  topDish: '热销菜品',
  noData: '暂无数据'
}

interface StatsData {
  total_income: number
  order_count: number
  avg_order_amount: number
  top_dishes: Array<{ name: string; count: number; revenue: number }>
}

const BillStatsScreen = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const result = await api.expense.stats()
        const data = result?.data || {}
        setStats({
          total_income: asNumber(data?.total_income ?? data?.totalIncome, 0),
          order_count: asNumber(data?.order_count ?? data?.orderCount, 0),
          avg_order_amount: asNumber(data?.avg_order_amount ?? data?.avgOrderAmount, 0),
          top_dishes: (data?.top_dishes ?? data?.topDishes ?? []).map((d: any) => ({
            name: String(d?.name ?? '未知菜品'),
            count: asNumber(d?.count ?? 0),
            revenue: asNumber(d?.revenue ?? 0)
          }))
        })
      } catch (err) {
        console.error('Load stats error:', err)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <View className="loading-container">
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="bill-stats-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        {!stats ? (
          <View className="empty-state">
            <Text className="empty-icon">📊</Text>
            <Text className="empty-text">{T.noData}</Text>
          </View>
        ) : (
          <>
            <View className="stats-grid">
              <View className="stat-card">
                <Text className="stat-icon">💰</Text>
                <Text className="stat-value">¥{stats.total_income.toFixed(2)}</Text>
                <Text className="stat-label">{T.totalIncome}</Text>
              </View>
              <View className="stat-card">
                <Text className="stat-icon">📋</Text>
                <Text className="stat-value">{stats.order_count}</Text>
                <Text className="stat-label">{T.totalOrders}</Text>
              </View>
              <View className="stat-card">
                <Text className="stat-icon">📈</Text>
                <Text className="stat-value">¥{stats.avg_order_amount.toFixed(2)}</Text>
                <Text className="stat-label">{T.avgOrder}</Text>
              </View>
            </View>

            <View className="section">
              <Text className="section-title">{T.topDish}</Text>
              {stats.top_dishes.length === 0 ? (
                <View className="empty-section">
                  <Text className="empty-text">暂无热销菜品</Text>
                </View>
              ) : (
                <View className="top-dishes-list">
                  {stats.top_dishes.map((dish, index) => (
                    <View key={index} className="top-dish-item">
                      <View className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                        <Text className="rank-num">{index + 1}</Text>
                      </View>
                      <View className="dish-info">
                        <Text className="dish-name">{dish.name}</Text>
                        <Text className="dish-detail">销量: {dish.count} | 收入: ¥{dish.revenue}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

export default BillStatsScreen


