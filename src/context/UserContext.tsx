import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import api from '../utils/api'
import { storage } from '../utils/storage'

interface User {
  id: number | null
  username: string
  nickname: string
  avatar: string
  token: string
  balance: number
  role: 'chef' | 'foodie'
}

interface UserContextType {
  user: User
  isLogin: boolean
  authReady: boolean
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    password: string,
    role: 'chef' | 'foodie',
    nickname?: string
  ) => Promise<void>
  logout: () => void
  setRole: (role: 'chef' | 'foodie') => void
  fetchProfile: () => Promise<void>
  fetchBalance: () => Promise<void>
  checkAuth: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    id: null,
    username: '',
    nickname: '',
    avatar: '',
    token: '',
    balance: 0,
    role: 'foodie'
  })
  const [authReady, setAuthReady] = useState(false)

  const isLogin = !!user.token
  const normalizeRole = (value: any): 'chef' | 'foodie' => (value === 'chef' ? 'chef' : 'foodie')

  const logout = useCallback(() => {
    setUser({
      id: null,
      username: '',
      nickname: '',
      avatar: '',
      token: '',
      balance: 0,
      role: 'foodie'
    })
    storage.removeItem('token')
    storage.removeItem('user_info')
    storage.removeItem('user_role')
    setAuthReady(true)
  }, [])

  const setRole = useCallback((role: 'chef' | 'foodie') => {
    setUser(prev => ({ ...prev, role }))
  }, [])

  const fetchProfile = useCallback(async () => {
    const result = await api.user.profile()
    const {
      id: userId,
      username: userUsername,
      nickname: userNickname,
      avatar: userAvatar,
      role: userRole,
      family_role: familyRole,
      user_role: aliasRole
    } = result.data

    const newRole = normalizeRole(userRole ?? familyRole ?? aliasRole ?? 'foodie')

    setUser(prev => {
      const updatedUser = {
        ...prev,
        id: userId,
        username: userUsername,
        nickname: userNickname,
        avatar: userAvatar,
        role: newRole
      }
      // 更新storage中的用户信息
      storage.setItem('user_info', JSON.stringify(updatedUser))
      storage.setItem('user_role', newRole)
      return updatedUser
    })
  }, [])

  const fetchBalance = useCallback(async () => {
    try {
      const result = await api.wallet.balance()
      setUser(prev => ({ ...prev, balance: result.data.balance }))
    } catch {
      setUser(prev => ({ ...prev, balance: 0 }))
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const storedToken = storage.getItem('token')
      const storedUser = storage.getItem('user_info')
      const storedRole = storage.getItem('user_role')

      if (storedToken && storedUser) {
        try {
          const userInfo = JSON.parse(storedUser)
          setUser({
            id: userInfo.id || null,
            username: userInfo.username || '',
            nickname: userInfo.nickname || '',
            avatar: userInfo.avatar || '',
            token: storedToken,
            balance: userInfo.balance || 0,
            role: storedRole ? normalizeRole(storedRole) : normalizeRole(userInfo.role)
          })
          // 异步刷新用户信息和余额
          fetchProfile().catch(() => {})
          fetchBalance().catch(() => {})
        } catch {
          // 解析失败，尝试用token获取
          try {
            await fetchProfile()
            await fetchBalance()
          } catch {
            logout()
          }
        }
      } else if (storedToken) {
        // 只有token没有用户信息，尝试获取
        try {
          await fetchProfile()
          await fetchBalance()
        } catch {
          logout()
        }
      }
    } finally {
      setAuthReady(true)
    }
  }, [fetchBalance, fetchProfile, logout])

  const login = async (username: string, password: string) => {
    const result = await api.user.login({ username, password })
    const {
      id: userId,
      username: userUsername,
      nickname: userNickname,
      avatar: userAvatar,
      token: userToken,
      role: userRole,
      family_role: familyRole,
      user_role: aliasRole
    } = result.data

    const finalRole = normalizeRole(userRole ?? familyRole ?? aliasRole)

    const userData = {
      id: userId,
      username: userUsername,
      nickname: userNickname,
      avatar: userAvatar,
      token: userToken,
      balance: 0,
      role: finalRole
    }

    setUser(userData)

    // 存储用户信息和token
    storage.setItem('token', userToken)
    storage.setItem('user_info', JSON.stringify(userData))
    storage.setItem('user_role', finalRole)
    await fetchBalance()
    setAuthReady(true)
  }

  const register = async (
    username: string,
    password: string,
    role: 'chef' | 'foodie',
    nickname?: string
  ) => {
    await api.user.register({ username, password, nickname, role })
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <UserContext.Provider
      value={{
        user,
        isLogin,
        authReady,
        login,
        register,
        logout,
        setRole,
        fetchProfile,
        fetchBalance,
        checkAuth
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
