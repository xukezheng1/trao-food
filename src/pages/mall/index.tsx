import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  title: '商城',
  search: '搜索商品',
  noProducts: '暂无商品',
  buy: '购买',
  sold: '已售',
  stock: '库存'
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  image?: string
  stock: number
  sales: number
}

const toProduct = (item: any): Product => ({
  id: asNumber(item?.id, 0),
  name: String(item?.name ?? '未知商品'),
  description: String(item?.description ?? ''),
  price: asNumber(item?.price, 0),
  image: item?.image,
  stock: asNumber(item?.stock ?? 10, 10),
  sales: asNumber(item?.sales ?? item?.sold_count ?? 0)
})

const MallScreen = () => {
  const [searchText, setSearchText] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadProducts = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await api.mall.products()
      const list = pickList(result, ['products', 'data']).map(toProduct)
      setProducts(list)
    } catch (err) {
      console.error('Load products error:', err)
      setProducts([])
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleBuy = async (productId: number) => {
    try {
      await api.mall.createOrder({ product_id: productId, quantity: 1 })
      Taro.showToast({ title: '购买成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '购买失败', icon: 'none' })
    }
  }

  const goToDetail = (productId: number) => {
    Taro.navigateTo({ url: `/mallPackage/pages/productPublish/index?productId=${productId}` })
  }

  const filteredProducts = products.filter((product) => {
    if (!searchText.trim()) return true
    const keyword = searchText.trim().toLowerCase()
    return product.name.toLowerCase().includes(keyword) || product.description.toLowerCase().includes(keyword)
  })

  return (
    <View className="mall-container">
      <View className="header">
        <View className="search-bar">
          <Text className="search-icon">🔍</Text>
          <Input
            placeholder={T.search}
            value={searchText}
            onChange={(e) => setSearchText(e.detail.value)}
            className="search-input"
          />
        </View>
      </View>

      <ScrollView className="scroll-content" scrollY>
        {filteredProducts.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🛒</Text>
            <Text className="empty-text">{T.noProducts}</Text>
          </View>
        ) : (
          <View className="products-grid">
            {filteredProducts.map((product) => (
              <View key={product.id} className="product-card" onClick={() => goToDetail(product.id)}>
                <View className="product-image-wrapper">
                  {product.image ? (
                    <Image src={product.image} className="product-image" />
                  ) : (
                    <View className="product-image-placeholder">
                      <Text className="product-icon">📦</Text>
                    </View>
                  )}
                </View>
                <View className="product-info">
                  <Text className="product-name">{product.name}</Text>
                  <Text className="product-desc">{product.description}</Text>
                  <View className="product-bottom">
                    <View className="product-price-section">
                      <Text className="product-price">¥{product.price}</Text>
                      <Text className="product-sales">{T.sold} {product.sales}</Text>
                    </View>
                    <View className="buy-btn" onClick={(e: any) => {
                      e.stopPropagation()
                      handleBuy(product.id)
                    }}>
                      <Text className="buy-btn-text">{T.buy}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CustomTabBar />
    </View>
  )
}

export default MallScreen
