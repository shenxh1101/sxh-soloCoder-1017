import React, { useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { departmentStats } from '@/data/mock-users'
import { useAssetStore } from '@/store/useAssetStore'
import { formatPrice } from '@/utils/format'
import styles from './index.module.scss'

const DeptStatsPage: React.FC = () => {
  const { getStats } = useAssetStore()
  const stats = getStats()

  const totalValue = departmentStats.reduce((sum, d) => sum + d.totalValue, 0)
  const totalCount = departmentStats.reduce((sum, d) => sum + d.assetCount, 0)
  const sortedDepts = [...departmentStats].sort((a, b) => b.totalValue - a.totalValue)

  useEffect(() => {
    console.log('[DeptStatsPage] 加载部门统计，部门数:', departmentStats.length)
  }, [])

  const handleDeptClick = (deptName: string) => {
    Taro.showToast({ title: `${deptName} 详情开发中`, icon: 'none' })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>部门资产统计</Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatValue}>{departmentStats.length}</Text>
            <Text className={styles.headerStatLabel}>统计部门</Text>
          </View>
          <View className={styles.headerStatItem}>
            <Text className={styles.headerStatValue}>{totalCount}</Text>
            <Text className={styles.headerStatLabel}>资产总数</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>资产总览</Text>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{formatPrice(totalValue)}</Text>
              <Text className={styles.summaryLabel}>总资产价值</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{formatPrice(stats.depreciatedValue)}</Text>
              <Text className={styles.summaryLabel}>折旧后价值</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.borrowedCount}</Text>
              <Text className={styles.summaryLabel}>领用中</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.overdueCount}</Text>
              <Text className={styles.summaryLabel}>已逾期</Text>
            </View>
          </View>
        </View>

        <View className={styles.deptList}>
          {sortedDepts.map((dept, index) => (
            <View
              key={dept.id}
              className={styles.deptCard}
              onClick={() => handleDeptClick(dept.name)}
            >
              <View className={styles.deptHeader}>
                <Text className={styles.deptName}>{dept.name}</Text>
                <Text className={styles.deptValue}>{formatPrice(dept.totalValue)}</Text>
              </View>

              <View className={styles.deptStats}>
                <View className={styles.deptStat}>
                  <Text className={styles.deptStatValue}>{dept.assetCount}</Text>
                  <Text className={styles.deptStatLabel}>资产数量</Text>
                </View>
                <View className={styles.deptStat}>
                  <Text className={styles.deptStatValue}>{dept.borrowedCount}</Text>
                  <Text className={styles.deptStatLabel}>领用中</Text>
                </View>
                <View className={styles.deptStat}>
                  <Text className={styles.deptStatValue}>{dept.userCount}</Text>
                  <Text className={styles.deptStatLabel}>使用人数</Text>
                </View>
                <View className={styles.deptStat}>
                  <Text className={styles.deptStatValue}>{formatPrice(dept.avgValue)}</Text>
                  <Text className={styles.deptStatLabel}>人均价值</Text>
                </View>
              </View>

              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${(dept.totalValue / totalValue * 100).toFixed(1)}%` }}
                />
              </View>

              <View className={styles.deptFooter}>
                <Text className={styles.deptPercent}>
                  占比 {(dept.totalValue / totalValue * 100).toFixed(1)}%
                </Text>
                <Text className={styles.deptRank}>排名 第{index + 1}位</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default DeptStatsPage
