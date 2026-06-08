import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import StatusTag from '@/components/StatusTag'
import type { Asset } from '@/types/asset'
import { formatPrice, formatDate } from '@/utils/format'
import styles from './index.module.scss'

interface AssetCardProps {
  asset: Asset
  onClick?: () => void
  showLocation?: boolean
  showUser?: boolean
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onClick,
  showLocation = true,
  showUser = true
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/asset-detail/index?id=${asset.id}`
      })
    }
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.imageWrap}>
        <Image
          className={styles.image}
          src={asset.images[0] || 'https://picsum.photos/id/1/200/200'}
          mode="aspectFill"
          lazyLoad
          onError={(e) => {
            console.error('[AssetCard] 图片加载失败:', e.detail)
          }}
        />
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{asset.name}</Text>
          <StatusTag type={asset.status} variant="asset" />
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.code}>{asset.code}</Text>
          <Text className={styles.category}>{asset.category}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.price}>{formatPrice(asset.price)}</Text>
          <Text className={styles.date}>购入 {formatDate(asset.purchaseDate)}</Text>
        </View>
        {showLocation && (
          <View className={styles.locationRow}>
            <Text className={styles.location}>📍 {asset.location}</Text>
          </View>
        )}
        {showUser && asset.currentUserName && (
          <View className={styles.userRow}>
            <Text className={styles.user}>👤 {asset.currentUserName}</Text>
            {asset.expectedReturnDate && (
              <Text className={styles.returnDate}>预计归还 {formatDate(asset.expectedReturnDate)}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export default AssetCard
