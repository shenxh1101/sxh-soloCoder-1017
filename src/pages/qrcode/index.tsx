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
    if (!qrcodeUrl) {
      Taro.showToast({ title: '二维码未生成', icon: 'none' })
      return
    }

    console.log('[QrcodePage] 打印二维码:', asset.code)

    if (process.env.TARO_ENV === 'h5') {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>资产二维码 - ${asset.name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #fff;
                padding: 20px;
              }
              .card {
                width: 320px;
                padding: 24px;
                border: 2px solid #165DFF;
                border-radius: 16px;
                text-align: center;
                background: #fff;
              }
              .title {
                font-size: 20px;
                font-weight: 600;
                color: #1D2129;
                margin-bottom: 4px;
              }
              .code {
                font-size: 14px;
                color: #86909C;
                margin-bottom: 16px;
              }
              .qrcode {
                width: 240px;
                height: 240px;
                margin: 0 auto 16px;
                display: block;
              }
              .info {
                padding: 12px;
                background: #F2F3F5;
                border-radius: 8px;
                margin-top: 16px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                padding: 4px 0;
                color: #4E5969;
              }
              .info-label {
                color: #86909C;
              }
              .footer {
                margin-top: 16px;
                font-size: 12px;
                color: #C9CDD4;
              }
              @media print {
                body { padding: 0; }
                .card { border: 1px solid #165DFF; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="title">${asset.name}</div>
              <div class="code">${asset.code}</div>
              <img class="qrcode" src="${qrcodeUrl}" alt="资产二维码" />
              <div class="info">
                <div class="info-row">
                  <span class="info-label">资产分类</span>
                  <span>${asset.category}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">资产价值</span>
                  <span style="color: #165DFF; font-weight: 600;">¥${asset.price.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">存放位置</span>
                  <span>${asset.location}</span>
                </div>
                ${asset.currentUserName ? `
                <div class="info-row">
                  <span class="info-label">使用人</span>
                  <span>${asset.currentUserName}</span>
                </div>` : ''}
              </div>
              <div class="footer">扫描二维码查看资产详情</div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
        console.log('[QrcodePage] 打印窗口已打开')
      } else {
        Taro.showToast({ title: '请允许弹出窗口', icon: 'none' })
      }
    } else {
      Taro.showModal({
        title: '打印二维码',
        content: '当前平台暂不支持直接打印，是否保存二维码图片到相册后打印？',
        confirmText: '保存图片',
        success: (res) => {
          if (res.confirm) {
            handleSaveQRCode()
          }
        }
      })
    }
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
