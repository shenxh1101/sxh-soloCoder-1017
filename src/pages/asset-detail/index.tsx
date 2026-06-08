import React, { useState, useEffect } from 'react'
import { View, Text, Image, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import { getAssetRecords } from '@/data/mock-records'
import type { AssetRecord } from '@/types/asset'
import { RecordTypeMap } from '@/types/asset'
import { formatPrice, formatDate, formatDateTime } from '@/utils/format'
import styles from './index.module.scss'

const AssetDetailPage: React.FC = () => {
  const router = useRouter()
  const assetId = router.params.id || ''
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { getAssetById, currentUser } = useAssetStore()
  const asset = getAssetById(assetId)
  const records = getAssetRecords(assetId)

  useEffect(() => {
    console.log('[AssetDetailPage] 查看资产详情:', assetId)
    if (!asset) {
      Taro.showToast({ title: '资产不存在', icon: 'none' })
    }
  }, [assetId, asset])

  if (!asset) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, color: '#86909C' }}>资产不存在</Text>
        </View>
      </View>
    )
  }

  const handleAction = () => {
    if (asset.status === 'normal') {
      Taro.navigateTo({ url: `/pages/borrow-apply/index?id=${asset.id}` })
    } else if (asset.status === 'borrowed' && asset.currentUserId === currentUser.id) {
      Taro.navigateTo({
        url: `/pages/approval-detail/index?id=${asset.id}&type=return`
      })
    } else if (asset.status === 'borrowed' && currentUser.role === 'admin') {
      Taro.showToast({ title: '联系使用人归还', icon: 'none' })
    }
  }

  const getActionText = () => {
    if (asset.status === 'normal') return '申请领用'
    if (asset.status === 'borrowed') {
      if (asset.currentUserId === currentUser.id) return '申请归还'
      if (currentUser.role === 'admin') return '催还'
    }
    return '查看记录'
  }

  const handleViewQrcode = () => {
    Taro.navigateTo({ url: `/pages/qrcode/index?id=${asset.id}` })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.imageSection}>
        <Image
          className={styles.mainImage}
          src={asset.images[currentImageIndex] || 'https://picsum.photos/id/1/750/500'}
          mode="aspectFill"
          onError={(e) => console.error('[AssetDetailPage] 图片加载失败:', e.detail)}
        />
        {asset.images.length > 1 && (
          <View className={styles.imageNav}>
            {asset.images.map((_, index) => (
              <View
                key={index}
                className={classnames(styles.imageDot, index === currentImageIndex && styles.active)}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </View>
        )}
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.assetHeader}>
            <View className={styles.assetTitle}>
              <Text className={styles.assetName}>{asset.name}</Text>
              <Text className={styles.assetCode}>{asset.code}</Text>
            </View>
            <StatusTag type={asset.status} variant="asset" size="md" />
          </View>

          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>资产分类</Text>
              <Text className={styles.infoValue}>{asset.category}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>资产价值</Text>
              <Text className={classnames(styles.infoValue, styles.priceValue)}>
                {formatPrice(asset.price)}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>购置日期</Text>
              <Text className={styles.infoValue}>{formatDate(asset.purchaseDate)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>存放位置</Text>
              <Text className={styles.infoValue}>{asset.location}</Text>
            </View>
            {asset.currentUserName && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>当前使用人</Text>
                <Text className={styles.infoValue}>{asset.currentUserName}</Text>
              </View>
            )}
            {asset.expectedReturnDate && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>预计归还</Text>
                <Text className={styles.infoValue} style={{ color: '#FF7D00' }}>
                  {formatDate(asset.expectedReturnDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {asset.description && (
          <View className={styles.infoCard}>
            <Text className={styles.sectionTitle}>资产描述</Text>
            <Text className={styles.descriptionText}>{asset.description}</Text>
          </View>
        )}

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>操作记录</Text>
          {records.length > 0 ? (
            <View className={styles.recordList}>
              {records.map((record: AssetRecord) => (
                <View key={record.id} className={styles.recordItem}>
                  <View
                    className={styles.recordIcon}
                    style={{ backgroundColor: RecordTypeMap[record.type].color + '15' }}
                  >
                    <Text style={{ color: RecordTypeMap[record.type].color }}>
                      {RecordTypeMap[record.type].label}
                    </Text>
                  </View>
                  <View className={styles.recordContent}>
                    <Text className={styles.recordTitle}>
                      {record.operatorName} {RecordTypeMap[record.type].label}
                      {record.remark && ` - ${record.remark}`}
                    </Text>
                    <Text className={styles.recordTime}>{formatDateTime(record.createTime)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 24, color: '#86909C', textAlign: 'center', padding: '40rpx 0' }}>
              暂无操作记录
            </Text>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnQrcode} onClick={handleViewQrcode}>
          查看二维码
        </Button>
        <Button className={styles.btnPrimary} onClick={handleAction}>
          {getActionText()}
        </Button>
      </View>
    </ScrollView>
  )
}

export default AssetDetailPage
