import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  color?: string
  bgColor?: string
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  color = '#165DFF',
  bgColor = '#E8F3FF',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <View
      className={styles.card}
      style={{ backgroundColor: bgColor }}
      onClick={handleClick}
    >
      <View className={styles.icon} style={{ backgroundColor: color }}>
        <Text className={styles.iconText}>{title.charAt(0)}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.value} style={{ color }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <Text className={styles.unit}> {unit}</Text>}
        </Text>
        <Text className={styles.title}>{title}</Text>
      </View>
    </View>
  )
}

export default StatCard
