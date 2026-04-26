﻿﻿﻿import { useState } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUser } from '../../context/UserContext'
import './index.scss'

const T = {
  title: '美食&生活',
  slogan: '发现美味 · 记录生活 · 分享幸福',
  username: '请输入用户名',
  password: '请输入密码',
  confirmPwd: '请确认密码',
  nickname: '请输入昵称',
  login: '登录',
  register: '注册',
  loading: '处理中...',
  otherLogin: '或使用其他方式登录',
  chef: '大厨',
  foodie: '吃货',
  tip: '提示',
  fill: '请填写完整信息',
  success: '操作成功',
  successTitle: '成功',
  error: '错误',
  fail: '操作失败',
  pwdNotMatch: '两次输入的密码不一致',
  haveAccount: '已有账号？',
  noAccount: '还没有账号？',
  loginNow: '立即登录',
  registerNow: '立即注册'
}

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'chef' | 'foodie'>('foodie')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPwdVisible, setConfirmPwdVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register, user } = useUser()

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Taro.showToast({ title: T.fill, icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        const redirectUrl = '/pages/home/index'
        Taro.reLaunch({ url: redirectUrl })
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!username.trim() || !password || !confirmPwd) {
      Taro.showToast({ title: T.fill, icon: 'none' })
      return
    }

    if (password !== confirmPwd) {
      Taro.showToast({ title: T.pwdNotMatch, icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await register(username.trim(), password, role, nickname.trim())
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        setIsLogin(true)
        setPassword('')
        setConfirmPwd('')
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '注册失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setUsername('')
    setPassword('')
    setConfirmPwd('')
    setNickname('')
  }

  return (
    <View className="auth-container">
      
      <Image className="bg-image" src={require('../../assets/loginBg.png')} mode="aspectFill" />
      
      <View className="auth-header">
        <Text className="title">{T.title}</Text>
        <Text className="slogan">{T.slogan}</Text>
      </View>

      <View className="cards-container">
        {/* 登录卡片 */}
        <View className={`auth-card login-card ${isLogin ? 'active' : 'inactive'}`}>
          
          <View className="input-group">
            <View className="input-wrap">
              <View className="input-icon">
                <Image src={require('../../assets/account.png')} className="icon-image" mode="aspectFit" />
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
                <Image src={require('../../assets/password.png')} className="icon-image" mode="aspectFit" />
              </View>
              <Input
                placeholder={T.password}
                value={password}
                onInput={e => setPassword(e.detail.value)}
                password={!passwordVisible}
                className="input-field"
                placeholderClass="input-placeholder"
              />
              <View
                className="input-toggle"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                <Image 
                  src={passwordVisible ? require('../../assets/eye close-fill.png') : require('../../assets/eye-fill.png')} 
                  className="eye-icon" 
                  mode="aspectFit" 
                />
              </View>
            </View>
          </View>

          <Button
            className="submit-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            <Text className="btn-text">{loading ? T.loading : T.login}</Text>
            <Text className="btn-arrow">→</Text>
          </Button>
          <View className="social-login">
            <Button className="social-btn wechat" onClick={() => Taro.showToast({ title: '微信登录开发中', icon: 'none' })}>
              <Image src={require('../../assets/wechat.png')} className="social-icon-image" mode="aspectFit" />
            </Button>
            <Button className="social-btn phone" onClick={() => Taro.showToast({ title: '手机登录开发中', icon: 'none' })}>
              <Image src={require('../../assets/phone.png')} className="social-icon-image" mode="aspectFit" />
            </Button>
            <Button className="social-btn email" onClick={() => Taro.showToast({ title: '邮箱登录开发中', icon: 'none' })}>
              <Image src={require('../../assets/email.png')} className="social-icon-image" mode="aspectFit" />
            </Button>
          </View>

          <View className="switch-link" onClick={toggleMode}>
            <Text className="switch-text">{T.noAccount}</Text>
            <Text className="switch-btn">{T.registerNow}</Text>
            <Text className="arrow">→</Text>
          </View>
        </View>

        {/* 注册卡片 */}
        <View className={`auth-card register-card ${!isLogin ? 'active' : 'inactive'}`}>

          <View className="input-group">
            <View className="input-wrap">
              <View className="input-icon">
                <Image src={require('../../assets/account.png')} className="icon-image" mode="aspectFit" />
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
                <Image src={require('../../assets/email.png')} className="icon-image" mode="aspectFit" />
              </View>
              <Input
                placeholder={T.nickname}
                value={nickname}
                onInput={e => setNickname(e.detail.value)}
                className="input-field"
                placeholderClass="input-placeholder"
              />
            </View>
          </View>

          <View className="input-group">
            <View className="input-wrap">
              <View className="input-icon">
                <Image src={require('../../assets/password.png')} className="icon-image" mode="aspectFit" />
              </View>
              <Input
                placeholder={T.password}
                value={password}
                onInput={e => setPassword(e.detail.value)}
                password={!passwordVisible}
                className="input-field"
                placeholderClass="input-placeholder"
              />
              <View
                className="input-toggle"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                <Image 
                  src={passwordVisible ? require('../../assets/eye close-fill.png') : require('../../assets/eye-fill.png')} 
                  className="eye-icon" 
                  mode="aspectFit" 
                />
              </View>
            </View>
          </View>

          <View className="input-group">
            <View className="input-wrap">
              <View className="input-icon">
                <Image src={require('../../assets/password.png')} className="icon-image" mode="aspectFit" />
              </View>
              <Input
                placeholder={T.confirmPwd}
                value={confirmPwd}
                onInput={e => setConfirmPwd(e.detail.value)}
                password={!confirmPwdVisible}
                className="input-field"
                placeholderClass="input-placeholder"
              />
              <View
                className="input-toggle"
                onClick={() => setConfirmPwdVisible(!confirmPwdVisible)}
              >
                <Image 
                  src={confirmPwdVisible ? require('../../assets/eye close-fill.png') : require('../../assets/eye-fill.png')} 
                  className="eye-icon" 
                  mode="aspectFit" 
                />
              </View>
            </View>
          </View>

          <View className="role-group">
            <Text className="role-label">选择身份</Text>
            <View className="role-options">
              <Button
                className={`role-btn ${role === 'foodie' ? 'active' : ''}`}
                onClick={() => setRole('foodie')}
              >
                {T.foodie}
              </Button>
              <Button
                className={`role-btn ${role === 'chef' ? 'active' : ''}`}
                onClick={() => setRole('chef')}
              >
                {T.chef}
              </Button>
            </View>
          </View>

          <Button
            className="submit-btn"
            onClick={handleRegister}
            disabled={loading}
          >
            <Text className="btn-text">{loading ? T.loading : T.register}</Text>
            <Text className="btn-arrow">→</Text>
          </Button>

          <View className="switch-link" onClick={toggleMode}>
            <Text className="switch-text">{T.haveAccount}</Text>
            <Text className="switch-btn">{T.loginNow}</Text>
            <Text className="arrow">→</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default AuthScreen
