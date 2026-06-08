import React, { useState, useEffect } from 'react'
import { View, Text, Image, Button, ScrollView, Canvas } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useAssetStore } from '@/store/useAssetStore'
import { formatPrice, formatDate } from '@/utils/format'
import { createQRCodeDataURL } from '@/utils/qrcode'
import styles from './index.module.scss'

const QrcodePage: React.FC = () => {
  const router = useRouter()
  const assetId = router.params.id || ''
  const isNew = router.params.new === '1'

  const { getAssetById, currentUser } = useAssetStore()
  const asset = getAssetById(assetId)

  const [qrcodeUrl, setQrcodeUrl] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    console.log('[QrcodePage] 查看资产二维码:', assetId, '是否新创建:', isNew)
    if (!asset) {
      Taro.showToast({ title: '资产不存在', icon: 'none' })
      return
    }
    generateQRCode()
  }, [assetId, asset])

  const generateQRCode = async () => {
    if (!asset) return

    setGenerating(true)
    try {
      const qrData = JSON.stringify({
        id: asset.id,
        code: asset.code,
        name: asset.name,
        type: 'asset'
      })
      const url = await createQRCodeDataURL(qrData, 300)
      console.log('[QrcodePage] 二维码生成成功')
      setQrcodeUrl(url)
    } catch (error) {
      console.error('[QrcodePage] 二维码生成失败:', error)
      Taro.showToast({ title: '二维码生成失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  if (!asset) {
    return <View className={styles.page} />
  }

  const handleSaveQRCode = async () => {
    if (!qrcodeUrl) {
      Taro.showToast({ title: '二维码未生成', icon: 'none' })
      return
    }

    try {
      Taro.saveImageToPhotosAlbum({
        filePath: qrcodeUrl,
        success: () => {
          console.log('[QrcodePage] 二维码保存成功')
          Taro.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: (err) => {
          console.error('[QrcodePage] 保存失败:', err)
          if (err.errMsg.includes('auth')) {
            Taro.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              success: (res) => {
                if (res.confirm) Taro.openSetting()
              }
            })
          } else {
            Taro.showToast({ title: '保存失败', icon: 'none' })
          }
        }
      })
    } catch (error) {
      console.error('[QrcodePage] 保存异常:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handlePrintQRCode = () => {
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可打印', icon: 'none' })
      return
    }
    Taro.showToast({ title: '打印功能开发中', icon: 'none' })
    console.log('[QrcodePage] 打印二维码:', asset.code)
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.content}>
        <View className={styles.qrcodeCard}>
          <Text className={styles.qrcodeTitle}>{asset.name}</Text>
          <Text className={styles.qrcodeSubtitle}>{asset.code}</Text>

          <View className={styles.qrcodeWrapper}>
            {generating ? (
              <Text style={{ fontSize: 24, color: '#86909C' }}>生成中...</Text>
            ) : qrcodeUrl ? (
              <Image
                className={styles.qrcodeImage}
                src={qrcodeUrl}
                mode="aspectFit"
                onError={(e) => console.error('[QrcodePage] 二维码图片加载失败:', e.detail)}
              />
            ) : (
              <Canvas
                canvasId="qrcodeCanvas"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>

          <View className={styles.qrcodeTips}>
            <Text className={styles.tipText}>
              扫描二维码可快速查看资产信息{'\n'}
              并进行领用、归还、维修等操作
            </Text>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.infoTitle}>资产信息</Text>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>资产编号</Text>
            <Text className={styles.infoValue}>{asset.code}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>资产分类</Text>
            <Text className={styles.infoValue}>{asset.category}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>资产价值</Text>
            <Text className={styles.infoValue} style={{ color: '#165DFF' }}>
              {formatPrice(asset.price)}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>购置日期</Text>
            <Text className={styles.infoValue}>{formatDate(asset.purchaseDate)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>存放位置</Text>
            <Text className={styles.infoValue}>{asset.location}</Text>
          </View>
          {asset.currentUserName && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>当前使用人</Text>
              <Text className={styles.infoValue}>{asset.currentUserName}</Text>
            </View>
          )}
        </View>

        {isNew && (
          <View style={{
            background: '#E8FFEA',
            borderLeft: '6rpx solid #00B42A',
            padding: '24rpx 32rpx',
            borderRadius: 12,
            marginBottom: 24
          }}>
            <Text style={{ fontSize: 24, color: '#00B42A', lineHeight: 1.6 }}>
              ✅ 资产创建成功！请打印二维码并粘贴到资产上，方便后续扫码管理。
            </Text>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSave} onClick={handleSaveQRCode}>
          保存图片
        </Button>
        <Button className={styles.btnPrint} onClick={handlePrintQRCode}>
          打印二维码
        </Button>
      </View>
    </ScrollView>
  )
}

export default QrcodePage
