import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, Button, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '../../utils/api'
import { asNumber, pickList } from '../../utils/response'
import { useUser } from '../../context/UserContext'
import CustomTabBar from '../../components/tabBar'
import './index.scss'

const T = {
  title: '我的',
  family: '家庭管理',
  createFamily: '创建家庭',
  joinFamily: '加入家庭',
  familyName: '家庭名称',
  inviteCode: '邀请码',
  inputFamilyName: '请输入家庭名称',
  inputInviteCode: '请输入邀请码',
  confirm: '确定',
  cancel: '取消',
  createSuccess: '创建成功',
  joinSuccess: '加入成功',
  members: '家庭成员',
  addMember: '添加成员',
  username: '用户名',
  inputUsername: '请输入用户名',
  bindSuccess: '绑定成功',
  noFamily: '暂无家庭，请创建或加入',
  logout: '退出登录',
  logoutTip: '确定退出当前账号？',
  foodie: '吃货',
  chef: '大厨',
  switchRoleFailed: '切换身份失败',
  profileTitle: '个人信息',
  editNickname: '修改昵称',
  inputNickname: '请输入昵称',
  updateSuccess: '更新成功',
  updateFailed: '更新失败',
  changeAvatar: '更换头像',
  uploadFailed: '上传失败'
}

interface Family {
  id: number
  name: string
  inviteCode: string
  role: string
}

interface Member {
  id: number
  name: string
  role: string
  username: string
}

const FamilyScreen = () => {
  const [families, setFamilies] = useState<Family[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [memberUsername, setMemberUsername] = useState('')
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null)
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const { user, logout, setRole, fetchProfile, fetchBalance } = useUser()
  const isChef = user.role === 'chef'

  const loadFamilies = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await api.family.list()
      const data = pickList(result, ['families'])
      const familyList = data.map((item: any) => ({
        id: asNumber(item?.id ?? item?.family_id, 0),
        name: String(item?.name ?? '未命名家庭'),
        inviteCode: String(item?.inviteCode ?? item?.invite_code ?? ''),
        role: String(item?.role ?? 'foodie')
      })).filter((f: Family) => f.id > 0)
      setFamilies(familyList)
      
      if (familyList.length > 0 && !selectedFamilyId) {
        setSelectedFamilyId(familyList[0].id)
        loadMembers(familyList[0].id)
      }
    } catch (err) {
      console.error('加载家庭失败:', err)
    } finally {
      setRefreshing(false)
    }
  }, [selectedFamilyId])

  const loadMembers = async (familyId: number) => {
    try {
      const result = await api.family.members(familyId)
      const data = pickList(result, ['members'])
      const memberList = data.map((item: any, index: number) => ({
        id: asNumber(item?.user?.id ?? item?.user_id ?? index + 1, index + 1),
        name: String(item?.user?.nickname ?? item?.user?.username ?? item?.nickname ?? `成员${index + 1}`),
        username: String(item?.user?.username ?? item?.username ?? ''),
        role: String(item?.role ?? 'foodie') === 'chef' ? T.chef : T.foodie
      }))
      setMembers(memberList)
    } catch (err) {
      console.error('加载成员失败:', err)
      setMembers([])
    }
  }

  useEffect(() => {
    loadFamilies()
    fetchBalance()
  }, [loadFamilies, fetchBalance])

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Taro.showToast({ title: '请输入家庭名称', icon: 'none' })
      return
    }
    try {
      await api.family.create({ name: familyName.trim() })
      Taro.showToast({ title: T.createSuccess, icon: 'success' })
      setCreateModalVisible(false)
      setFamilyName('')
      loadFamilies()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '创建失败', icon: 'none' })
    }
  }

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    try {
      await api.family.join({ invite_code: inviteCode.trim().toUpperCase() })
      Taro.showToast({ title: T.joinSuccess, icon: 'success' })
      setJoinModalVisible(false)
      setInviteCode('')
      loadFamilies()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加入失败', icon: 'none' })
    }
  }

  const handleAddMember = async () => {
    if (!memberUsername.trim()) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    try {
      await api.family.addRelative({ relative_username: memberUsername.trim() })
      Taro.showToast({ title: T.bindSuccess, icon: 'success' })
      setAddMemberModalVisible(false)
      setMemberUsername('')
      if (selectedFamilyId) {
        loadMembers(selectedFamilyId)
      }
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '绑定失败', icon: 'none' })
    }
  }

  const handleUpdateProfile = async () => {
    if (!editNickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    try {
      await api.user.updateProfile({ nickname: editNickname.trim() })
      Taro.showToast({ title: T.updateSuccess, icon: 'success' })
      setProfileModalVisible(false)
      fetchProfile()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || T.updateFailed, icon: 'none' })
    }
  }

  const handleRoleSwitch = async (nextRole: 'chef' | 'foodie') => {
    if (nextRole === user.role) return
    setRole(nextRole)
    try {
      if (families.length > 0) {
        await api.family.updateRole({ family_id: families[0].id, role: nextRole })
      }
      Taro.showToast({ title: `已切换为${nextRole === 'chef' ? T.chef : T.foodie}`, icon: 'success' })
    } catch {
      setRole(user.role)
      Taro.showToast({ title: T.switchRoleFailed, icon: 'none' })
    }
  }

  const confirmLogout = () => {
    Taro.showModal({
      title: T.logout,
      content: T.logoutTip,
      confirmColor: '#EA4C73',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  const handleExitFamily = (familyId: number, familyName: string) => {
    Taro.showModal({
      title: '退出家庭',
      content: `确定要退出 "${familyName}" 吗？`,
      confirmColor: '#EA4C73',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.family.exit(familyId)
            Taro.showToast({ title: '退出家庭成功', icon: 'success' })
            loadFamilies()
          } catch (err: any) {
            Taro.showToast({ title: err?.message || '退出失败', icon: 'none' })
          }
        }
      }
    })
  }

  return (
    <View className="family-container">
      <View className="header">
        <View className="header-left">
          <View className="avatar-container" onClick={() => {
            setEditNickname(user.nickname || user.username || '')
            setProfileModalVisible(true)
          }}>
            {user.avatar ? (
              <Image src={user.avatar} className="avatar-image" />
            ) : (
              <View className="avatar-placeholder">
                <Text className="avatar-icon">👤</Text>
              </View>
            )}
          </View>
          {isChef && (
            <View className="balance-container">
              <Text className="balance-icon">💰</Text>
              <Text className="balance-text">{user.balance || 0}</Text>
            </View>
          )}
        </View>
        <View className="header-action" onClick={confirmLogout}>
          <Text className="logout-icon">📤</Text>
        </View>
      </View>

      <ScrollView className="scroll-content" scrollWithAnimation>

        <View className="section">
          <View className="section-header">
            <Text className="section-title">{T.family}</Text>
            <View className="section-actions">
              <View className="action-btn" onClick={() => setCreateModalVisible(true)}>
                <Text className="action-icon">➕</Text>
                <Text className="action-btn-text">{T.createFamily}</Text>
              </View>
              <View className="action-btn" onClick={() => setJoinModalVisible(true)}>
                <Text className="action-icon">👥</Text>
                <Text className="action-btn-text">{T.joinFamily}</Text>
              </View>
            </View>
          </View>

          {families.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">🏠</Text>
              <Text className="empty-text">{T.noFamily}</Text>
            </View>
          ) : (
            <ScrollView className="family-list" scrollX>
              {families.map((item) => (
                <View
                  key={item.id}
                  className={`family-card ${selectedFamilyId === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFamilyId(item.id)
                    loadMembers(item.id)
                  }}
                >
                  <View className="family-header">
                    <Text className={`family-icon ${selectedFamilyId === item.id ? 'active' : ''}`}>🏠</Text>
                    <Text className={`family-name ${selectedFamilyId === item.id ? 'active' : ''}`}>
                      {item.name}
                    </Text>
                    <View className="exit-btn" onClick={(e: any) => {
                      e.stopPropagation()
                      handleExitFamily(item.id, item.name)
                    }}>
                      <Text className="exit-icon">🚪</Text>
                    </View>
                  </View>
                  <View className="family-info">
                    <Text className="family-role">身份: {item.role === 'chef' ? T.chef : T.foodie}</Text>
                    <Text className="invite-code">邀请码: {item.inviteCode}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {families.length > 0 && (
          <View className="section">
            <View className="section-header">
              <Text className="section-title">{T.members}</Text>
              <View className="action-btn" onClick={() => setAddMemberModalVisible(true)}>
                <Text className="action-icon">👤+</Text>
                <Text className="action-btn-text">{T.addMember}</Text>
              </View>
            </View>
            <View className="members-list">
              {members.map((item) => (
                <View key={item.id} className="member-card">
                  <View className="member-avatar">
                    <Text className="member-icon">👤</Text>
                  </View>
                  <View className="member-info">
                    <Text className="member-name">{item.name}</Text>
                    <Text className="member-username">@{item.username}</Text>
                  </View>
                  <View className={`role-badge ${item.role === T.chef ? 'active' : ''}`}>
                    <Text className={`role-text ${item.role === T.chef ? 'active' : ''}`}>
                      {item.role}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {createModalVisible && (
        <View className="modal-overlay" onClick={() => setCreateModalVisible(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{T.createFamily}</Text>
            <Input
              className="modal-input"
              placeholder={T.inputFamilyName}
              value={familyName}
              onChange={(e) => setFamilyName(e.detail.value)}
            />
            <View className="modal-actions">
              <Button className="modal-btn-secondary" onClick={() => setCreateModalVisible(false)}>
                {T.cancel}
              </Button>
              <Button className="modal-btn-primary" onClick={handleCreateFamily}>
                {T.confirm}
              </Button>
            </View>
          </View>
        </View>
      )}

      {joinModalVisible && (
        <View className="modal-overlay" onClick={() => setJoinModalVisible(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{T.joinFamily}</Text>
            <Input
              className="modal-input"
              placeholder={T.inputInviteCode}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.detail.value)}
            />
            <View className="modal-actions">
              <Button className="modal-btn-secondary" onClick={() => setJoinModalVisible(false)}>
                {T.cancel}
              </Button>
              <Button className="modal-btn-primary" onClick={handleJoinFamily}>
                {T.confirm}
              </Button>
            </View>
          </View>
        </View>
      )}

      {addMemberModalVisible && (
        <View className="modal-overlay" onClick={() => setAddMemberModalVisible(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{T.addMember}</Text>
            <Input
              className="modal-input"
              placeholder={T.inputUsername}
              value={memberUsername}
              onChange={(e) => setMemberUsername(e.detail.value)}
            />
            <View className="modal-actions">
              <Button className="modal-btn-secondary" onClick={() => setAddMemberModalVisible(false)}>
                {T.cancel}
              </Button>
              <Button className="modal-btn-primary" onClick={handleAddMember}>
                {T.confirm}
              </Button>
            </View>
          </View>
        </View>
      )}

      {profileModalVisible && (
        <View className="modal-overlay" onClick={() => setProfileModalVisible(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{T.profileTitle}</Text>
            
            <View className="profile-avatar-section">
              <View className="profile-avatar-container">
                {user.avatar ? (
                  <Image src={user.avatar} className="profile-avatar-image" />
                ) : (
                  <View className="profile-avatar-placeholder">
                    <Text className="profile-avatar-icon">👤</Text>
                  </View>
                )}
                <View className="avatar-overlay">
                  <Text className="camera-icon">📷</Text>
                </View>
              </View>
              <Text className="change-avatar-text" onClick={() => Taro.showToast({ title: '头像上传功能开发中', icon: 'none' })}>
                {T.changeAvatar}
              </Text>
              <Text className="profile-username">{user.username}</Text>
            </View>

            <View className="profile-input-group">
              <Text className="profile-input-label">{T.editNickname}</Text>
              <Input
                className="modal-input"
                placeholder={T.inputNickname}
                value={editNickname}
                onChange={(e) => setEditNickname(e.detail.value)}
              />
            </View>

            <View className="modal-actions">
              <Button className="modal-btn-secondary" onClick={() => setProfileModalVisible(false)}>
                {T.cancel}
              </Button>
              <Button className="modal-btn-primary" onClick={handleUpdateProfile}>
                {T.confirm}
              </Button>
            </View>
          </View>
        </View>
      )}

      <CustomTabBar />
    </View>
  )
}

export default FamilyScreen
