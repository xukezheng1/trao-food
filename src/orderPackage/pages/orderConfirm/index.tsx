import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { useCart } from '../../../context/CartContext'
import { useUser } from '../../../context/UserContext'
import './index.scss'

const TEXT = {
  title: '确认订单',
  chef: '大厨',
  dishes: '菜品',
  total: '合计',
  submit: '提交订单',
  submitting: '提交中...',
  chooseDish: '请选择菜品',
  insufficientBalance: '余额不足',
  success: '下单成功',
  fail: '下单失败',
  availableBalance: '可用余额'
}

const OrderConfirmScreen = () => {
  const router = useRouter()
  const [chefId, setChefId] = useState(0)
  const [chefName, setChefName] = useState('')
  const [chefAvatar, setChefAvatar] = useState('')
  const { items, totalPrice, chefProfile, clearCart } = useCart()
  const { user, fetchBalance } = useUser()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = router.params as Record<string, string>
    const id = Number.parseInt(params?.chefId || '0', 10)
    const finalChefId = Number.isFinite(id) ? id : (chefProfile?.id || 0)
    const finalChefName = chefProfile?.name || params?.chefName || TEXT.chef
    const finalChefAvatar = chefProfile?.avatar || params?.chefAvatar || ''

    setChefId(finalChefId)
    setChefName(finalChefName)
    setChefAvatar(finalChefAvatar)
  }, [router.params, chefProfile])

  const canPay = useMemo(() => Number(user.balance || 0) >= Number(totalPrice || 0), [user.balance, totalPrice])

  const handleSubmit = async () => {
    if (!chefId || items.length === 0) {
      Taro.showToast({ title: TEXT.chooseDish, icon: 'none' })
      return
    }

    if (!canPay) {
      Taro.showToast({ title: TEXT.insufficientBalance, icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const orderItems = items.map((item) => ({
        dish_id: item.dish_id,
        quantity: item.quantity
      }))

      await api.order.submit({ chef_id: chefId, items: orderItems })
      Taro.showToast({ title: TEXT.success, icon: 'success' })
      clearCart()
      fetchBalance()
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/orders/index' })
      }, 1200)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || TEXT.fail, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='order-confirm-page'>
      <View className='page-title-wrap'>
        <Text className='page-title'>{TEXT.title}</Text>
      </View>

      <ScrollView className='content-scroll' scrollY>
        <View className='chef-card'>
          <View className='chef-avatar'>
            {chefAvatar ? (
              <Image src={chefAvatar} className='chef-avatar-image' mode='aspectFill' />
            ) : (
              <Text>👨‍🍳</Text>
            )}
          </View>
          <View className='chef-info'>
            <Text className='chef-name'>{chefName || TEXT.chef}</Text>
            <Text className='chef-contact'>@{chefName || TEXT.chef}</Text>
          </View>
          <Text className='card-arrow'>{'>'}</Text>
        </View>

        <View className='dishes-card'>
          <View className='section-title'>
            <Text className='section-dot'>●</Text>
            <Text>{TEXT.dishes}</Text>
          </View>

          {items.map((item) => (
            <View key={item.dish_id} className='dish-row'>
              <View className='dish-cover'>
                <Text className='dish-cover-icon'>🍜</Text>
              </View>
              <View className='dish-main'>
                <Text className='dish-name'>{item.name}</Text>
                <Text className='dish-sub'>合计:</Text>
              </View>
              <View className='dish-right'>
                <Text className='dish-price'>¥{item.price}</Text>
                <Text className='dish-count'>x{item.quantity}</Text>
              </View>
            </View>
          ))}

          <View className='summary-row'>
            <Text className='summary-label'>{TEXT.total}:</Text>
            <Text className='summary-price'>¥{totalPrice}</Text>
          </View>

          <View className='balance-row'>
            <Text className='balance-label'>{TEXT.availableBalance}:</Text>
            <Text className={`balance-value ${canPay ? 'ok' : 'low'}`}>¥{user.balance}</Text>
          </View>
        </View>
      </ScrollView>

      <View className='bottom-bar'>
        <View className='bottom-left'>
          <View className='pig-icon'>🐷</View>
          <Text className='bottom-price'>¥{totalPrice}</Text>
        </View>

        <View className={`submit-btn ${submitting ? 'disabled' : ''}`} onClick={handleSubmit}>
          <Text className='submit-text'>{submitting ? TEXT.submitting : TEXT.submit}</Text>
          <Text className='submit-arrow'>{'>'}</Text>
        </View>
      </View>
    </View>
  )
}

export default OrderConfirmScreen


