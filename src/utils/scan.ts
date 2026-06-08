import Taro from '@tarojs/taro'
import { useAssetStore } from '@/store/useAssetStore'

export interface QRCodeData {
  id: string
  code: string
  name: string
  type: string
}

export const parseQRCode = (result: string): QRCodeData | null => {
  try {
    const data = JSON.parse(result)
    if (data && data.type === 'asset' && data.id && data.code) {
      return data
    }
    return null
  } catch {
    const idMatch = result.match(/id=([^&]+)/)
    const codeMatch = result.match(/code=([^&]+)/)
    if (idMatch) {
      return {
        id: idMatch[1],
        code: codeMatch?.[1] || '',
        name: '',
        type: 'asset'
      }
    }
    return null
  }
}

export const handleAssetScan = (
  onSuccess: (assetId: string, assetData: QRCodeData) => void,
  onError?: (message: string) => void
) => {
  Taro.scanCode({
    onlyFromCamera: false,
    scanType: ['qrCode', 'barCode'],
    success: (res) => {
      console.log('[ScanUtils] 扫码结果:', res.result)
      const assetData = parseQRCode(res.result)
      const { getAssetById } = useAssetStore.getState()

      if (assetData) {
        const asset = getAssetById(assetData.id)
        if (asset) {
          onSuccess(assetData.id, assetData)
        } else {
          const message = '资产不存在，可能已被删除'
          console.warn('[ScanUtils]', message)
          Taro.showToast({ title: message, icon: 'none' })
          onError?.(message)
        }
      } else {
        const message = '无效的资产二维码'
        console.warn('[ScanUtils]', message, '原始内容:', res.result)
        Taro.showToast({ title: message, icon: 'none' })
        onError?.(message)
      }
    },
    fail: (err) => {
      console.error('[ScanUtils] 扫码失败:', err)
      if (err.errMsg && !err.errMsg.includes('cancel')) {
        Taro.showToast({ title: '扫码失败', icon: 'none' })
      }
      onError?.(err.errMsg || '扫码失败')
    }
  })
}
