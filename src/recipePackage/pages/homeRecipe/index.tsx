import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import './index.scss'

const T = {
  createTitle: '创建菜谱',
  editTitle: '编辑菜谱',
  name: '菜谱名称',
  description: '描述',
  price: '价格',
  ingredients: '食材',
  steps: '步骤',
  addIngredient: '添加食材',
  addStep: '添加步骤',
  submit: '保存',
  cancel: '取消',
  createSuccess: '创建成功',
  updateSuccess: '更新成功',
  fail: '操作失败',
  aiGenerate: 'AI生成'
}

interface Ingredient {
  name: string
  amount?: string
}

interface Step {
  text: string
}

const HomeRecipeScreen = () => {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [recipeId, setRecipeId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }])
  const [steps, setSteps] = useState<Step[]>([{ text: '' }])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const params = router.params as Record<string, string>
    if (params.mode === 'edit' && params.id) {
      setMode('edit')
      setRecipeId(parseInt(params.id))
      loadRecipe(parseInt(params.id))
    }
  }, [router.params])

  const loadRecipe = async (id: number) => {
    setLoading(true)
    try {
      const result = await api.recipe.detail(id)
      const data = result?.data || {}
      setName(String(data?.name ?? ''))
      setDescription(String(data?.description ?? ''))
      setPrice(String(data?.price ?? ''))

      const loadedIngredients = (data?.ingredients ?? []).map((i: any) => ({
        name: String(i?.name ?? ''),
        amount: String(i?.amount ?? '')
      }))
      setIngredients(loadedIngredients.length > 0 ? loadedIngredients : [{ name: '', amount: '' }])

      const loadedSteps = (data?.steps ?? []).map((s: any) => ({
        text: String(s?.text ?? '')
      }))
      setSteps(loadedSteps.length > 0 ? loadedSteps : [{ text: '' }])
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const handleUpdateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    setIngredients(ingredients.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const handleAddStep = () => {
    setSteps([...steps, { text: '' }])
  }

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const handleUpdateStep = (index: number, text: string) => {
    setSteps(steps.map((item, i) =>
      i === index ? { ...item, text } : item
    ))
  }

  const handleAIGenerate = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请先输入菜品名称', icon: 'none' })
      return
    }

    setAiLoading(true)
    try {
      const result = await api.recipe.aiPreview({ name: name.trim() })
      const data = result?.data || {}

      if (data?.ingredients) {
        const loadedIngredients = data.ingredients.map((i: any) => ({
          name: String(i?.name ?? ''),
          amount: String(i?.amount ?? '')
        }))
        setIngredients(loadedIngredients.length > 0 ? loadedIngredients : [{ name: '', amount: '' }])
      }

      if (data?.steps) {
        const loadedSteps = data.steps.map((s: any) => ({
          text: String(s?.text ?? '')
        }))
        setSteps(loadedSteps.length > 0 ? loadedSteps : [{ text: '' }])
      }

      if (data?.description) {
        setDescription(String(data.description))
      }

      if (data?.price) {
        setPrice(String(data.price))
      }

      Taro.showToast({ title: 'AI生成成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || 'AI生成失败', icon: 'none' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入菜谱名称', icon: 'none' })
      return
    }
    if (!price || parseFloat(price) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    const validIngredients = ingredients.filter(i => i.name.trim())
    if (validIngredients.length === 0) {
      Taro.showToast({ title: '请添加至少一种食材', icon: 'none' })
      return
    }

    const validSteps = steps.filter(s => s.text.trim())
    if (validSteps.length === 0) {
      Taro.showToast({ title: '请添加至少一个步骤', icon: 'none' })
      return
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        ingredients: validIngredients,
        steps: validSteps
      }

      if (mode === 'edit' && recipeId) {
        await api.recipe.update(recipeId, payload)
        Taro.showToast({ title: T.updateSuccess, icon: 'success' })
      } else {
        await api.recipe.create(payload)
        Taro.showToast({ title: T.createSuccess, icon: 'success' })
      }
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    }
  }

  return (
    <View className="home-recipe-container">
      <View className="header">
        <Text className="header-title">{mode === 'edit' ? T.editTitle : T.createTitle}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="form-section">
          <View className="form-group">
            <View className="form-label-row">
              <Text className="form-label">{T.name}</Text>
              <View
                className={`ai-btn ${aiLoading ? 'disabled' : ''}`}
                onClick={handleAIGenerate}
              >
                <Text className="ai-btn-text">{aiLoading ? '生成中...' : T.aiGenerate}</Text>
              </View>
            </View>
            <Input
              placeholder="请输入菜谱名称"
              value={name}
              onChange={(e) => setName(e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">{T.description}</Text>
            <Input
              placeholder="请输入菜谱描述"
              value={description}
              onChange={(e) => setDescription(e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">{T.price}</Text>
            <View className="price-input-wrap">
              <Text className="price-symbol">¥</Text>
              <Input
                type="digit"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.detail.value)}
                className="price-input"
              />
            </View>
          </View>

          <View className="form-group">
            <View className="section-header">
              <Text className="form-label">{T.ingredients}</Text>
              <Text className="add-btn" onClick={handleAddIngredient}>+ {T.addIngredient}</Text>
            </View>
            <View className="ingredients-list">
              {ingredients.map((item, index) => (
                <View key={index} className="ingredient-row">
                  <Input
                    placeholder="食材名称"
                    value={item.name}
                    onChange={(e) => handleUpdateIngredient(index, 'name', e.detail.value)}
                    className="ingredient-input"
                  />
                  <Input
                    placeholder="用量"
                    value={item.amount}
                    onChange={(e) => handleUpdateIngredient(index, 'amount', e.detail.value)}
                    className="ingredient-input small"
                  />
                  {ingredients.length > 1 && (
                    <Text className="remove-icon" onClick={() => handleRemoveIngredient(index)}>🗑️</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View className="form-group">
            <View className="section-header">
              <Text className="form-label">{T.steps}</Text>
              <Text className="add-btn" onClick={handleAddStep}>+ {T.addStep}</Text>
            </View>
            <View className="steps-list">
              {steps.map((item, index) => (
                <View key={index} className="step-row">
                  <Text className="step-number">{index + 1}</Text>
                  <Input
                    placeholder={`步骤 ${index + 1}`}
                    value={item.text}
                    onChange={(e) => handleUpdateStep(index, e.detail.value)}
                    className="step-input"
                  />
                  {steps.length > 1 && (
                    <Text className="remove-icon" onClick={() => handleRemoveStep(index)}>🗑️</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bottom-bar">
        <View className="btn-secondary" onClick={() => Taro.navigateBack()}>
          <Text className="btn-text">{T.cancel}</Text>
        </View>
        <View className="btn-primary" onClick={handleSubmit}>
          <Text className="btn-text">{T.submit}</Text>
        </View>
      </View>
    </View>
  )
}

export default HomeRecipeScreen
