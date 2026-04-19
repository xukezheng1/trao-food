export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('http://8.135.32.152/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  })

  const result = await response.json()
  if (result.success) {
    return result.data.url
  }
  throw new Error(result.message || '上传失败')
}

export const getUploadToken = async (filename?: string, folder: string = 'images') => {
  const token = localStorage.getItem('token')
  const response = await fetch('http://8.135.32.152/api/upload/token', {
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
