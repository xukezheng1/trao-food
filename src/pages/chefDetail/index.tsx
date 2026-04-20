import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useCart } from '../../context/CartContext'
import './index.scss'

const T = {
  search: '搜索',
  hot: '热销',
  add: '+',
  minus: '−',
  order: '去结算',
  noDishes: '暂无菜品',
  confirmChefChange: '当前购物车中有其他大厨的菜品，确定替换吗？',
  dishDetail: '菜品详情',
  close: '关闭',
  addToCart: '加入购物车',
  cartTitle: '购物车'
}

interface Dish {
  id: number
  name: string
  price: number
  description?: string
  image?: string
  category?: string
  order_count?: number
  ingredients?: string
  nutrition?: {
    calories?: string
    protein?: string
    fat?: string
    carbs?: string
  }
}

interface Category {
  id: number
  name: string
  dishes: Dish[]
}

const toDish = (item: any): Dish => ({
  id: asNumber(item?.id, 0),
  name: String(item?.name ?? '未知菜品'),
  price: asNumber(item?.price, 0),
  description: item?.description,
  image: item?.image,
  category: item?.category,
  order_count: asNumber(item?.order_count ?? item?.orderCount, 0),
  ingredients: item?.ingredients,
  nutrition: item?.nutrition
})

const ChefDetailScreen = () => {
  const router = useRouter()
  const [chefId, setChefId] = useState(0)
  const [chefName, setChefName] = useState('')
  const [chefAvatar, setChefAvatar] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)

  const {
    items,
    addItem,
    setChefProfile,
    removeItem,
    updateQuantity,
    chefId: currentChefId,
    clearCart,
    totalCount,
    totalPrice
  } = useCart()

  // 获取购物车中某菜品的数量
  const getDishQuantity = (dishId: number) => {
    const item = items.find(i => i.dish_id === dishId)
    return item?.quantity || 0
  }

  useEffect(() => {
    const params = router.params as Record<string, string>
    setChefId(asNumber(params?.chefId, 0))
    
    setChefAvatar(params?.chefAvatar ? decodeURIComponent(params.chefAvatar) : '')
  }, [router.params])

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    if (!chefId) return
    try {
      const result = await api.recipe.chefCategories(chefId)
      const categoryNames = result?.data?.categories || []

      const parsedCategories = categoryNames.map((name: string, index: number) => ({
        id: index + 1,
        name: name,
        dishes: []
      }))

      setCategories(parsedCategories)

      // 默认选中第一个分类
      if (categoryNames.length > 0 && !activeCategory) {
        setActiveCategory(categoryNames[0])
      }
    } catch (err) {
      console.error('Load categories error:', err)
    }
  }, [chefId, activeCategory])

  // 加载指定分类的菜品
  const loadDishesByCategory = useCallback(async (category: string) => {
    if (!chefId || !category) return
    setLoading(true)
    try {
      const result = await api.recipe.chefDishesByCategory(chefId, category)
      const dishList = (result?.data?.dishes || []).map(toDish)
      setDishes(dishList)
    } catch (err) {
      console.error('Load dishes error:', err)
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [chefId])

  // 加载大厨信息
  const loadChefInfo = useCallback(async () => {
    if (!chefId) return
    try {
      const chefsResult = await api.order.chefs()
      const chefs = pickList(chefsResult, ['chefs', 'data'])
      const chef = chefs.find((c: any) => asNumber(c?.id, 0) === chefId)
      if (chef) {
        setChefName(String(chef?.nickname ?? chef?.username ?? '大厨'))
        setChefAvatar(chef?.avatar ?? '')
        setChefProfile(chefId, {
          name: String(chef?.nickname ?? chef?.username ?? '大厨'),
          avatar: chef?.avatar ?? ''
        })
      }
    } catch (err) {
      console.error('Load chef info error:', err)
    }
  }, [chefId])

  useEffect(() => {
    if (chefId) {
      loadChefInfo()
      loadCategories()
    }
  }, [chefId, loadChefInfo, loadCategories])

  // 当活跃分类变化时，加载对应菜品
  useEffect(() => {
    if (activeCategory) {
      loadDishesByCategory(activeCategory)
    }
  }, [activeCategory, loadDishesByCategory])

  // 增加菜品数量
  const handleIncrease = (dish: Dish) => {
    if (currentChefId !== null && currentChefId !== chefId) {
      Taro.showModal({
        title: '提示',
        content: T.confirmChefChange,
        confirmColor: '#EA4C73',
        success: (res) => {
          if (res.confirm) {
            clearCart()
            addItem({
              dish_id: dish.id,
              name: dish.name,
              price: dish.price,
              quantity: 1
            }, chefId, { name: chefName, avatar: chefAvatar })
          }
        }
      })
    } else {
      addItem({
        dish_id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1
      }, chefId, { name: chefName, avatar: chefAvatar })
    }
  }

  // 减少菜品数量
  const handleDecrease = (dishId: number) => {
    const currentQty = getDishQuantity(dishId)
    if (currentQty > 1) {
      updateQuantity(dishId, currentQty - 1)
    } else {
      removeItem(dishId)
    }
  }

  // 显示菜品详情
  const handleShowDetail = (dish: Dish) => {
    setSelectedDish(dish)
    setShowDetailModal(true)
  }

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedDish(null)
  }

  // 显示购物车弹窗
  const handleShowCart = () => {
    if (totalCount > 0) {
      setShowCartModal(true)
    }
  }

  // 关闭购物车弹窗
  const handleCloseCart = () => {
    setShowCartModal(false)
  }

  // 跳转到订单确认页面
  const handleCheckout = () => {
    if (totalCount === 0) {
      Taro.showToast({ title: '请先添加菜品', icon: 'none' })
      return
    }
    setChefProfile(chefId, { name: chefName, avatar: chefAvatar })
    Taro.navigateTo({ url: `/pages/orderConfirm/index?chefId=${chefId}&chefName=${chefName}` })
  }

  // 渲染购物车数量控制器
  const renderQuantityControl = (dish: Dish, isInCart = false) => {
    const quantity = getDishQuantity(dish.id)

    if (quantity === 0) {
      return (
        <View
          className="add-btn"
          onClick={(e) => {
            e?.stopPropagation?.()
            handleIncrease(dish)
          }}
        >
          <Text className="add-btn-text">{T.add}</Text>
        </View>
      )
    }

    return (
      <View className={`quantity-control ${isInCart ? 'in-cart' : ''}`}>
        <View
          className="quantity-btn minus"
          onClick={(e) => {
            e?.stopPropagation?.()
            handleDecrease(dish.id)
          }}
        >
          <Text className="quantity-btn-text">{T.minus}</Text>
        </View>
        <Text className="quantity-text">{quantity}</Text>
        <View
          className="quantity-btn plus"
          onClick={(e) => {
            e?.stopPropagation?.()
            handleIncrease(dish)
          }}
        >
          <Text className="quantity-btn-text">{T.add}</Text>
        </View>
      </View>
    )
  }

  const firstDish = dishes[0]

  return (
    <View className="chef-detail-container">
      {/* 顶部搜索栏 */}
      <View className="header">
        <View className="chef-avatar-small">
          {chefAvatar ? (
            <Image src={chefAvatar} className="chef-avatar-img" mode="aspectFill" />
          ) : (
            <Text className="chef-icon-small">👨‍🍳</Text>
          )}
        </View>
      </View>

      {/* 主内容区 */}
      <View className="main-content">
        {/* 左侧分类栏 */}
        <ScrollView className="category-sidebar" scrollY>
          {categories.map((cat) => (
            <View
              key={cat.id}
              className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name === categories[0]?.name && <Text className="fire-icon">🔥</Text>}
              <Text className="category-name">{cat.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧菜品列表 */}
        <ScrollView className="dish-content" scrollY>
          {loading ? (
            <View className="loading-state">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : dishes.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-text">{T.noDishes}</Text>
            </View>
          ) : (
            <View className="dish-list">
              {/* 第一个菜品大图展示 */}
              {firstDish && (
                <View className="featured-dish" onClick={() => handleShowDetail(firstDish)}>
                  <View className="featured-header">
                    <Text className="fire-icon">🔥</Text>
                    <Text className="featured-title">{activeCategory}</Text>
                    <Text className="sparkle-icon">✨</Text>
                  </View>
                  <View className="featured-card">
                    {firstDish.image ? (
                      <Image src={firstDish.image} className="featured-image" mode="aspectFill" />
                    ) : (
                      <View className="featured-image-placeholder">
                        <Text className="dish-icon-large">🍱</Text>
                      </View>
                    )}
                    <View className="featured-info">
                      <View className="featured-name-row">
                        <Text className="featured-name">{firstDish.name}</Text>
                        <View className="hot-tag">
                          <Text className="hot-tag-text">热销</Text>
                        </View>
                      </View>
                      {firstDish.description && (
                        <Text className="featured-desc">{firstDish.description}</Text>
                      )}
                      <View className="featured-bottom">
                        <Text className="featured-price">¥{firstDish.price.toFixed(2)}</Text>
                        {renderQuantityControl(firstDish)}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 其他菜品列表 */}
              <View className="dish-grid">
                {dishes.slice(1).map((dish) => (
                  <View key={dish.id} className="dish-item" onClick={() => handleShowDetail(dish)}>
                    {dish.image ? (
                      <Image src={dish.image} className="dish-item-image" mode="aspectFill" />
                    ) : (
                      <View className="dish-item-image-placeholder">
                        <Text className="dish-icon">🍱</Text>
                      </View>
                    )}
                    <View className="dish-item-info">
                      <Text className="dish-item-name">{dish.name}</Text>
                      {dish.description && (
                        <Text className="dish-item-desc">{dish.description}</Text>
                      )}
                      <View className="dish-item-bottom">
                        <Text className="dish-item-price">¥{dish.price.toFixed(2)}</Text>
                        {renderQuantityControl(dish)}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 底部结算栏 */}
      {totalCount > 0 && (
        <View className="bottom-bar">
          <View className="cart-info" onClick={handleShowCart}>
            <View className="cart-icon-wrap">
              <Text className="cart-icon">🛒</Text>
              {totalCount > 0 && (
                <View className="cart-badge">
                  <Text className="cart-badge-text">{totalCount}</Text>
                </View>
              )}
            </View>
            <Text className="total-price">¥{totalPrice.toFixed(2)}</Text>
          </View>
          <View className="checkout-btn" onClick={handleCheckout}>
            <Text className="checkout-text">{T.order}</Text>
            <Text className="checkout-arrow">›</Text>
          </View>
        </View>
      )}

      {/* 菜品详情弹窗 */}
      {showDetailModal && selectedDish && (
        <View className="detail-modal">
          <View className="detail-modal-overlay" onClick={handleCloseDetail} />
          <View className="detail-modal-content">
            <View className="detail-modal-header">
              <Text className="detail-modal-title">{T.dishDetail}</Text>
              <View className="detail-modal-close" onClick={handleCloseDetail}>
                <Text className="close-icon">✕</Text>
              </View>
            </View>

            <ScrollView className="detail-modal-body" scrollY>
              {selectedDish.image ? (
                <Image src={selectedDish.image} className="detail-image" mode="aspectFill" />
              ) : (
                <View className="detail-image-placeholder">
                  <Text className="detail-icon">🍱</Text>
                </View>
              )}

              <View className="detail-info">
                <Text className="detail-name">{selectedDish.name}</Text>
                <Text className="detail-price">¥{selectedDish.price.toFixed(2)}</Text>

                {selectedDish.description && (
                  <View className="detail-section">
                    <Text className="detail-section-title">菜品描述</Text>
                    <Text className="detail-desc">{selectedDish.description}</Text>
                  </View>
                )}

                {selectedDish.ingredients && (
                  <View className="detail-section">
                    <Text className="detail-section-title">食材</Text>
                    <Text className="detail-desc">
                      {Array.isArray(selectedDish.ingredients)
                        ? selectedDish.ingredients
                            .map((ing: any) =>
                              typeof ing === 'object'
                                ? `${ing.name || ''}${ing.amount ? `: ${ing.amount}` : ''}`
                                : String(ing)
                            )
                            .join('、')
                        : String(selectedDish.ingredients)}
                    </Text>
                  </View>
                )}

                {selectedDish.nutrition && (
                  <View className="detail-section">
                    <Text className="detail-section-title">营养信息</Text>
                    <View className="nutrition-grid">
                      {selectedDish.nutrition.calories && (
                        <View className="nutrition-item">
                          <Text className="nutrition-label">热量</Text>
                          <Text className="nutrition-value">
                            {typeof selectedDish.nutrition.calories === 'object'
                              ? `${selectedDish.nutrition.calories.amount || ''}${selectedDish.nutrition.calories.name || ''}`
                              : selectedDish.nutrition.calories}
                          </Text>
                        </View>
                      )}
                      {selectedDish.nutrition.protein && (
                        <View className="nutrition-item">
                          <Text className="nutrition-label">蛋白质</Text>
                          <Text className="nutrition-value">
                            {typeof selectedDish.nutrition.protein === 'object'
                              ? `${selectedDish.nutrition.protein.amount || ''}${selectedDish.nutrition.protein.name || ''}`
                              : selectedDish.nutrition.protein}
                          </Text>
                        </View>
                      )}
                      {selectedDish.nutrition.fat && (
                        <View className="nutrition-item">
                          <Text className="nutrition-label">脂肪</Text>
                          <Text className="nutrition-value">
                            {typeof selectedDish.nutrition.fat === 'object'
                              ? `${selectedDish.nutrition.fat.amount || ''}${selectedDish.nutrition.fat.name || ''}`
                              : selectedDish.nutrition.fat}
                          </Text>
                        </View>
                      )}
                      {selectedDish.nutrition.carbs && (
                        <View className="nutrition-item">
                          <Text className="nutrition-label">碳水</Text>
                          <Text className="nutrition-value">
                            {typeof selectedDish.nutrition.carbs === 'object'
                              ? `${selectedDish.nutrition.carbs.amount || ''}${selectedDish.nutrition.carbs.name || ''}`
                              : selectedDish.nutrition.carbs}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="detail-modal-footer">
              <View className="detail-quantity-section">
                <Text className="detail-total-label">合计:</Text>
                <Text className="detail-total-price">
                  ¥{(selectedDish.price * getDishQuantity(selectedDish.id)).toFixed(2)}
                </Text>
              </View>

              {getDishQuantity(selectedDish.id) > 0 ? (
                <View className="detail-quantity-control">
                  <View
                    className="detail-quantity-btn minus"
                    onClick={() => handleDecrease(selectedDish.id)}
                  >
                    <Text className="detail-quantity-btn-text">{T.minus}</Text>
                  </View>
                  <Text className="detail-quantity-text">{getDishQuantity(selectedDish.id)}</Text>
                  <View
                    className="detail-quantity-btn plus"
                    onClick={() => handleIncrease(selectedDish)}
                  >
                    <Text className="detail-quantity-btn-text">{T.add}</Text>
                  </View>
                </View>
              ) : (
                <View className="detail-add-btn" onClick={() => handleIncrease(selectedDish)}>
                  <Text className="detail-add-btn-text">{T.addToCart}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 购物车弹窗 */}
      {showCartModal && (
        <View className="cart-modal">
          <View className="cart-modal-overlay" onClick={handleCloseCart} />
          <View className="cart-modal-content">
            <View className="cart-modal-header">
              <Text className="cart-modal-title">{T.cartTitle}</Text>
              <View className="cart-modal-close" onClick={handleCloseCart}>
                <Text className="close-icon">✕</Text>
              </View>
            </View>

            <ScrollView className="cart-modal-body" scrollY>
              {items.map((item) => (
                <View key={item.dish_id} className="cart-item">
                  <View className="cart-item-info">
                    <Text className="cart-item-name">{item.name}</Text>
                    <Text className="cart-item-price">¥{item.price.toFixed(2)}</Text>
                  </View>
                  <View className="cart-item-control">
                    <View
                      className="cart-quantity-btn minus"
                      onClick={() => handleDecrease(item.dish_id)}
                    >
                      <Text className="cart-quantity-btn-text">{T.minus}</Text>
                    </View>
                    <Text className="cart-quantity-text">{item.quantity}</Text>
                    <View
                      className="cart-quantity-btn plus"
                      onClick={() => {
                        const dish = dishes.find(d => d.id === item.dish_id)
                        if (dish) handleIncrease(dish)
                      }}
                    >
                      <Text className="cart-quantity-btn-text">{T.add}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View className="cart-modal-footer">
              <View className="cart-total-section">
                <Text className="cart-total-label">合计:</Text>
                <Text className="cart-total-price">¥{totalPrice.toFixed(2)}</Text>
              </View>
              <View className="cart-checkout-btn" onClick={handleCheckout}>
                <Text className="cart-checkout-text">{T.order}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ChefDetailScreen




