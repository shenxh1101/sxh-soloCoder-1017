import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { StatusMap, ApprovalStatusMap, RecordTypeMap } from '@/types/asset'
import type { AssetStatus, ApprovalStatus, RecordType } from '@/types/asset'
import styles from './index.module.scss'

interface StatusTagProps {
  type: AssetStatus | ApprovalStatus | RecordType
  variant?: 'asset' | 'approval' | 'record'
  size?: 'sm' | 'md'
}

const StatusTag: React.FC<StatusTagProps> = ({ type, variant = 'asset', size = 'sm' }) => {
  const getStatusInfo = () => {
    if (variant === 'asset') {
      return StatusMap[type as AssetStatus]
    } else if (variant === 'approval') {
      return ApprovalStatusMap[type as ApprovalStatus]
    } else {
      return RecordTypeMap[type as RecordType]
    }
  }

  const info = getStatusInfo()
  const bgColor = variant === 'asset' ? (info as typeof StatusMap[keyof typeof StatusMap]).bgColor : `${info.color}15`

  return (
    <View
      className={classnames(styles.tag, styles[size])}
      style={{ backgroundColor: bgColor, color: info.color }}
    >
      <Text className={styles.text}>{info.label}</Text>
    </View>
  )
}

export default StatusTag
