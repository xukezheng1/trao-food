import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber } from '../../utils/response'
import { useUser } from '../../context/UserContext'
import { getProxiedImageUrl } from '../../utils/imageProxy'
import './index.scss'

const T = {
  title: '菜品详情',
  back: '返回',
  category: '分类',
  orderCount: '月售',
  description: '菜品介绍',
  fromChef: '来自',
  orderNow: '去这位大厨点餐',
  backToOrder: '返回点餐',
  backBtn: '返回',
  noImage: '暂无图片',
  loadError: '加载失败',
  notFound: '菜品不存在',
  ingredients: '食材',
  steps: '做菜步骤',
  nutrition: '营养价值',
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水'
}

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
  const [source, setSource] = useState('')

  const hasChef = Number(dish?.chefId || 0) > 0
  const isChef = user?.role === 'chef'

  useEffect(() => {
    const params = router.params as Record<string, any>
    const sourceParam = params?.source || ''
    const dishId = parseInt(params?.id || '0')
    
    setSource(sourceParam)

    // 从ID加载菜品详情
    if (dishId) {
      loadDishDetail(dishId)
    } else {
      setLoading(false)
    }
  }, [router.params])

  const loadDishDetail = async (id: number) => {
    setLoading(true)
    try {
      // 使用 recipe.detail 接口获取菜品详情
      const result = await api.recipe.detail(id)
      const data = result?.data || {}

      // 解析食材
      const ingredients: IngredientItem[] = Array.isArray(data?.ingredients)
        ? data.ingredients.map((item: any) => ({
            name: String(item?.name ?? ''),
            amount: String(item?.amount ?? '')
          }))
        : []

      // 解析步骤
      const steps: StepItem[] = Array.isArray(data?.steps)
        ? data.steps.map((item: any) => ({
            text: String(item?.text ?? ''),
            image: item?.image
          }))
        : []

      // 解析营养
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
        steps: steps.map(step => ({
          ...step,
          image: getProxiedImageUrl(step.image)
        })),
        nutrition
      })
    } catch (err) {
      console.error('Load dish detail error:', err)
      Taro.showToast({ title: T.loadError, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleGoToChef = () => {
    if (dish?.chefId) {
      Taro.navigateTo({
        url: `/pages/chefDetail/index?chefId=${dish.chefId}&chefName=${encodeURIComponent(dish.chefName || '大厨')}`
      })
    }
  }

  const handleEdit = () => {
    if (dish) {
      Taro.navigateTo({ url: `/pages/homeRecipe/index?id=${dish.id}&mode=edit` })
    }
  }

  if (loading) {
    return (
      <View className="loading-container">
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  if (!dish) {
    return (
      <View className="empty-container">
        <Text className="empty-text">{T.notFound}</Text>
      </View>
    )
  }

  return (
    <View className="dish-detail-container">
      {/* Header */}
      <View className="header">
        <View className="back-btn" onClick={handleBack}>
          <View className="back-btn-bg">
            <Text className="back-icon">←</Text>
          </View>
        </View>
        <Text className="header-title">{T.title}</Text>
        <View className="header-placeholder" />
      </View>

      <ScrollView className="content" scrollY>
        {/* 图片区域 */}
        <View className="image-wrap">
          {dish.image ? (
            <Image src={dish.image} className="image" mode="aspectFill" />
          ) : (
            <View className="image-fallback">
              <Text className="fallback-icon">🍽️</Text>
            </View>
          )}
        </View>

        {/* 信息卡片 */}
        <View className="info-card">
          <View className="name-row">
            <Text className="name">{dish.name}</Text>
            {isChef && (
              <View className="edit-btn" onClick={handleEdit}>
                <Text className="edit-btn-text">编辑</Text>
              </View>
            )}
          </View>
          
          <View className="meta-row">
            <View className="meta-tag">
              <Text className="meta-text">{dish.category}</Text>
            </View>
            {!!dish.order_count && (
              <View className="meta-tag-light">
                <Text className="meta-text-light">{T.orderCount} {dish.order_count}</Text>
              </View>
            )}
          </View>

          <Text className="price">¥{Number(dish.price || 0).toFixed(2)}</Text>
          <Text className="section-title">{T.description}</Text>
          <Text className="description">{dish.description || '未知菜品描述。'}</Text>

          {!!dish.chefName && (
            <Text className="chef-text">{T.fromChef}：{dish.chefName}</Text>
          )}
        </View>

        {/* 食材 */}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <View className="section-card">
            <Text className="section-title">{T.ingredients}</Text>
            <View className="ingredients-list">
              {dish.ingredients.map((ing, index) => (
                <View key={`ing-${index}`} className="ingredient-item">
                  <Text className="ingredient-name">{ing.name}</Text>
                  <Text className="ingredient-amount">{ing.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 营养价值 */}
        {dish.nutrition && (dish.nutrition.calories || dish.nutrition.protein || dish.nutrition.fat || dish.nutrition.carbs) && (
          <View className="section-card">
            <Text className="section-title">{T.nutrition}</Text>
            <View className="nutrition-grid">
              {dish.nutrition.calories && (
                <View className="nutrition-item">
                  <Text className="nutrition-label">{T.calories}</Text>
                  <Text className="nutrition-value">{dish.nutrition.calories}</Text>
                </View>
              )}
              {dish.nutrition.protein && (
                <View className="nutrition-item">
                  <Text className="nutrition-label">{T.protein}</Text>
                  <Text className="nutrition-value">{dish.nutrition.protein}</Text>
                </View>
              )}
              {dish.nutrition.fat && (
                <View className="nutrition-item">
                  <Text className="nutrition-label">{T.fat}</Text>
                  <Text className="nutrition-value">{dish.nutrition.fat}</Text>
                </View>
              )}
              {dish.nutrition.carbs && (
                <View className="nutrition-item">
                  <Text className="nutrition-label">{T.carbs}</Text>
                  <Text className="nutrition-value">{dish.nutrition.carbs}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 做菜步骤 */}
        {dish.steps && dish.steps.length > 0 && (
          <View className="section-card">
            <Text className="section-title">{T.steps}</Text>
            <View className="steps-list">
              {dish.steps.map((step, index) => (
                <View key={`step-${index}`} className="step-item">
                  <View className="step-number">
                    <Text className="step-number-text">{index + 1}</Text>
                  </View>
                  <View className="step-content">
                    {step.image && (
                      <Image src={step.image} className="step-image" mode="aspectFill" />
                    )}
                    <Text className="step-text">{step.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="footer">
        {source === 'chef_detail' ? (
          <View className="secondary-btn" onClick={handleBack}>
            <Text className="secondary-btn-text">{T.backToOrder}</Text>
          </View>
        ) : hasChef ? (
          <View className="primary-btn" onClick={handleGoToChef}>
            <Text className="primary-btn-text">{T.orderNow}</Text>
          </View>
        ) : (
          <View className="secondary-btn" onClick={handleBack}>
            <Text className="secondary-btn-text">{T.backBtn}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default RecipeDetailScreen
