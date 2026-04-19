import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  title: '记账',
  addRecord: '添加记录',
  amount: '金额',
  category: '分类',
  description: '备注',
  submit: '保存',
  cancel: '取消',
  noRecords: '暂无记录',
  total: '本月总计',
  today: '今日',
  week: '本周',
  month: '本月'
}

interface Category {
  id: number
  name: string
  icon: string
  color: string
}

interface Record {
  id: number
  amount: number
  category_id: number
  category_name: string
  description: string
  expense_date: string
}

const toCategory = (item: any): Category => ({
  id: asNumber(item?.id, 0),
  name: String(item?.name ?? '其他'),
  icon: String(item?.icon ?? '💰'),
  color: String(item?.color ?? '#D9465F')
})

const toRecord = (item: any): Record => ({
  id: asNumber(item?.id, 0),
  amount: asNumber(item?.amount, 0),
  category_id: asNumber(item?.category_id ?? item?.categoryId, 0),
  category_name: String(item?.category?.name ?? item?.category_name ?? '其他'),
  description: String(item?.description ?? ''),
  expense_date: String(item?.expense_date ?? item?.createTime ?? new Date().toLocaleDateString())
})

const ExpenseScreen = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [monthTotal, setMonthTotal] = useState(0)

  const loadCategories = useCallback(async () => {
    try {
      const result = await api.expense.categories()
      const list = pickList(result, ['categories', 'data']).map(toCategory)
      setCategories(list)
    } catch (err) {
      console.error('Load categories error:', err)
      setCategories([])
    }
  }, [])

  const loadRecords = useCallback(async () => {
    try {
      const result = await api.expense.records()
      const list = pickList(result, ['records', 'data']).map(toRecord)
      setRecords(list)
      
      const statsResult = await api.expense.stats()
      setMonthTotal(asNumber(pickList(statsResult, ['total'])?.[0]?.total ?? statsResult?.data?.total, 0))
    } catch (err) {
      console.error('Load records error:', err)
      setRecords([])
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadRecords()
  }, [loadCategories, loadRecords])

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!selectedCategory) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    try {
      await api.expense.createRecord({
        amount: parseFloat(amount),
        category_id: selectedCategory,
        description: description.trim() || undefined
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setShowAddModal(false)
      setAmount('')
      setSelectedCategory(null)
      setDescription('')
      loadRecords()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '保存失败', icon: 'none' })
    }
  }

  const handleDelete = async (recordId: number) => {
    Taro.showModal({
      title: '删除记录',
      content: '确定删除这条记录吗？',
      confirmColor: '#EA4C73',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.expense.deleteRecord(recordId)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            loadRecords()
          } catch (err: any) {
            Taro.showToast({ title: err?.message || '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  return (
    <View className="expense-container">
      <View className="header">
        <View className="total-card">
          <Text className="total-label">{T.total}</Text>
          <Text className="total-amount">¥{monthTotal.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="section">
          <View className="section-header">
            <Text className="section-title">快捷分类</Text>
          </View>
          <View className="categories-grid">
            {categories.map((cat) => (
              <View
                key={cat.id}
                className={`category-item ${selectedCategory === cat.id ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Text className="category-icon">{cat.icon}</Text>
                <Text className="category-name">{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="section">
          <View className="section-header">
            <Text className="section-title">消费记录</Text>
            <View className="add-btn" onClick={() => setShowAddModal(true)}>
              <Text className="add-icon">➕</Text>
              <Text className="add-text">{T.addRecord}</Text>
            </View>
          </View>

          {records.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">📝</Text>
              <Text className="empty-text">{T.noRecords}</Text>
            </View>
          ) : (
            <View className="records-list">
              {records.map((record) => (
                <View key={record.id} className="record-card">
                  <View className="record-left">
                    <View className="record-icon">💰</View>
                    <View className="record-info">
                      <Text className="record-category">{record.category_name}</Text>
                      {record.description && (
                        <Text className="record-desc">{record.description}</Text>
                      )}
                    </View>
                  </View>
                  <View className="record-right">
                    <Text className="record-amount">-¥{record.amount.toFixed(2)}</Text>
                    <Text className="record-date">{record.expense_date}</Text>
                    <View className="delete-btn" onClick={() => handleDelete(record.id)}>
                      <Text className="delete-icon">🗑️</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {showAddModal && (
        <View className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{T.addRecord}</Text>

            <View className="form-group">
              <Text className="form-label">{T.amount}</Text>
              <View className="amount-input-wrap">
                <Text className="amount-symbol">¥</Text>
                <Input
                  type="digit"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.detail.value)}
                  className="amount-input"
                />
              </View>
            </View>

            <View className="form-group">
              <Text className="form-label">{T.category}</Text>
              <ScrollView className="categories-scroll" scrollX>
                <View className="categories-row">
                  {categories.map((cat) => (
                    <View
                      key={cat.id}
                      className={`category-chip ${selectedCategory === cat.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <Text className="category-chip-icon">{cat.icon}</Text>
                      <Text className="category-chip-name">{cat.name}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="form-group">
              <Text className="form-label">{T.description}</Text>
              <Input
                placeholder="添加备注..."
                value={description}
                onChange={(e) => setDescription(e.detail.value)}
                className="desc-input"
              />
            </View>

            <View className="modal-actions">
              <View className="modal-btn-secondary" onClick={() => setShowAddModal(false)}>
                <Text className="modal-btn-text">{T.cancel}</Text>
              </View>
              <View className="modal-btn-primary" onClick={handleSubmit}>
                <Text className="modal-btn-text">{T.submit}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <CustomTabBar />
    </View>
  )
}

export default ExpenseScreen
