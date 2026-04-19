import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import './index.scss'

const T = {
  title: 'AI生成菜谱',
  inputHint: '输入菜品名称，让AI帮你生成菜谱',
  generate: '生成',
  regenerate: '重新生成',
  save: '保存菜谱',
  success: '生成成功',
  saveSuccess: '保存成功',
  fail: '生成失败',
  ingredients: '食材',
  steps: '步骤',
  nutrition: '营养信息'
}

interface GeneratedRecipe {
  name: string
  description: string
  ingredients: Array<{ name: string; amount: string }>
  steps: Array<{ text: string }>
  nutrition: { calories: string; protein: string; fat: string; carbs: string }
  price: number
}

const AIRecipeScreen = () => {
  const [inputName, setInputName] = useState('')
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!inputName.trim()) {
      Taro.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }

    setGenerating(true)
    try {
      const result = await api.recipe.generate({ name: inputName.trim(), useAI: true })
      const data = result?.data || {}
      setRecipe({
        name: String(data?.name ?? inputName),
        description: String(data?.description ?? ''),
        ingredients: (data?.ingredients ?? []).map((i: any) => ({
          name: String(i?.name ?? ''),
          amount: String(i?.amount ?? '')
        })),
        steps: (data?.steps ?? []).map((s: any) => ({
          text: String(s?.text ?? '')
        })),
        nutrition: {
          calories: String(data?.nutrition?.calories ?? ''),
          protein: String(data?.nutrition?.protein ?? ''),
          fat: String(data?.nutrition?.fat ?? ''),
          carbs: String(data?.nutrition?.carbs ?? '')
        },
        price: Math.round(Math.random() * 50) + 20
      })
      Taro.showToast({ title: T.success, icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!recipe) return

    try {
      await api.recipe.create({
        name: recipe.name,
        description: recipe.description || undefined,
        price: recipe.price,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutrition: recipe.nutrition
      })
      Taro.showToast({ title: T.saveSuccess, icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    }
  }

  return (
    <View className="ai-recipe-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="input-section">
          <Input
            placeholder={T.inputHint}
            value={inputName}
            onChange={(e) => setInputName(e.detail.value)}
            className="input-field"
          />
          <View className={`generate-btn ${generating ? 'disabled' : ''}`} onClick={handleGenerate}>
            <Text className="generate-text">{generating ? '生成中...' : T.generate}</Text>
          </View>
        </View>

        {recipe && (
          <View className="recipe-section">
            <Text className="recipe-name">{recipe.name}</Text>
            {recipe.description && (
              <Text className="recipe-desc">{recipe.description}</Text>
            )}

            <View className="recipe-card">
              <Text className="card-title">{T.ingredients}</Text>
              <View className="ingredients-grid">
                {recipe.ingredients.map((item, index) => (
                  <View key={index} className="ingredient-tag">
                    <Text className="ingredient-name">{item.name}</Text>
                    {item.amount && <Text className="ingredient-amount"> {item.amount}</Text>}
                  </View>
                ))}
              </View>
            </View>

            <View className="recipe-card">
              <Text className="card-title">{T.steps}</Text>
              <View className="steps-list">
                {recipe.steps.map((step, index) => (
                  <View key={index} className="step-item">
                    <View className="step-number">{index + 1}</View>
                    <Text className="step-text">{step.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {recipe.nutrition.calories && (
              <View className="recipe-card">
                <Text className="card-title">{T.nutrition}</Text>
                <View className="nutrition-grid">
                  <View className="nutrition-item">
                    <Text className="nutrition-value">{recipe.nutrition.calories}</Text>
                    <Text className="nutrition-label">卡路里</Text>
                  </View>
                  <View className="nutrition-item">
                    <Text className="nutrition-value">{recipe.nutrition.protein}</Text>
                    <Text className="nutrition-label">蛋白质</Text>
                  </View>
                  <View className="nutrition-item">
                    <Text className="nutrition-value">{recipe.nutrition.fat}</Text>
                    <Text className="nutrition-label">脂肪</Text>
                  </View>
                  <View className="nutrition-item">
                    <Text className="nutrition-value">{recipe.nutrition.carbs}</Text>
                    <Text className="nutrition-label">碳水</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {recipe && (
        <View className="bottom-bar">
          <View className="btn-secondary" onClick={handleGenerate}>
            <Text className="btn-text">{T.regenerate}</Text>
          </View>
          <View className="btn-primary" onClick={handleSave}>
            <Text className="btn-text">{T.save}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default AIRecipeScreen
