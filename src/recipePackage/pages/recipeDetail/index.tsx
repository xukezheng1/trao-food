import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { asNumber } from '../../../utils/response'
import { useUser } from '../../../context/UserContext'
import { getProxiedImageUrl } from '../../../utils/imageProxy'
import zaocanIcon from '../../../assets/icon/zaocan.png'
import './index.scss'

interface IngredientItem {
  name: string
  amount: string
}

interface StepItem {
  text: string
  image?: string
}

interface NutritionData {
  calories?: string
  protein?: string
  fat?: string
  carbs?: string
}

interface DishDetail {
  id: number
  name: string
  price: number
  image?: string
  description?: string
  category?: string
  order_count?: number
  chefId?: number
  chefName?: string
  ingredients?: IngredientItem[]
  steps?: StepItem[]
  nutrition?: NutritionData
}

const RecipeDetailScreen = () => {
  const router = useRouter()
  const { user } = useUser()
  const [dish, setDish] = useState<DishDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const isChef = user?.role === 'chef'

  useEffect(() => {
    const params = router.params as Record<string, any>
    const dishId = parseInt(params?.id || '0')
    if (dishId) {
      loadDishDetail(dishId)
    } else {
      setLoading(false)
    }
  }, [router.params])

  const loadDishDetail = async (id: number) => {
    setLoading(true)
    try {
      const result = await api.recipe.detail(id)
      const data = result?.data || {}
      const ingredients: IngredientItem[] = Array.isArray(data?.ingredients)
        ? data.ingredients.map((item: any) => ({
            name: String(item?.name ?? ''),
            amount: String(item?.amount ?? '')
          }))
        : []
      const steps: StepItem[] = Array.isArray(data?.steps)
        ? data.steps.map((item: any) => ({
            text: String(item?.text ?? ''),
            image: getProxiedImageUrl(item?.image)
          }))
        : []
      const nutrition: NutritionData = data?.nutrition && typeof data.nutrition === 'object'
        ? {
            calories: String(data.nutrition?.calories ?? ''),
            protein: String(data.nutrition?.protein ?? ''),
            fat: String(data.nutrition?.fat ?? ''),
            carbs: String(data.nutrition?.carbs ?? '')
          }
        : {}

      setDish({
        id: asNumber(data?.id, 0),
        name: String(data?.name ?? '未命名菜品'),
        price: asNumber(data?.price, 0),
        image: getProxiedImageUrl(data?.image),
        description: String(data?.description ?? ''),
        category: String(data?.category ?? '其他'),
        order_count: asNumber(data?.order_count, 0),
        chefId: asNumber(data?.user_id, 0),
        chefName: String(data?.chef_name ?? data?.nickname ?? ''),
        ingredients,
        steps,
        nutrition
      })
    } catch (err) {
      console.error('Load dish detail error:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className="state-page">
        <Text className="state-text">加载中...</Text>
      </View>
    )
  }

  if (!dish) {
    return (
      <View className="state-page">
        <Text className="state-text">菜品不存在</Text>
      </View>
    )
  }

  const hasNutrition = !!(dish.nutrition?.calories || dish.nutrition?.protein || dish.nutrition?.fat || dish.nutrition?.carbs)

  return (
    <View className="detail-page">
      <View className="detail-header">
        <View className="round-btn" onClick={() => Taro.navigateBack()}>
          <Text className="round-btn-text">‹</Text>
        </View>
        <Text className="detail-title">菜品详情</Text>
        <View className="header-action">
          {isChef && <Text className="edit-link" onClick={handleEdit}>编辑</Text>}
        </View>
      </View>

      <ScrollView className="detail-scroll" scrollY>
        <View className="detail-hero" />

        <View className="dish-cover-card">
          <Image className="dish-cover" src={dish.image || zaocanIcon} mode="aspectFill" />
        </View>

        <View className="info-card">
          <View className="title-row">
            <View className="title-main">
              <Text className="dish-name">{dish.name}</Text>
              <Text className="dish-desc">{dish.description || '经典搭配，营养美味'}</Text>
            </View>
            <Text className="dish-price">💗 {dish.price} 爱心币</Text>
          </View>

          <View className="meta-row">
            <Text className="meta-tag">{dish.category}</Text>
            {!!dish.order_count && <Text className="meta-tag">月售 {dish.order_count}</Text>}
            {!!dish.chefName && <Text className="meta-tag">来自 {dish.chefName}</Text>}
          </View>
        </View>

        {dish.ingredients && dish.ingredients.length > 0 && (
          <View className="section-card">
            <Text className="section-title">食材清单</Text>
            <View className="ingredient-list">
              {dish.ingredients.map((ing, index) => (
                <View key={`ing-${index}`} className="ingredient-item">
                  <Text className="ingredient-name">{ing.name}</Text>
                  <Text className="ingredient-amount">{ing.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasNutrition && (
          <View className="section-card">
            <Text className="section-title">营养价值</Text>
            <View className="nutrition-grid">
              {!!dish.nutrition?.calories && <View className="nutrition-item"><Text>热量</Text><Text>{dish.nutrition.calories}</Text></View>}
              {!!dish.nutrition?.protein && <View className="nutrition-item"><Text>蛋白质</Text><Text>{dish.nutrition.protein}</Text></View>}
              {!!dish.nutrition?.fat && <View className="nutrition-item"><Text>脂肪</Text><Text>{dish.nutrition.fat}</Text></View>}
              {!!dish.nutrition?.carbs && <View className="nutrition-item"><Text>碳水</Text><Text>{dish.nutrition.carbs}</Text></View>}
            </View>
          </View>
        )}

        {dish.steps && dish.steps.length > 0 && (
          <View className="section-card">
            <Text className="section-title">制作步骤</Text>
            {dish.steps.map((step, index) => (
              <View key={`step-${index}`} className="step-item">
                <View className="step-index"><Text>{index + 1}</Text></View>
                <View className="step-body">
                  {step.image && <Image className="step-image" src={step.image} mode="aspectFill" />}
                  <Text className="step-text">{step.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default RecipeDetailScreen
