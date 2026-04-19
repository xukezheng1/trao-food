﻿﻿﻿import { useState } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUser } from '../../context/UserContext'
import './index.scss'

const T = {
  title: '美食生活',
  slogan: '发现美味 · 记录生活 · 分享幸福',
  username: '请输入用户名',
  password: '请输入密码',
  login: '登录',
  loading: '登录中...',
  otherLogin: '或使用其他方式登录',
  register: '还没有账号？',
  registerLink: '立即注册',
  tip: '提示',
  fill: '请填写完整信息',
  success: '登录成功',
  successTitle: '成功',
  error: '错误',
  fail: '登录失败'
}

const LoginScreen = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, user } = useUser()

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Taro.showToast({ title: T.fill, icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      Taro.showToast({ title: T.success, icon: 'success' })
      setTimeout(() => {
        const redirectUrl = user.role === 'chef' ? '/pages/recipe/index' : '/pages/order/index'
        Taro.reLaunch({ url: redirectUrl })
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || T.fail, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-container">
      <Image className="bg-image" src="/assets/loginBg.png" mode="aspectFill" />
      
      <View className="login-header">
        <View className="logo-wrapper">
          <Text className="logo">食</Text>
          <View className="logo-decoration">
            <Text className="decoration-star">✦</Text>
            <Text className="decoration-star">✦</Text>
            <Text className="decoration-star">✦</Text>
          </View>
        </View>
        <Text className="title">{T.title}</Text>
        <Text className="slogan">{T.slogan}</Text>
      </View>

      <View className="login-card">
        <View className="input-group">
          <View className="input-wrap">
            <View className="input-icon">
              <Text className="icon-text">👤</Text>
            </View>
            <Input
              placeholder={T.username}
              value={username}
              onInput={e => setUsername(e.detail.value)}
              className="input-field"
              placeholderClass="input-placeholder"
            />
          </View>
        </View>

        <View className="input-group">
          <View className="input-wrap">
            <View className="input-icon">
              <Text className="icon-text">🔒</Text>
            </View>
            <Input
              placeholder={T.password}
              value={password}
              onInput={e => setPassword(e.detail.value)}
              password={!passwordVisible}
              className="input-field"
              placeholderClass="input-placeholder"
            />
            <Text
              className="input-toggle"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? '🙈' : '👁️'}
            </Text>
          </View>
        </View>

        <Button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          <Text className="btn-text">{loading ? T.loading : T.login}</Text>
          <Text className="btn-arrow">→</Text>
        </Button>

        <View className="other-login">
          <View className="divider"></View>
          <Text className="divider-text">{T.otherLogin}</Text>
          <View className="divider"></View>
        </View>

        <View className="social-login">
          <Button className="social-btn wechat" onClick={() => Taro.showToast({ title: '微信登录开发中', icon: 'none' })}>
            <Text className="social-icon">💚</Text>
          </Button>
          <Button className="social-btn phone" onClick={() => Taro.showToast({ title: '手机登录开发中', icon: 'none' })}>
            <Text className="social-icon">📱</Text>
          </Button>
          <Button className="social-btn email" onClick={() => Taro.showToast({ title: '邮箱登录开发中', icon: 'none' })}>
            <Text className="social-icon">📧</Text>
          </Button>
        </View>
      </View>

      <View className="register-link">
        <Text className="register-text">{T.register}</Text>
        <Text className="register-btn" onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>
          {T.registerLink}
        </Text>
        <Text className="arrow">→</Text>
      </View>
    </View>
  )
}

export default LoginScreen