import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber } from '../../utils/response'
import './index.scss'

const T = {
  title: '菜品盲盒',
  subtitle: '花 30 元抽道惊喜美食',
  description: '每次抽取 1 份随机菜品',
  drawCount: '剩余抽取次数: ',
  draw: '抽一个',
  confirm: '确定',
  cancel: '取消',
  success: '恭喜获得',
  fail: '抽取失败',
  confirmUse: '确认使用这道菜吗？',
  useSuccess: '已添加到购物车'
}

interface BlindBoxResult {
  dish_id: number
  name: string
  price: number
  image?: string
}

const BlindBoxScreen = () => {
  const [drawCount, setDrawCount] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<BlindBoxResult | null>(null)

  const handleDraw = async () => {
    if (drawCount <= 0 || isDrawing) return

    setIsDrawing(true)
    try {
      const response = await api.order.chefs()
      const chefs = response?.data?.chefs || response?.data || []
      if (chefs.length === 0) {
        Taro.showToast({ title: T.fail, icon: 'none' })
        return
      }

      const randomChef = chefs[Math.floor(Math.random() * chefs.length)]
      const dishesResult = await api.order.dishes(asNumber(randomChef?.id, 0))
      const dishes = dishesResult?.data?.dishes || dishesResult?.data || []
      
      if (dishes.length === 0) {
        Taro.showToast({ title: T.fail, icon: 'none' })
        return
      }

      const randomDish = dishes[Math.floor(Math.random() * dishes.length)]
      
      setResult({
        dish_id: asNumber(randomDish?.id, 0),
        name: String(randomDish?.name ?? '神秘菜品'),
        price: asNumber(randomDish?.price, 30),
        image: randomDish?.image
      })
      setDrawCount(prev => prev - 1)
      setShowResult(true)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    } finally {
      setIsDrawing(false)
    }
  }

  const handleConfirm = () => {
    if (!result) return
    Taro.showToast({ title: T.useSuccess, icon: 'success' })
    setShowResult(false)
    setResult(null)
    Taro.navigateBack()
  }

  return (
    <View className="blind-box-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <View className="main-content">
        <View className="box-wrapper">
          <View className={`box-container ${isDrawing ? 'drawing' : ''}`}>
            {isDrawing ? (
              <View className="drawing-animation">
                <Text className="drawing-icon">🎲</Text>
                <Text className="drawing-text">抽取中...</Text>
              </View>
            ) : (
              <View className="box-content">
                <Text className="box-icon">🎁</Text>
                <Text className="box-title">{T.title}</Text>
                <Text className="box-subtitle">{T.subtitle}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="info-section">
          <Text className="info-text">{T.description}</Text>
          <Text className="count-text">{T.drawCount}{drawCount}</Text>
        </View>

        <View className="price-section">
          <Text className="price-symbol">¥</Text>
          <Text className="price-number">30</Text>
          <Text className="price-label">每次</Text>
        </View>

        <View className={`draw-btn ${drawCount <= 0 ? 'disabled' : ''}`} onClick={handleDraw} disabled={drawCount <= 0}>
          <Text className="draw-btn-text">{T.draw}</Text>
        </View>
      </View>

      {showResult && result && (
        <View className="result-overlay" onClick={() => setShowResult(false)}>
          <View className="result-modal" onClick={(e) => e.stopPropagation()}>
            <View className="result-header">
              <Text className="result-title">{T.success}</Text>
            </View>
            <View className="result-content">
              <View className="result-image-wrapper">
                {result.image ? (
                  <Image src={result.image} className="result-image" />
                ) : (
                  <View className="result-image-placeholder">
                    <Text className="result-icon">🍱</Text>
                  </View>
                )}
              </View>
              <Text className="result-dish-name">{result.name}</Text>
              <Text className="result-dish-price">价值 ¥{result.price}</Text>
            </View>
            <View className="result-actions">
              <View className="result-btn-secondary" onClick={() => setShowResult(false)}>
                <Text className="result-btn-text">{T.cancel}</Text>
              </View>
              <View className="result-btn-primary" onClick={handleConfirm}>
                <Text className="result-btn-text">{T.confirm}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default BlindBoxScreen
