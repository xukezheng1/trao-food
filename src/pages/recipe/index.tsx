import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api, { BASE_URL } from '../../utils/api'
import { asNumber, pickData, pickList } from '../../utils/response'
import { useUser } from '../../context/UserContext'
import { getProxiedImageUrl } from '../../utils/imageProxy'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  title: '菜谱管理',
  listTitle: '菜品列表',
  empty: '暂无菜品',
  save: '保存',
  deleting: '删除中...',
  delete: '删除',
  add: '新增',
  detailTitle: '菜谱详情',
  category: '菜品分类',
  desc: '描述',
  ingredients: '食材',
  nutrition: '营养价值',
  steps: '做菜步骤',
  price: '价格设置',
  addIngredient: '+ 添加食材',
  addStep: '+ 添加步骤',
  uploadCover: '上传封面图',
  uploadStepImage: '上传步骤图',
  noPermission: '当前身份无编辑权限',
  saveFailed: '保存失败',
  deleteFailed: '删除失败',
  uploadFailed: '上传图片失败',
  saveOk: '保存成功',
  deleteConfirm: '确认删除当前菜品吗？',
  required: '请填写菜名和价格',
  aiGenerate: 'AI生成',
  aiGenerating: 'AI生成中...',
  aiGenerateTip: '根据菜名自动生成菜谱信息',
  aiFailed: 'AI生成失败',
}

interface IngredientItem {
  name: string
  amount: string
}

interface StepItem {
  text: string
  image: string
}

interface NutritionData {
  calories: string
  protein: string
  fat: string
  carbs: string
}

interface RecipeItem {
  id: number
  category: string
  name: string
  description: string
  image: string
  price: number
  ingredients: IngredientItem[]
  steps: StepItem[]
  nutrition: NutritionData
}

interface Chef {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

const emptyNutrition = (): NutritionData => ({
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
})

const normalizeRecipe = (item: any): RecipeItem => {
  const ingredients = Array.isArray(item?.ingredients) ? item.ingredients : []
  const steps = Array.isArray(item?.steps) ? item.steps : []
  const nutrition = item?.nutrition && typeof item.nutrition === 'object' ? item.nutrition : {}

  return {
    id: asNumber(item?.id, 0),
    category: String(item?.category ?? '其他'),
    name: String(item?.name ?? ''),
    description: String(item?.description ?? ''),
    image: String(item?.image ?? ''),
    price: asNumber(item?.price, 0),
    ingredients: ingredients.map((ing: any) => ({
      name: String(ing?.name ?? ''),
      amount: String(ing?.amount ?? ''),
    })),
    steps: steps.map((step: any) => ({
      text: String(step?.text ?? ''),
      image: String(step?.image ?? ''),
    })),
    nutrition: {
      calories: String(nutrition?.calories ?? ''),
      protein: String(nutrition?.protein ?? ''),
      fat: String(nutrition?.fat ?? ''),
      carbs: String(nutrition?.carbs ?? ''),
    },
  }
}

const RecipeScreen = () => {
  const { user } = useUser()
  const isChef = user.role === 'chef'
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [activeRecipe, setActiveRecipe] = useState<RecipeItem | null>(null)
  const [chefs, setChefs] = useState<Chef[]>([])
  const [selectedChefId, setSelectedChefId] = useState<number | null>(null)

  const loadRecipes = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await api.recipe.list({ page: 1, limit: 100 })
      const data = pickData<any>(result, {})
      const list = pickList(data, ['recipes'])
      setRecipes(list.map(normalizeRecipe))
    } catch (error: any) {
      Taro.showToast({ title: error.message || T.saveFailed, icon: 'none' })
      setRecipes([])
    } finally {
      setRefreshing(false)
    }
  }, [])

  // 加载大厨列表（非大厨用户需要选择）
  const loadChefs = useCallback(async () => {
    if (isChef) return
    try {
      const result = await api.order.chefs()
      const data = pickData<any>(result, {})
      const list = pickList(data, ['chefs'])
      setChefs(list)
    } catch (err) {
      console.error('加载大厨列表失败', err)
    }
  }, [isChef])

  useEffect(() => {
    loadRecipes()
    loadChefs()
  }, [loadRecipes, loadChefs])

  const openDetail = async (id: number) => {
    try {
      const result = await api.recipe.detail(id)
      console.log('Recipe detail result:', result)
      const detail = normalizeRecipe(pickData<any>(result, {}))
      console.log('Normalized recipe:', detail, 'steps:', detail.steps)
      setActiveRecipe(detail)
      setDetailVisible(true)
    } catch (error: any) {
      Taro.showToast({ title: error.message || T.saveFailed, icon: 'none' })
    }
  }

  const openCreate = () => {
    setActiveRecipe({
      id: 0,
      category: '其他',
      name: '',
      description: '',
      image: '',
      price: 0,
      ingredients: [],
      steps: [],
      nutrition: emptyNutrition(),
    })
    // 默认选中第一个大厨（非大厨用户）
    if (!isChef && chefs.length > 0) {
      setSelectedChefId(chefs[0].id)
    }
    setDetailVisible(true)
  }

  const updateActiveRecipe = (patch: Partial<RecipeItem>) => {
    setActiveRecipe((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const updateIngredient = (index: number, patch: Partial<IngredientItem>) => {
    setActiveRecipe((prev) => {
      if (!prev) return prev
      const next = [...prev.ingredients]
      next[index] = { ...next[index], ...patch }
      return { ...prev, ingredients: next }
    })
  }

  const updateStep = (index: number, patch: Partial<StepItem>) => {
    setActiveRecipe((prev) => {
      if (!prev) return prev
      const next = [...prev.steps]
      next[index] = { ...next[index], ...patch }
      return { ...prev, steps: next }
    })
  }

  const pickAndUploadImage = async (onDone: (url: string) => void) => {
    if (!isChef) {
      Taro.showToast({ title: T.noPermission, icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // First show local preview immediately.
        onDone(tempFilePath)

        try {
          // 1. 获取七牛云上传token
          const fileName = tempFilePath.split('/').pop() || 'image.jpg'
          const tokenRes = await api.recipe.uploadToken(fileName, 'recipes')
          const { token, key, domain } = tokenRes.data

          // 2. 上传到七牛云
          const uploadRes = await Taro.uploadFile({
            url: 'https://up-z2.qiniup.com',
            filePath: tempFilePath,
            name: 'file',
            formData: {
              token: token,
              key: key
            }
          })

          const uploadData = JSON.parse(uploadRes.data)
          if (uploadData.key) {
            // 3. 构建七牛云URL（使用http）
            // 处理domain可能包含协议前缀的情况
            const domainStr = String(domain || '')
            const cleanDomain = domainStr.replace(/^https?:\/\//, '')
            const qiniuUrl = `http://${cleanDomain}/${uploadData.key}`
            console.log('Build qiniuUrl:', qiniuUrl, 'from domain:', domain)
            // 4. 转换为API转发地址并保存到数据库
            const proxiedUrl = getProxiedImageUrl(qiniuUrl)
            console.log('Build proxiedUrl:', proxiedUrl)
            onDone(proxiedUrl)
          } else {
            throw new Error(T.uploadFailed)
          }
        } catch (error: any) {
          console.error('Upload error:', error)
          Taro.showToast({ title: error.message || T.uploadFailed, icon: 'none' })
        }
      }
    })
  }

  const generateByAI = async () => {
    if (!isChef) {
      Taro.showToast({ title: T.noPermission, icon: 'none' })
      return
    }
    if (!activeRecipe?.name.trim()) {
      Taro.showToast({ title: '请先输入菜名', icon: 'none' })
      return
    }

    setAiGenerating(true)
    try {
      const result = await api.recipe.aiPreview({ name: activeRecipe.name.trim() })
      const data = pickData<any>(result, {})
      const nextIngredients: IngredientItem[] = Array.isArray(data?.ingredients)
        ? data.ingredients.map((item: any) => ({
            name: String(item?.name ?? ''),
            amount: String(item?.amount ?? ''),
          }))
        : []
      const nextSteps: StepItem[] = Array.isArray(data?.steps)
        ? data.steps.map((item: any) => ({
            text: String(item?.text ?? ''),
            image: String(item?.image ?? ''),
          }))
        : []
      const nextNutrition: NutritionData = {
        calories: String(data?.nutrition?.calories ?? ''),
        protein: String(data?.nutrition?.protein ?? ''),
        fat: String(data?.nutrition?.fat ?? ''),
        carbs: String(data?.nutrition?.carbs ?? ''),
      }
      const nextPrice = asNumber(data?.price, 0)

      setActiveRecipe((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          category: String(data?.category ?? '').trim() || prev.category || '其他',
          description: String(data?.description ?? '').trim() || prev.description,
          ingredients: nextIngredients.length > 0 ? nextIngredients : prev.ingredients,
          steps: nextSteps.length > 0 ? nextSteps : prev.steps,
          nutrition: nextNutrition,
          price: nextPrice > 0 ? nextPrice : prev.price,
        }
      })
      Taro.showToast({ title: 'AI生成成功，请检查并编辑', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: T.aiFailed, icon: 'none' })
    } finally {
      setAiGenerating(false)
    }
  }

  const saveRecipe = async () => {
    if (!activeRecipe) return

    if (!activeRecipe.name.trim()) {
      Taro.showToast({ title: '请填写菜名', icon: 'none' })
      return
    }

    // 非大厨必须选择一个大厨
    if (!isChef && !selectedChefId) {
      Taro.showToast({ title: '请选择归属的大厨', icon: 'none' })
      return
    }

    // 非大厨上传菜品，价格默认为0
    const payload: any = {
      category: activeRecipe.category || '其他',
      name: activeRecipe.name.trim(),
      description: activeRecipe.description.trim(),
      image: activeRecipe.image.trim(),
      price: isChef ? activeRecipe.price : 0,
      ingredients: activeRecipe.ingredients.filter((x) => x.name.trim()),
      steps: activeRecipe.steps.filter((x) => x.text.trim()),
      nutrition: activeRecipe.nutrition,
    }

    // 非大厨上传时，添加 chef_id
    if (!isChef && selectedChefId) {
      payload.chef_id = selectedChefId
    }

    setSaving(true)
    try {
      if (activeRecipe.id > 0) {
        await api.recipe.update(activeRecipe.id, payload)
      } else {
        await api.recipe.create(payload)
      }
      Taro.showToast({ title: T.saveOk, icon: 'success' })
      setDetailVisible(false)
      await loadRecipes()
    } catch (error: any) {
      Taro.showToast({ title: error.message || T.saveFailed, icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const deleteRecipe = async () => {
    if (!isChef) {
      Taro.showToast({ title: T.noPermission, icon: 'none' })
      return
    }
    if (!activeRecipe || activeRecipe.id <= 0) return

    Taro.showModal({
      title: T.delete,
      content: T.deleteConfirm,
      success: async (res) => {
        if (res.confirm) {
          setDeleting(true)
          try {
            await api.recipe.remove(activeRecipe.id)
            setDetailVisible(false)
            await loadRecipes()
          } catch (error: any) {
            Taro.showToast({ title: error.message || T.deleteFailed, icon: 'none' })
          } finally {
            setDeleting(false)
          }
        }
      }
    })
  }

  const renderCard = (item: RecipeItem) => (
    <View key={item.id} className="card" onClick={() => openDetail(item.id)}>
      <Image
        src={item.image || '/assets/homeIcon.png'}
        className="card-image"
        mode="aspectFill"
      />
      <View className="card-right">
        <Text className="card-name">{item.name}</Text>
        <Text className="card-desc">{item.description || '暂无描述'}</Text>
        <Text className="card-price">￥ {item.price.toFixed(2)}</Text>
      </View>
    </View>
  )

  return (
    <View className="recipe-container">
      <View className="header">
        <View>
          <Text className="title">{T.title}</Text>
        </View>
        {/* 只有大厨身份显示新增按钮 */}
        {isChef && (
          <View className="add-btn" onClick={openCreate}>
            <Text className="add-btn-text">+</Text>
          </View>
        )}
      </View>

      <Text className="section-title">{T.listTitle}</Text>
      <ScrollView
        className="list"
        scrollY
        refresher-triggered={refreshing}
        onRefresherRefresh={loadRecipes}
      >
        {recipes.length === 0 ? (
          <View className="empty-wrap">
            <Text className="empty-icon">🍴</Text>
            <Text className="empty-text">{T.empty}</Text>
          </View>
        ) : (
          recipes.map(renderCard)
        )}
      </ScrollView>

      {/* 详情弹窗 */}
      {detailVisible && activeRecipe && (
        <View className="detail-modal">
          <View className="detail-header">
            <View className="back-btn" onClick={() => setDetailVisible(false)}>
              <Text className="back-btn-text">-</Text>
            </View>
            <Text className="detail-title">{T.detailTitle}</Text>
            <View className="save-top-btn" onClick={saveRecipe}>
              <Text className="save-top-text">{saving ? '...' : T.save}</Text>
            </View>
          </View>

          <ScrollView className="detail-scroll" scrollY>
            <View className="detail-content">
              {/* 封面图 */}
              <View
                className="image-box"
                onClick={() => pickAndUploadImage((url) => updateActiveRecipe({ image: url }))}
              >
                <Image
                  src={activeRecipe.image || '/assets/homeIcon.png'}
                  className="detail-image"
                  mode="aspectFill"
                />
                {isChef && <Text className="upload-text">{T.uploadCover}</Text>}
              </View>

              {/* 菜名和AI生成 */}
              <View className="name-row">
                <input
                  value={activeRecipe.name}
                  onInput={(e) => updateActiveRecipe({ name: e.detail.value })}
                  className="name-input"
                  placeholder="菜名"
                  disabled={!isChef}
                />
                {isChef && (
                  <View
                    className={`ai-btn ${aiGenerating ? 'ai-btn-disabled' : ''}`}
                    onClick={generateByAI}
                  >
                    <Text className="ai-btn-text">
                      {aiGenerating ? '生成中...' : T.aiGenerate}
                    </Text>
                  </View>
                )}
              </View>

              {/* 非大厨上传时需要选择归属的大厨 */}
              {!isChef && (
                <>
                  <Text className="group-title">归属大厨</Text>
                  <ScrollView className="chef-scroll" scrollX>
                    {chefs.map((chef) => (
                      <View
                        key={chef.id}
                        className={`chef-tag ${selectedChefId === chef.id ? 'chef-tag-active' : ''}`}
                        onClick={() => setSelectedChefId(chef.id)}
                      >
                        <Text className={`chef-tag-text ${selectedChefId === chef.id ? 'chef-tag-text-active' : ''}`}>
                          {chef.nickname || chef.username}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* 分类 */}
              <Text className="group-title">{T.category}</Text>
              {isChef ? (
                <>
                  <ScrollView className="category-scroll" scrollX>
                    {['热菜', '凉菜', '汤羹', '主食', '甜品', '饮品', '小吃', '其他'].map((cat) => (
                      <View
                        key={cat}
                        className={`category-tag ${activeRecipe.category === cat ? 'category-tag-active' : ''}`}
                        onClick={() => updateActiveRecipe({ category: cat })}
                      >
                        <Text className={`category-tag-text ${activeRecipe.category === cat ? 'category-tag-text-active' : ''}`}>
                          {cat}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                  {activeRecipe.category === '其他' && (
                    <input
                      value={activeRecipe.category === '其他' ? '' : activeRecipe.category}
                      onInput={(e) => updateActiveRecipe({ category: e.detail.value || '其他' })}
                      className="input custom-category-input"
                      placeholder="请输入自定义分类"
                      disabled={!isChef}
                    />
                  )}
                </>
              ) : (
                <View className="category-display">
                  <Text className="category-display-text">{activeRecipe.category || '其他'}</Text>
                </View>
              )}

              {/* 描述 */}
              <Text className="group-title">{T.desc}</Text>
              <Textarea
                value={activeRecipe.description}
                onInput={(e) => updateActiveRecipe({ description: e.detail.value })}
                className="input text-area"
                disabled={!isChef}
                placeholder="请输入菜品描述"
              />

              {/* 食材 */}
              <View className="group-title-row">
                <View className="group-title-with-btn">
                  <Text className="group-title">{T.ingredients}</Text>
                  {isChef && (
                    <View
                      className="title-add-btn"
                      onClick={() =>
                        updateActiveRecipe({
                          ingredients: [...activeRecipe.ingredients, { name: '', amount: '' }],
                        })
                      }
                    >
                      <Text className="title-add-btn-text">{T.addIngredient}</Text>
                    </View>
                  )}
                </View>
              </View>
              {activeRecipe.ingredients.map((ing, index) => (
                <View key={`ing-${index}`} className="row-input-with-delete">
                  <input
                    value={ing.name}
                    onInput={(e) => updateIngredient(index, { name: e.detail.value })}
                    className="input ingredient-name-input"
                    disabled={!isChef}
                    placeholder="食材"
                  />
                  <input
                    value={ing.amount}
                    onInput={(e) => updateIngredient(index, { amount: e.detail.value })}
                    className="input ingredient-amount-input"
                    disabled={!isChef}
                    placeholder="用量"
                  />
                  {isChef && (
                    <View
                      className="delete-btn"
                      onClick={() => {
                        const newIngredients = [...activeRecipe.ingredients]
                        newIngredients.splice(index, 1)
                        updateActiveRecipe({ ingredients: newIngredients })
                      }}
                    >
                      <Text className="delete-btn-text">-</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* 营养价值 */}
              <Text className="group-title">{T.nutrition}</Text>
              <View className="row-input">
                <input
                  value={activeRecipe.nutrition.calories}
                  onInput={(e) =>
                    updateActiveRecipe({ nutrition: { ...activeRecipe.nutrition, calories: e.detail.value } })
                  }
                  className="input row-left"
                  disabled={!isChef}
                  placeholder="热量"
                />
                <input
                  value={activeRecipe.nutrition.protein}
                  onInput={(e) =>
                    updateActiveRecipe({ nutrition: { ...activeRecipe.nutrition, protein: e.detail.value } })
                  }
                  className="input row-right"
                  disabled={!isChef}
                  placeholder="蛋白质"
                />
              </View>
              <View className="row-input">
                <input
                  value={activeRecipe.nutrition.fat}
                  onInput={(e) =>
                    updateActiveRecipe({ nutrition: { ...activeRecipe.nutrition, fat: e.detail.value } })
                  }
                  className="input row-left"
                  disabled={!isChef}
                  placeholder="脂肪"
                />
                <input
                  value={activeRecipe.nutrition.carbs}
                  onInput={(e) =>
                    updateActiveRecipe({ nutrition: { ...activeRecipe.nutrition, carbs: e.detail.value } })
                  }
                  className="input row-right"
                  disabled={!isChef}
                  placeholder="碳水"
                />
              </View>

              {/* 做菜步骤 */}
              <View className="group-title-row">
                <View className="group-title-with-btn">
                  <Text className="group-title">{T.steps}</Text>
                  {isChef && (
                    <View
                      className="title-add-btn"
                      onClick={() =>
                        updateActiveRecipe({
                          steps: [...activeRecipe.steps, { text: '', image: '' }],
                        })
                      }
                    >
                      <Text className="title-add-btn-text">{T.addStep}</Text>
                    </View>
                  )}
                </View>
              </View>
              {activeRecipe.steps.map((step, index) => (
                <View key={`step-${index}`} className="step-card">
                  <View className="step-title-row">
                    <Text className="step-index">步骤 {index + 1}</Text>
                    <View className="step-actions">
                      {isChef && (
                        <Text
                          className="step-upload-text"
                          onClick={() =>
                            pickAndUploadImage((url) =>
                              updateStep(index, {
                                image: url,
                              })
                            )
                          }
                        >
                          {T.uploadStepImage}
                        </Text>
                      )}
                      {isChef && (
                        <View
                          className="delete-step-btn"
                          onClick={() => {
                            const newSteps = [...activeRecipe.steps]
                            newSteps.splice(index, 1)
                            updateActiveRecipe({ steps: newSteps })
                          }}
                        >
                          <Text className="delete-step-btn-text">-</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {step.image && (
                    <Image src={step.image} className="step-image" mode="aspectFill" />
                  )}
                  <Textarea
                    value={step.text}
                    onInput={(e) => updateStep(index, { text: e.detail.value })}
                    className="input step-input"
                    disabled={!isChef}
                    placeholder="请输入步骤描述"
                  />
                </View>
              ))}

              {/* 只有大厨可以设置价格 */}
              {isChef && (
                <>
                  <Text className="group-title">{T.price}</Text>
                  <input
                    type="digit"
                    value={String(activeRecipe.price || '')}
                    onInput={(e) => updateActiveRecipe({ price: asNumber(e.detail.value, 0) })}
                    className="input"
                    placeholder="0.00"
                  />
                </>
              )}

              {isChef && (
                <View className="bottom-actions">
                  <View className="bottom-delete-btn" onClick={deleteRecipe}>
                    <Text className="bottom-delete-btn-text">{deleting ? T.deleting : T.delete}</Text>
                  </View>
                  <View className="save-btn" onClick={saveRecipe}>
                    <Text className="save-btn-text">{saving ? '...' : T.save}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <CustomTabBar />
    </View>
  )
}

export default RecipeScreen
