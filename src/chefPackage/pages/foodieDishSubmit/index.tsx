import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, ScrollView, Image, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { chooseAndUploadImage } from '../../../utils/upload'
import { asNumber } from '../../../utils/response'
import './index.scss'

const T = {
  title: '上传菜品',
  selectChef: '选择大厨',
  chefPlaceholder: '请选择要关联的大厨',
  dishName: '菜品名称',
  dishNamePlaceholder: '请输入菜品名称',
  dishImage: '菜品图片',
  uploadImage: '上传图片',
  changeImage: '更换图片',
  category: '菜品分类',
  categoryPlaceholder: '例如：川菜、粤菜、家常菜',
  description: '菜品描述',
  descriptionPlaceholder: '简单描述一下这道菜品...',
  price: '价格',
  pricePlaceholder: '请输入价格',
  submit: '提交',
  submitting: '提交中...',
  success: '上传成功',
  fail: '上传失败',
  required: '请填写完整信息',
  selectChefRequired: '请选择大厨',
  uploadImageRequired: '请上传菜品图片',
  noChefs: '暂无可用大厨',
  cancel: '取消',
  confirm: '确定'
}

interface Chef {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

interface DishForm {
  name: string
  image: string
  category: string
  description: string
  price: string
  chef_id: number | null
}

const FoodieDishSubmit = () => {
  const router = useRouter()
  const [chefs, setChefs] = useState<Chef[]>([])
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null)
  const [showChefSelector, setShowChefSelector] = useState(false)
  const [form, setForm] = useState<DishForm>({
    name: '',
    image: '',
    category: '',
    description: '',
    price: '',
    chef_id: null
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 从URL参数中预选中大厨
  useEffect(() => {
    const params = router.params as Record<string, string>
    const preselectedChefId = asNumber(params?.chefId, 0)
    const preselectedChefName = params?.chefName ? decodeURIComponent(params.chefName) : ''
    const preselectedChefAvatar = params?.chefAvatar ? decodeURIComponent(params.chefAvatar) : ''

    if (preselectedChefId > 0) {
      const preselectedChef: Chef = {
        id: preselectedChefId,
        username: preselectedChefName,
        nickname: preselectedChefName,
        avatar: preselectedChefAvatar
      }
      setSelectedChef(preselectedChef)
      setForm(prev => ({ ...prev, chef_id: preselectedChefId }))
    }
  }, [router.params])

  // 加载大厨列表
  const loadChefs = useCallback(async () => {
    try {
      const result = await api.order.chefs()
      if (result.success && Array.isArray(result.data)) {
        setChefs(result.data)
      }
    } catch (error) {
      console.error('Failed to load chefs:', error)
    }
  }, [])

  useEffect(() => {
    loadChefs()
  }, [loadChefs])

  // 上传图片
  const handleUploadImage = async () => {
    try {
      setUploading(true)
      const imageUrl = await chooseAndUploadImage('dishes')
      setForm(prev => ({ ...prev, image: imageUrl }))
    } catch (error: any) {
      Taro.showToast({ title: error?.message || '上传失败', icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  // 选择大厨
  const handleSelectChef = (chef: Chef) => {
    setSelectedChef(chef)
    setForm(prev => ({ ...prev, chef_id: chef.id }))
    setShowChefSelector(false)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!form.chef_id) {
      Taro.showToast({ title: T.selectChefRequired, icon: 'none' })
      return
    }
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!form.image) {
      Taro.showToast({ title: T.uploadImageRequired, icon: 'none' })
      return
    }
    if (!form.price.trim() || isNaN(Number(form.price))) {
      Taro.showToast({ title: '请输入有效的价格', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const result = await api.order.createDish({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image,
        category_id: undefined, // 如果需要分类ID，可以后续添加
        chef_id: form.chef_id! // 关联所选大厨
      })

      if (result.success) {
        Taro.showToast({ title: T.success, icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        throw new Error(result.message || T.fail)
      }
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="foodie-dish-submit-container">
      {/* 头部 */}
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="form-section">
          {/* 选择大厨 */}
          <View className="form-group">
            <Text className="form-label required">{T.selectChef}</Text>
            <View 
              className="chef-selector-trigger"
              onClick={() => setShowChefSelector(true)}
            >
              {selectedChef ? (
                <View className="selected-chef">
                  {selectedChef.avatar ? (
                    <Image src={selectedChef.avatar} className="selected-chef-avatar" mode="aspectFill" />
                  ) : (
                    <View className="selected-chef-avatar placeholder">
                      <Text className="chef-icon">👨‍🍳</Text>
                    </View>
                  )}
                  <Text className="selected-chef-name">
                    {selectedChef.nickname || selectedChef.username}
                  </Text>
                </View>
              ) : (
                <Text className="placeholder-text">{T.chefPlaceholder}</Text>
              )}
              <Text className="arrow-icon">›</Text>
            </View>
          </View>

          {/* 菜品名称 */}
          <View className="form-group">
            <Text className="form-label required">{T.dishName}</Text>
            <Input
              placeholder={T.dishNamePlaceholder}
              value={form.name}
              onInput={(e) => setForm(prev => ({ ...prev, name: e.detail.value }))}
              className="form-input"
            />
          </View>

          {/* 菜品图片 */}
          <View className="form-group">
            <Text className="form-label required">{T.dishImage}</Text>
            <View className="image-upload-section">
              {form.image ? (
                <View className="image-preview-wrapper">
                  <Image src={form.image} className="image-preview" mode="aspectFill" />
                  <View className="image-overlay" onClick={handleUploadImage}>
                    <Text className="overlay-text">{T.changeImage}</Text>
                  </View>
                </View>
              ) : (
                <View 
                  className={`upload-placeholder ${uploading ? 'uploading' : ''}`}
                  onClick={handleUploadImage}
                >
                  <Text className="upload-icon">📷</Text>
                  <Text className="upload-text">
                    {uploading ? '上传中...' : T.uploadImage}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 菜品分类 */}
          <View className="form-group">
            <Text className="form-label">{T.category}</Text>
            <Input
              placeholder={T.categoryPlaceholder}
              value={form.category}
              onInput={(e) => setForm(prev => ({ ...prev, category: e.detail.value }))}
              className="form-input"
            />
          </View>

          {/* 菜品描述 */}
          <View className="form-group">
            <Text className="form-label">{T.description}</Text>
            <Textarea
              placeholder={T.descriptionPlaceholder}
              value={form.description}
              onInput={(e) => setForm(prev => ({ ...prev, description: e.detail.value }))}
              className="form-textarea"
              maxlength={200}
            />
            <Text className="char-count">{form.description.length}/200</Text>
          </View>

          {/* 价格 */}
          <View className="form-group">
            <Text className="form-label required">{T.price}</Text>
            <View className="price-input-wrapper">
              <Text className="currency">¥</Text>
              <Input
                placeholder={T.pricePlaceholder}
                value={form.price}
                type="digit"
                onInput={(e) => setForm(prev => ({ ...prev, price: e.detail.value }))}
                className="form-input price-input"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部提交按钮 */}
      <View className="bottom-bar">
        <View className="btn-secondary" onClick={() => Taro.navigateBack()}>
          <Text className="btn-text">{T.cancel}</Text>
        </View>
        <View 
          className={`btn-primary ${submitting ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className="btn-text">
            {submitting ? T.submitting : T.submit}
          </Text>
        </View>
      </View>

      {/* 大厨选择弹窗 */}
      {showChefSelector && (
        <View className="modal-overlay" onClick={() => setShowChefSelector(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">{T.selectChef}</Text>
              <Text className="modal-close" onClick={() => setShowChefSelector(false)}>✕</Text>
            </View>
            <ScrollView className="chef-list" scrollY>
              {chefs.length === 0 ? (
                <View className="empty-state">
                  <Text className="empty-text">{T.noChefs}</Text>
                </View>
              ) : (
                chefs.map(chef => (
                  <View 
                    key={chef.id}
                    className={`chef-item ${selectedChef?.id === chef.id ? 'selected' : ''}`}
                    onClick={() => handleSelectChef(chef)}
                  >
                    {chef.avatar ? (
                      <Image src={chef.avatar} className="chef-avatar" mode="aspectFill" />
                    ) : (
                      <View className="chef-avatar placeholder">
                        <Text className="chef-icon">👨‍🍳</Text>
                      </View>
                    )}
                    <View className="chef-info">
                      <Text className="chef-name">
                        {chef.nickname || chef.username}
                      </Text>
                    </View>
                    {selectedChef?.id === chef.id && (
                      <Text className="check-icon">✓</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default FoodieDishSubmit



