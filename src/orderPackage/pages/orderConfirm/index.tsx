import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { useCart } from '../../../context/CartContext'
import { useUser } from '../../../context/UserContext'
import zaocanIcon from '../../../assets/icon/zaocan.png'
import wucanIcon from '../../../assets/icon/wucan.png'
import wancanIcon from '../../../assets/icon/wancan.png'
import shucaiIcon from '../../../assets/icon/shucai.png'
import huncaiIcon from '../../../assets/icon/huncai.png'
import tianpinIcon from '../../../assets/icon/tianpin.png'
import yinpinIcon from '../../../assets/icon/yinpin.png'
import wangheIcon from '../../../assets/icon/manghe.png'
import xianshiIcon from '../../../assets/icon/xainshi.png'
import './index.scss'

const TEXT = {
  title: '订单确认',
  chef: '大厨',
  shop: '甜蜜小窝厨房',
  arriveTime: '预计30分钟送达',
  dishes: '商品清单',
  dishSub: '经典搭配，营养美味',
  remark: '备注',
  remarkPlaceholder: '点击输入备注内容（口味、偏好等）',
  productAmount: '商品金额',
  coupon: '优惠券',
  noCoupon: '暂无可用优惠券',
  total: '合计',
  submit: '确认下单',
  submitting: '下单中...',
  chooseDish: '请选择菜品',
  insufficientBalance: '余额不足',
  success: '下单成功',
  fail: '下单失败',
  balance: '余额',
  availableBalance: '可用'
}

const categoryIcons: Record<string, string> = {
  zaocan: zaocanIcon,
  wucan: wucanIcon,
  wancan: wancanIcon,
  shucai: shucaiIcon,
  huncai: huncaiIcon,
  tianpin: tianpinIcon,
  yinpin: yinpinIcon,
  wanghe: wangheIcon,
  xianshi: xianshiIcon
}

const formatMoney = (value: number) => Number(value || 0).toFixed(2)

const OrderConfirmScreen = () => {
  const router = useRouter()
  const [chefId, setChefId] = useState(0)
  const [chefName, setChefName] = useState('')
  const [chefAvatar, setChefAvatar] = useState('')
  const { items, totalCount, totalPrice, chefProfile, clearCart } = useCart()
  const { user, fetchBalance } = useUser()
  const [submitting, setSubmitting] = useState(false)
  const [remark, setRemark] = useState('')

  useEffect(() => {
    const params = router.params as Record<string, string>
    const id = Number.parseInt(params?.chefId || '0', 10)
    const finalChefId = Number.isFinite(id) && id > 0 ? id : (chefProfile?.id || 0)
    const finalChefName = chefProfile?.name || params?.chefName || TEXT.chef
    const finalChefAvatar = chefProfile?.avatar || params?.chefAvatar || ''

    setChefId(finalChefId)
    setChefName(finalChefName)
    setChefAvatar(finalChefAvatar)
  }, [router.params, chefProfile])

  const canPay = useMemo(() => Number(user.balance || 0) >= Number(totalPrice || 0), [user.balance, totalPrice])
  const discountAmount = useMemo(() => Math.min(Number(user.balance || 0), Number(totalPrice || 0)), [user.balance, totalPrice])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const getDishCover = (item: { image?: string; category?: string }) => (
    item.image || categoryIcons[item.category || ''] || zaocanIcon
  )

  const handleSubmit = async () => {
    if (submitting) {
      return
    }

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

      await api.order.submit({
        chef_id: chefId,
        items: orderItems,
        remark: remark.trim()
      })
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
      <View className='confirm-header'>
        <View className='back-btn' onClick={handleBack}>
          <Text className='back-icon'>‹</Text>
        </View>
        <View className='header-spacer' />
      </View>

      <ScrollView className='content-scroll' scrollY>
        <View className='hero-space'>
          {chefAvatar && (
            <Image src={chefAvatar} className='chef-avatar-image' mode='aspectFill' />
          )}
        </View>

        <View className='goods-card'>
          <View className='shop-row'>
            <View className='shop-name-wrap'>
              <Text className='row-icon'>⌖</Text>
              <Text className='shop-name'>{chefName || TEXT.shop}</Text>
              <Text className='card-arrow'>{'>'}</Text>
            </View>
            <View className='time-wrap'>
              <Text className='row-icon'>◷</Text>
              <Text className='time-text'>{TEXT.arriveTime}</Text>
            </View>
          </View>

          <View className='card-divider' />

          <View className='section-title-row'>
            <Text className='section-title'>{TEXT.dishes}</Text>
            <Text className='section-count'>共{totalCount}件</Text>
          </View>

          {items.map((item) => (
            <View key={item.dish_id} className='dish-row'>
              <Image className='dish-cover' src={getDishCover(item)} mode='aspectFill' />
              <View className='dish-main'>
                <Text className='dish-name'>{item.name}</Text>
                <Text className='dish-sub'>{TEXT.dishSub}</Text>
              </View>
              <View className='dish-right'>
                <Text className='dish-price'>¥ {formatMoney(item.price)}</Text>
                <Text className='dish-count'>x{item.quantity}</Text>
              </View>
            </View>
          ))}

          <View className='remark-row'>
            <Text className='remark-label'>{TEXT.remark}</Text>
            <Input
              className='remark-input'
              value={remark}
              placeholder={TEXT.remarkPlaceholder}
              placeholderClass='remark-placeholder'
              onInput={(event) => {
                setRemark(String(event.detail.value || ''))
              }}
            />
            <Text className='edit-icon'>✎</Text>
          </View>
        </View>

        <View className='price-card'>
          <View className='price-row'>
            <Text className='price-label'>{TEXT.productAmount}</Text>
            <Text className='price-value'>¥ {formatMoney(totalPrice)}</Text>
          </View>
          <View className='price-row'>
            <Text className='price-label'>{TEXT.coupon}</Text>
            <View className='coupon-value-wrap'>
              <Text className='coupon-value'>{TEXT.noCoupon}</Text>
              <Text className='card-arrow'>{'>'}</Text>
            </View>
          </View>
          <View className='card-divider' />
          <View className='total-row'>
            <Text className='total-label'>{TEXT.total}</Text>
            <Text className='total-price'>¥ {formatMoney(totalPrice)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className='bottom-bar'>
        <View className='balance-info'>
          <Text className='balance-title'>{TEXT.balance}：<Text className='balance-number'>{formatMoney(user.balance || 0)}</Text></Text>
          <Text className='balance-sub'>{TEXT.availableBalance} <Text className='balance-discount'>{formatMoney(discountAmount)}</Text> 爱心币抵扣 <Text className='balance-deduct'>¥{formatMoney(discountAmount)}</Text> <Text className='card-arrow'>{'>'}</Text></Text>
        </View>
        <View className={`submit-btn ${submitting ? 'disabled' : ''}`} onClick={handleSubmit}>
          <Text className='submit-text'>{submitting ? TEXT.submitting : TEXT.submit}</Text>
        </View>
      </View>
    </View>
  )
}

export default OrderConfirmScreen

