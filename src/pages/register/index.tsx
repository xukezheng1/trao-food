import { useState } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUser } from '../../context/UserContext'
import './index.scss'

const T = {
  title: '注册',
  username: '请输入用户名',
  password: '请输入密码',
  confirmPwd: '请确认密码',
  nickname: '请输入昵称',
  register: '注册',
  loading: '注册中...',
  login: '已有账号？立即登录',
  chef: '大厨',
  foodie: '吃货',
  tip: '提示',
  fill: '请填写完整信息',
  success: '注册成功',
  successTitle: '成功',
  error: '错误',
  fail: '注册失败',
  pwdNotMatch: '两次输入的密码不一致'
}

const RegisterScreen = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'chef' | 'foodie'>('foodie')
  const [loading, setLoading] = useState(false)
  const { register } = useUser()

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
      Taro.showToast({ title: T.success, icon: 'success' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || T.fail, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="register-container">
      <View className="register-card">
        <Text className="title">{T.title}</Text>

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
              password
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
              placeholder={T.confirmPwd}
              value={confirmPwd}
              onInput={e => setConfirmPwd(e.detail.value)}
              password
              className="input-field"
              placeholderClass="input-placeholder"
            />
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
          className="register-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? T.loading : T.register}
        </Button>

        <Button className="login-btn" onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          {T.login}
        </Button>
      </View>
    </View>
  )
}

export default RegisterScreen
