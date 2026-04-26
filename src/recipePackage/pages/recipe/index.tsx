import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Image, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../../utils/api'
import { asNumber, pickData, pickList } from '../../../utils/response'
import { getProxiedImageUrl } from '../../../utils/imageProxy'
import { uploadTempFileToQiniuProxy } from '../../../utils/upload'
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

const categoryOptions = [
  { key: 'all', name: '全部', icon: '▦' },
  { key: 'zaocan', name: '早餐', icon: zaocanIcon },
  { key: 'wucan', name: '午餐', icon: wucanIcon },
  { key: 'wancan', name: '晚餐', icon: wancanIcon },
  { key: 'shucai', name: '蔬菜', icon: shucaiIcon },
  { key: 'huncai', name: '荤菜', icon: huncaiIcon },
  { key: 'liangcai', name: '凉菜', icon: shucaiIcon },
  { key: 'tianpin', name: '甜品', icon: tianpinIcon },
  { key: 'yinpin', name: '饮品', icon: yinpinIcon },
  { key: 'xianshi', name: '限时', icon: xianshiIcon },
  { key: 'wanghe', name: '盲盒', icon: wangheIcon }
]

const formCategories = categoryOptions.filter(item => item.key !== 'all')
const pricePresets = [10, 16, 20]

interface RecipeItem {
  id: number
  category: string
  name: string
  description: string
  image: string
  images: string[]
  price: number
  ingredients: string
  stepsText: string
  isPublished: boolean
}

const normalizeRecipe = (item: any): RecipeItem => {
  const ingredients = Array.isArray(item?.ingredients)
    ? item.ingredients.map((ing: any) => ing?.amount ? `${ing?.name} ${ing?.amount}` : ing?.name).filter(Boolean).join('、')
    : String(item?.ingredients ?? '')
  const stepsText = Array.isArray(item?.steps)
    ? item.steps.map((step: any) => step?.text).filter(Boolean).join('\n')
    : String(item?.steps ?? '')
  const image = getProxiedImageUrl(item?.image)

  return {
    id: asNumber(item?.id, 0),
    category: String(item?.category ?? 'zaocan'),
    name: String(item?.name ?? ''),
    description: String(item?.description ?? ''),
    image,
    images: image ? [image] : [],
    price: asNumber(item?.price, 0),
    ingredients,
    stepsText,
    isPublished: item?.status === 'published' || item?.is_published !== false
  }
}

const createEmptyRecipe = (): RecipeItem => ({
  id: 0,
  category: 'zaocan',
  name: '',
  description: '',
  image: '',
  images: [],
  price: 18,
  ingredients: '',
  stepsText: '',
  isPublished: true
})

const RecipeScreen = () => {
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [formVisible, setFormVisible] = useState(false)
  const [form, setForm] = useState<RecipeItem>(createEmptyRecipe)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(0)

  const loadRecipes = useCallback(async () => {
    try {
      const result = await api.recipe.list({ page: 1, limit: 100 })
      const data = pickData<any>(result, {})
      const list = pickList(data, ['recipes'])
      setRecipes(list.map(normalizeRecipe))
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      setRecipes([])
    }
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const filteredRecipes = useMemo(() => {
    const key = keyword.trim().toLowerCase()
    return recipes.filter(item => {
      const categoryOk = activeCategory === 'all' || item.category === activeCategory
      const keywordOk = !key || item.name.toLowerCase().includes(key)
      return categoryOk && keywordOk
    })
  }, [activeCategory, keyword, recipes])

  const updateForm = (patch: Partial<RecipeItem>) => {
    setForm(prev => ({ ...prev, ...patch }))
  }

  const openCreate = () => {
    setForm(createEmptyRecipe())
    setFormVisible(true)
  }

  const openEdit = (item: RecipeItem) => {
    setForm({ ...item, images: item.images.length ? item.images : (item.image ? [item.image] : []) })
    setFormVisible(true)
  }

  const pickAndUploadImages = async () => {
    const remain = 4 - form.images.length
    if (remain <= 0) return

    Taro.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const localPaths = res.tempFilePaths
        updateForm({ images: [...form.images, ...localPaths].slice(0, 4), image: form.image || localPaths[0] })

        for (const tempFilePath of localPaths) {
          try {
            const url = await uploadTempFileToQiniuProxy(tempFilePath, 'recipes')
            setForm(prev => {
              const withoutLocal = prev.images.filter(img => img !== tempFilePath)
              const images = [...withoutLocal, url].slice(0, 4)
              return { ...prev, images, image: images[0] || '' }
            })
          } catch (error: any) {
            Taro.showToast({ title: error.message || '上传图片失败', icon: 'none' })
          }
        }
      }
    })
  }

  const removeImage = (index: number) => {
    const images = form.images.filter((_, i) => i !== index)
    updateForm({ images, image: images[0] || '' })
  }

  const saveRecipe = async (asDraft = false) => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.images[0] || form.image,
        price: form.price,
        ingredients: form.ingredients
          .split(/[，,、\n]/)
          .map(name => ({ name: name.trim() }))
          .filter(item => item.name),
        steps: form.stepsText
          .split(/\n/)
          .map(text => ({ text: text.trim() }))
          .filter(item => item.text),
        nutrition: {},
        status: asDraft || !form.isPublished ? 'draft' : 'published'
      }

      if (form.id > 0) {
        await api.recipe.update(form.id, payload)
      } else {
        await api.recipe.create(payload)
      }
      Taro.showToast({ title: asDraft ? '草稿已保存' : '发布成功', icon: 'success' })
      setFormVisible(false)
      await loadRecipes()
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const deleteRecipe = (item: RecipeItem) => {
    Taro.showModal({
      title: '删除菜品',
      content: `确认删除「${item.name}」吗？`,
      success: async (res) => {
        if (!res.confirm) return
        setDeletingId(item.id)
        try {
          await api.recipe.remove(item.id)
          await loadRecipes()
        } catch (error: any) {
          Taro.showToast({ title: error.message || '删除失败', icon: 'none' })
        } finally {
          setDeletingId(0)
        }
      }
    })
  }

  const togglePublish = async (item: RecipeItem) => {
    const nextPublished = !item.isPublished
    setRecipes(prev => prev.map(recipe => (
      recipe.id === item.id ? { ...recipe, isPublished: nextPublished } : recipe
    )))
    try {
      await api.recipe.update(item.id, { status: nextPublished ? 'published' : 'draft' } as any)
    } catch (error: any) {
      setRecipes(prev => prev.map(recipe => (
        recipe.id === item.id ? { ...recipe, isPublished: item.isPublished } : recipe
      )))
      Taro.showToast({ title: error.message || '状态更新失败', icon: 'none' })
    }
  }

  const renderCategoryIcon = (icon: string) => (
    icon.includes('.') || icon.includes('/') ? <Image className="category-icon-img" src={icon} mode="aspectFit" /> : <Text className="category-grid-icon">{icon}</Text>
  )

  return (
    <View className="recipe-page">
      <View className="recipe-header">
        <View className="round-btn" onClick={() => Taro.navigateBack()}>
          <Text className="round-btn-text">‹</Text>
        </View>
        <Text className="recipe-title">菜品管理</Text>
        <View className="round-btn" onClick={openCreate}>
          <Text className="round-plus">+</Text>
        </View>
      </View>

      <View className="recipe-hero" />

      <View className="manager-panel">
        <View className="toolbar">
          <View className="search-box">
            <Text className="search-icon">⌕</Text>
            <Input className="search-input" value={keyword} placeholder="搜索菜品名称" onInput={(e) => setKeyword(e.detail.value)} />
          </View>
          <View className="filter-btn">
            <Text className="filter-text">筛选</Text>
            <Text className="filter-icon">⌯</Text>
          </View>
        </View>

        <View className="manager-body">
          <ScrollView className="category-sidebar" scrollY>
            {categoryOptions.map(item => (
              <View
                key={item.key}
                className={`category-item ${activeCategory === item.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(item.key)}
              >
                {renderCategoryIcon(item.icon)}
                <Text className="category-name">{item.name}</Text>
              </View>
            ))}
          </ScrollView>

          <ScrollView className="dish-list" scrollY>
            {filteredRecipes.map(item => (
              <View key={item.id} className="dish-card">
                <View className={`status-badge ${item.isPublished ? 'published' : 'draft'}`}>
                  <Text>{item.isPublished ? '上架' : '下架'}</Text>
                </View>
                <Image className="dish-image" src={item.image || zaocanIcon} mode="aspectFill" onClick={() => openEdit(item)} />
                <View className="dish-main" onClick={() => openEdit(item)}>
                  <Text className="dish-name">{item.name}</Text>
                  <Text className="dish-desc">{item.description || '经典搭配，香气满满'}</Text>
                  <Text className="dish-price">{item.price} 爱心币</Text>
                </View>
                <View className={`switch ${item.isPublished ? 'on' : ''}`} onClick={() => togglePublish(item)}>
                  <View className="switch-dot" />
                </View>
                <View className="card-actions">
                  <Text className="delete-text" onClick={() => deleteRecipe(item)}>{deletingId === item.id ? '删除中' : '删除'}</Text>
                </View>
              </View>

            ))}
            {filteredRecipes.length === 0 && (
              <View className="empty-wrap">
                <Text className="empty-text">暂无菜品</Text>
              </View>
            )}
          </ScrollView>
        </View>

      </View>

      {formVisible && (
        <View className="publish-page">
          <View className="publish-header">
            <View className="round-btn" onClick={() => setFormVisible(false)}>
              <Text className="round-btn-text">‹</Text>
            </View>
            <Text className="recipe-title">发布菜品</Text>
            <Text className="draft-link" onClick={() => saveRecipe(true)}>{saving ? '保存中' : '保存草稿'}</Text>
          </View>

          <ScrollView className="publish-scroll" scrollY>
            <View className="publish-hero" />
            <View className="form-card">
              <View className="field">
                <Text className="field-title">✿ 菜品名称 <Text className="required">*</Text></Text>
                <View className="text-input-wrap">
                  <Input className="form-input" value={form.name} maxlength={20} placeholder="请输入菜品名称，如：牛肉裸条" onInput={(e) => updateForm({ name: e.detail.value })} />
                  <Text className="counter">{form.name.length}/20</Text>
                </View>
              </View>

              <View className="field">
                <Text className="field-title">▣ 菜品描述 <Text className="required">*</Text></Text>
                <View className="textarea-wrap">
                  <Textarea className="form-textarea" value={form.description} maxlength={60} placeholder="简单描述这道菜的特色、口感、食材等..." onInput={(e) => updateForm({ description: e.detail.value })} />
                  <Text className="counter textarea-counter">{form.description.length}/60</Text>
                </View>
              </View>

              <View className="field">
                <Text className="field-title">♡ 菜品分类 <Text className="required">*</Text></Text>
                <View className="category-grid">
                  {formCategories.map(item => (
                    <View key={item.key} className={`form-category ${form.category === item.key ? 'active' : ''}`} onClick={() => updateForm({ category: item.key })}>
                      <Image className="form-category-icon" src={item.icon} mode="aspectFit" />
                      <Text>{item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="field price-field">
                <Text className="field-title">💗 爱心币价格 <Text className="required">*</Text></Text>
                <View className="price-row">
                  <View className="price-stepper">
                    <View className="step-btn" onClick={() => updateForm({ price: Math.max(0, form.price - 1) })}><Text>-</Text></View>
                    <Text className="price-num">{form.price}</Text>
                    <View className="step-btn" onClick={() => updateForm({ price: form.price + 1 })}><Text>+</Text></View>
                  </View>
                  <View className="preset-box">
                    <Text className="preset-title">推荐价格</Text>
                    <View className="preset-row">
                      {pricePresets.map(price => (
                        <View key={price} className="preset-btn" onClick={() => updateForm({ price })}><Text>{price}</Text></View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              <View className="field">
                <Text className="field-title">▣ 菜品图片 <Text className="required">*</Text></Text>
                <View className="upload-row">
                  <View className="upload-box" onClick={pickAndUploadImages}>
                    <Text className="camera-icon">▣</Text>
                    <Text className="upload-main">上传菜品图片</Text>
                    <Text className="upload-sub">建议尺寸 800x800</Text>
                  </View>
                  {form.images.map((image, index) => (
                    <View key={`${image}-${index}`} className="preview-wrap">
                      <Image className="preview-img" src={image} mode="aspectFill" />
                      <View className="remove-img" onClick={() => removeImage(index)}><Text>×</Text></View>
                    </View>
                  ))}
                </View>
                <Text className="upload-tip">* 最多上传4张图片</Text>
              </View>

              <View className="field">
                <Text className="field-title">⌁ 食材清单 <Text className="optional">（选填）</Text></Text>
                <View className="text-input-wrap">
                  <Input className="form-input" value={form.ingredients} maxlength={50} placeholder="请输入主要食材，用逗号分隔，如：牛肉、米粉、葱、蒜" onInput={(e) => updateForm({ ingredients: e.detail.value })} />
                  <Text className="counter">{form.ingredients.length}/50</Text>
                </View>
              </View>

              <View className="field">
                <Text className="field-title">☑ 制作步骤 <Text className="optional">（选填）</Text></Text>
                <View className="text-input-wrap">
                  <Input className="form-input" value={form.stepsText} maxlength={200} placeholder="请输入制作步骤，帮助更好了解这道菜..." onInput={(e) => updateForm({ stepsText: e.detail.value })} />
                  <Text className="counter">{form.stepsText.length}/200</Text>
                </View>
              </View>

              <View className="status-row">
                <Text className="field-title">⚙ 状态设置</Text>
                <View className="radio-item" onClick={() => updateForm({ isPublished: true })}>
                  <View className={`radio-dot ${form.isPublished ? 'active' : ''}`} />
                  <Text>立即上架</Text>
                </View>
                <View className="radio-item" onClick={() => updateForm({ isPublished: false })}>
                  <View className={`radio-dot ${!form.isPublished ? 'active' : ''}`} />
                  <Text>暂不上架</Text>
                </View>
              </View>
            </View>

            <View className="publish-btn" onClick={() => saveRecipe(false)}>
              <Text>{saving ? '发布中...' : '发布菜品'}</Text>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

export default RecipeScreen
