import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../../utils/api'
import { asNumber, pickList } from '../../../utils/response'
import './index.scss'

const T = {
  title: '发布商品',
  editTitle: '编辑商品',
  name: '商品名称',
  description: '商品描述',
  price: '价格',
  stock: '库存',
  submit: '发布',
  update: '更新',
  cancel: '取消',
  success: '发布成功',
  updateSuccess: '更新成功',
  fail: '操作失败'
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
}

const ProductPublishScreen = () => {
  const router = useRouter()
  const [productId, setProductId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('10')

  useEffect(() => {
    const params = router.params as Record<string, string>
    if (params?.productId) {
      setProductId(parseInt(params.productId))
      loadProduct(parseInt(params.productId))
    }
  }, [router.params])

  const loadProduct = async (id: number) => {
    try {
      const result = await api.mall.product(id)
      const data = result?.data || {}
      setName(String(data?.name ?? ''))
      setDescription(String(data?.description ?? ''))
      setPrice(String(data?.price ?? ''))
      setStock(String(data?.stock ?? '10'))
    } catch (err) {
      console.error('Load product error:', err)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    if (!price || parseFloat(price) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }

    try {
      if (productId) {
        await api.mall.updateProduct(productId, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 10
        })
        Taro.showToast({ title: T.updateSuccess, icon: 'success' })
      } else {
        await api.mall.createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 10
        })
        Taro.showToast({ title: T.success, icon: 'success' })
      }
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    }
  }

  return (
    <View className="product-publish-container">
      <View className="header">
        <Text className="header-title">{productId ? T.editTitle : T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="form-section">
          <View className="form-group">
            <Text className="form-label">{T.name}</Text>
            <Input
              placeholder="请输入商品名称"
              value={name}
              onChange={(e) => setName(e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">{T.description}</Text>
            <Input
              placeholder="请输入商品描述"
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
            <Text className="form-label">{T.stock}</Text>
            <Input
              type="number"
              placeholder="10"
              value={stock}
              onChange={(e) => setStock(e.detail.value)}
              className="form-input"
            />
          </View>
        </View>
      </ScrollView>

      <View className="bottom-bar">
        <View className="btn-secondary" onClick={() => Taro.navigateBack()}>
          <Text className="btn-text">{T.cancel}</Text>
        </View>
        <View className="btn-primary" onClick={handleSubmit}>
          <Text className="btn-text">{productId ? T.update : T.submit}</Text>
        </View>
      </View>
    </View>
  )
}

export default ProductPublishScreen


