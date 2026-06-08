import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatCard from '@/components/StatCard'
import AssetCard from '@/components/AssetCard'
import EmptyState from '@/components/EmptyState'
import type { Asset } from '@/types/asset'
import { mockDepartments } from '@/data/mock-users'
import { formatPrice, isOverdue } from '@/utils/format'
import styles from './index.module.scss'

type TabType = 'dueSoon' | 'overdue'

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dueSoon')
  const [refreshing, setRefreshing] = useState(false)
  const { currentUser, getStats, getDueSoonAssets, getOverdueAssets } = useAssetStore()

  const stats = getStats()
  const dueSoonAssets = getDueSoonAssets()
  const overdueAssets = getOverdueAssets()

  const displayAssets = activeTab === 'dueSoon' ? dueSoonAssets : overdueAssets

  const quickActions = [
    { icon: '📱', text: '扫码登记', color: '#165DFF', bgColor: '#E8F3FF', path: '/pages/scan/index' },
    { icon: '➕', text: '新增资产', color: '#00B42A', bgColor: '#E8FFEA', path: '/pages/asset-add/index' },
    { icon: '📋', text: '资产盘点', color: '#FF7D00', bgColor: '#FFF3E8', path: '/pages/inventory/index' },
    { icon: '📊', text: '部门统计', color: '#722ED1', bgColor: '#F9F0FF', path: '/pages/dept-stats/index' }
  ]

  useEffect(() => {
    console.log('[HomePage] 页面加载，当前用户:', currentUser.name)
  }, [currentUser])

  const handlePullDownRefresh = () => {
    setRefreshing(true)
    console.log('[HomePage] 下拉刷新')
    setTimeout(() => {
      setRefreshing(false)
      Taro.stopPullDownRefresh?.()
      Taro.showToast({ title: '刷新成功', icon: 'success' })
    }, 1000)
  }

  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5' && Taro.onPullDownRefresh) {
      Taro.onPullDownRefresh(handlePullDownRefresh)
      return () => {
        Taro.offPullDownRefresh?.(handlePullDownRefresh)
      }
    }
  }, [])

  const handleActionClick = (path: string) => {
    console.log('[HomePage] 点击快捷入口:', path)
    if (path.includes('scan')) {
      Taro.switchTab({ url: path })
    } else {
      Taro.navigateTo({ url: path })
    }
  }

  const handleStatClick = (type: string) => {
    console.log('[HomePage] 点击统计卡片:', type)
    Taro.switchTab({ url: '/pages/borrow/index' })
  }

  const handleViewAllDept = () => {
    Taro.navigateTo({ url: '/pages/dept-stats/index' })
  }

  const maxDeptValue = Math.max(...mockDepartments.map(d => d.totalValue))

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <Image
            className={styles.avatar}
            src={currentUser.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
            onError={(e) => console.error('[HomePage] 头像加载失败:', e.detail)}
          />
          <View className={styles.greetingText}>
            <Text className={styles.hello}>你好，欢迎回来 👋</Text>
            <Text className={styles.userName}>{currentUser.name}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsGrid}>
          <StatCard
            title="资产总数"
            value={stats.totalAssets}
            unit="件"
            color="#165DFF"
            bgColor="#E8F3FF"
            onClick={() => handleStatClick('total')}
          />
          <StatCard
            title="借出中"
            value={stats.borrowedAssets}
            unit="件"
            color="#FF7D00"
            bgColor="#FFF3E8"
            onClick={() => handleStatClick('borrowed')}
          />
          <StatCard
            title="维修中"
            value={stats.inRepairAssets}
            unit="件"
            color="#F53F3F"
            bgColor="#FFECE8"
            onClick={() => handleStatClick('repair')}
          />
          <StatCard
            title="总价值"
            value={formatPrice(stats.totalValue)}
            color="#00B42A"
            bgColor="#E8FFEA"
            onClick={() => handleStatClick('value')}
          />
        </View>

        <View className={styles.quickActions}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
          <View className={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <View
                key={index}
                className={styles.actionItem}
                onClick={() => handleActionClick(action.path)}
              >
                <View
                  className={styles.actionIcon}
                  style={{ backgroundColor: action.bgColor }}
                >
                  <Text>{action.icon}</Text>
                </View>
                <Text className={styles.actionText}>{action.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.tabs}>
          <View
            className={classnames(styles.tabItem, activeTab === 'dueSoon' && styles.active)}
            onClick={() => setActiveTab('dueSoon')}
          >
            <Text>即将到期</Text>
            {dueSoonAssets.length > 0 && (
              <Text className={styles.tabBadge}>{dueSoonAssets.length}</Text>
            )}
          </View>
          <View
            className={classnames(styles.tabItem, activeTab === 'overdue' && styles.active)}
            onClick={() => setActiveTab('overdue')}
          >
            <Text>逾期未还</Text>
            {overdueAssets.length > 0 && (
              <Text className={styles.tabBadge}>{overdueAssets.length}</Text>
            )}
          </View>
        </View>

        <View className={styles.assetList}>
          {displayAssets.length > 0 ? (
            displayAssets.map((asset: Asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))
          ) : (
            <EmptyState
              icon={activeTab === 'dueSoon' ? '✅' : '🎉'}
              title={activeTab === 'dueSoon' ? '暂无即将到期的资产' : '暂无逾期未还的资产'}
              description={activeTab === 'dueSoon' ? '所有资产都在正常使用期限内' : '所有资产归还情况良好'}
            />
          )}
        </View>

        <View className={styles.deptSection}>
          <View className={styles.deptHeader}>
            <Text className={styles.deptTitle}>部门资产价值</Text>
            <Text className={styles.viewAll} onClick={handleViewAllDept}>查看全部 ›</Text>
          </View>
          <View className={styles.deptList}>
            {mockDepartments.slice(0, 4).map(dept => (
              <View key={dept.id} className={styles.deptItem}>
                <Text className={styles.deptName}>{dept.name}</Text>
                <View className={styles.deptBar}>
                  <View
                    className={styles.deptBarFill}
                    style={{ width: `${(dept.totalValue / maxDeptValue) * 100}%` }}
                  />
                </View>
                <Text className={styles.deptValue}>{formatPrice(dept.totalValue)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default HomePage
