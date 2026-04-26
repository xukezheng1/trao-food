import Taro from '@tarojs/taro'
import { storage } from './storage'
import { BASE_URL } from './api'

// 七牛云上传域名（根据后端返回的 region 使用正确的域名）
const QINIU_UPLOAD_URL = 'https://up-z2.qiniup.com'

// 用于构建完整URL的API基础地址（始终包含域名）
const isH5 = process.env.TARO_ENV === 'h5'
const isDev = process.env.NODE_ENV === 'development'
const API_BASE_URL = (isH5 && isDev) ? 'http://localhost:3000/api' : 'http://8.135.32.152/api'

/**
 * 获取七牛云上传 token
 */
export const getQiniuUploadToken = async (filename?: string, folder: string = 'images') => {
  const token = storage.getItem('token')
  const response = await fetch(`${BASE_URL}/recipe/upload-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ filename, folder })
  })
  const result = await response.json()
  if (result.success) {
    return result.data
  }
  throw new Error(result.message || '获取上传token失败')
}

/**
 * 上传图片到七牛云
 */
export const uploadToQiniu = async (file: File, token: string, key: string): Promise<string> => {
  const formData = new FormData()
  // 七牛云要求 file 必须是最后一个字段
  formData.append('token', token)
  formData.append('key', key)
  formData.append('file', file)

  console.log('[Upload] Uploading to Qiniu:', { token: token.substring(0, 20) + '...', key })

  const response = await fetch(QINIU_UPLOAD_URL, {
    method: 'POST',
    body: formData
  })

  const resultText = await response.text()
  console.log('[Upload] Qiniu response:', response.status, resultText)

  if (!response.ok) {
    throw new Error(`上传到七牛云失败: ${resultText}`)
  }

  const result = JSON.parse(resultText)
  return result.key
}

/**
 * 选择图片并上传到七牛云（H5/小程序通用）
 * 返回七牛云图片 URL
 */
export const chooseAndUploadImage = async (folder: string = 'images'): Promise<string> => {
  // 1. 选择图片
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  })

  const tempFilePath = res.tempFilePaths[0]
  const fileName = tempFilePath.split('/').pop() || 'image.jpg'

  // 2. 获取上传 token
  const { token, key, domain } = await getQiniuUploadToken(fileName, folder)

  // 3. H5 环境：将临时文件转换为 File 对象
  if (process.env.TARO_ENV === 'h5') {
    const response = await fetch(tempFilePath)
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: blob.type })
    
    // 上传到七牛云
    await uploadToQiniu(file, token, key)
  } else {
    // 小程序环境：使用 Taro.uploadFile 直接上传到七牛云
    await new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: QINIU_UPLOAD_URL,
        filePath: tempFilePath,
        name: 'file',
        formData: {
          token,
          key
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(res.data))
          } else {
            reject(new Error('上传到七牛云失败'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '上传失败'))
        }
      })
    })
  }

  // 4. 返回API转发后的图片URL（使用完整域名）
  // 七牛云URL统一使用https协议
  const qiniuUrl = `http://${domain}/${key}`
  return `${API_BASE_URL}/upload/qiniu-image?url=${encodeURIComponent(qiniuUrl)}`
}

/**
 * 获取代理后的图片 URL（用于显示）
 * 如果图片已经是七牛云地址，转换为 API 转发地址
 */
export const getProxiedImageUrl = (url?: string): string => {
  if (!url) return ''

  // 如果已经是本地API地址，直接返回
  if (url.includes('/api/upload/qiniu-image') || url.startsWith('/api/')) {
    return url.startsWith('http') ? url : `${BASE_URL}${url}`
  }

  // 如果是七牛云地址，转换为API转发地址
  if (url.includes('qiniu.com') || url.includes('clouddn.com')) {
    const encodedUrl = encodeURIComponent(url)
    return `${BASE_URL}/upload/qiniu-image?url=${encodedUrl}`
  }

  // 其他情况直接返回原URL
  return url
}
