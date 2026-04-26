import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../../utils/api'
import './index.scss'

const T = {
  title: '大厨入驻',
  nickname: '昵称',
  specialty: '擅长菜品',
  description: '个人简介',
  submit: '提交申请',
  cancel: '取消',
  success: '申请提交成功',
  fail: '提交失败'
}

const ChefSubmissionScreen = () => {
  const [nickname, setNickname] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!specialty.trim()) {
      Taro.showToast({ title: '请输入擅长菜品', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      await api.family.updateRole({ family_id: 1, role: 'chef' })
      Taro.showToast({ title: T.success, icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.fail, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="chef-submission-container">
      <View className="header">
        <Text className="header-title">{T.title}</Text>
      </View>

      <ScrollView className="scroll-content" scrollY>
        <View className="form-section">
          <View className="info-card">
            <Text className="info-icon">👨🍳</Text>
            <Text className="info-title">成为大厨</Text>
            <Text className="info-desc">提交申请后，管理员会进行审核，审核通过后即可成为大厨</Text>
          </View>

          <View className="form-group">
            <Text className="form-label">{T.nickname}</Text>
            <Input
              placeholder="请输入您的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">{T.specialty}</Text>
            <Input
              placeholder="例如：川菜、粤菜、甜点等"
              value={specialty}
              onChange={(e) => setSpecialty(e.detail.value)}
              className="form-input"
            />
          </View>

          <View className="form-group">
            <Text className="form-label">{T.description}</Text>
            <Input
              placeholder="简单介绍一下您的厨艺经验..."
              value={description}
              onChange={(e) => setDescription(e.detail.value)}
              className="form-input textarea"
            />
          </View>
        </View>
      </ScrollView>

      <View className="bottom-bar">
        <View className="btn-secondary" onClick={() => Taro.navigateBack()}>
          <Text className="btn-text">{T.cancel}</Text>
        </View>
        <View className={`btn-primary ${submitting ? 'disabled' : ''}`} onClick={handleSubmit}>
          <Text className="btn-text">{submitting ? '提交中...' : T.submit}</Text>
        </View>
      </View>
    </View>
  )
}

export default ChefSubmissionScreen

