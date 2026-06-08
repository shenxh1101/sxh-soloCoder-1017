import React, { useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import { formatDate } from '@/utils/format'
import { handleAssetScan } from '@/utils/scan'
import styles from './index.module.scss'

const InventoryPage: React.FC = () => {
  const { inventoryTasks, currentUser, startInventoryTask, checkInventoryAsset } = useAssetStore()

  const totalTasks = inventoryTasks.length
  const completedTasks = inventoryTasks.filter(t => t.status === 'completed').length
  const inProgressTasks = inventoryTasks.filter(t => t.status === 'inProgress').length

  useEffect(() => {
    console.log('[InventoryPage] 资产盘点页面加载，任务数:', inventoryTasks.length)
  }, [])

  const handleStartTask = (taskId: string) => {
    const task = inventoryTasks.find(t => t.id === taskId)
    if (!task) return

    if (task.status === 'completed') {
      Taro.navigateTo({ url: `/pages/inventory-detail/index?id=${taskId}` })
      return
    }

    if (task.status === 'pending' && currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可发起盘点', icon: 'none' })
      return
    }

    if (task.status === 'pending') {
      Taro.showModal({
        title: '确认开始盘点',
        content: `确定开始「${task.name}」吗？`,
        success: (res) => {
          if (res.confirm) {
            startInventoryTask(taskId)
            Taro.showToast({ title: '盘点已开始', icon: 'success' })
            setTimeout(() => {
              Taro.navigateTo({ url: `/pages/inventory-detail/index?id=${taskId}` })
            }, 500)
          }
        }
      })
      return
    }

    Taro.navigateTo({ url: `/pages/inventory-detail/index?id=${taskId}` })
  }

  const handleScanInventory = () => {
    const inProgressTask = inventoryTasks.find(t => t.status === 'inProgress')
    if (!inProgressTask) {
      Taro.showToast({ title: '没有进行中的盘点任务', icon: 'none' })
      return
    }

    handleAssetScan(
      (assetId) => {
        const task = inventoryTasks.find(t => t.status === 'inProgress')
        if (task) {
          if (task.checkedAssets.includes(assetId)) {
            Taro.showToast({ title: '该资产已盘点', icon: 'none' })
          } else {
            checkInventoryAsset(task.id, assetId)
            Taro.showToast({ title: '盘点成功', icon: 'success' })
          }
        }
      }
    )
  }

  const handleExportReport = () => {
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可导出', icon: 'none' })
      return
    }
    const completedTask = inventoryTasks.find(t => t.status === 'completed')
    if (!completedTask) {
      Taro.showToast({ title: '暂无已完成的盘点', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/inventory-detail/index?id=${completedTask.id}` })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待开始'
      case 'inProgress': return '进行中'
      case 'completed': return '已完成'
      default: return status
    }
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>资产盘点</Text>
        <Text className={styles.headerSubtitle}>定期盘点，确保账实相符</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalTasks}</Text>
              <Text className={styles.statLabel}>总任务</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FF7D00' }}>{inProgressTasks}</Text>
              <Text className={styles.statLabel}>进行中</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#00B42A' }}>{completedTasks}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
          </View>
        </View>

        <Text className={styles.sectionTitle}>盘点任务</Text>

        <View className={styles.taskList}>
          {inventoryTasks.map(task => (
            <View key={task.id} className={styles.taskCard}>
              <View className={styles.taskHeader}>
                <Text className={styles.taskTitle}>{task.name}</Text>
                <Text className={classnames(styles.taskStatus, styles[task.status])}>
                  {getStatusText(task.status)}
                </Text>
              </View>

              <Text className={styles.taskDesc}>{task.description}</Text>

              <View className={styles.taskMeta}>
                <View className={styles.taskMetaItem}>
                  <Text className={styles.taskMetaValue}>{task.totalAssets}</Text>
                  <Text className={styles.taskMetaLabel}>应盘资产</Text>
                </View>
                <View className={styles.taskMetaItem}>
                  <Text className={styles.taskMetaValue} style={{ color: '#00B42A' }}>{task.checkedAssets.length}</Text>
                  <Text className={styles.taskMetaLabel}>已盘</Text>
                </View>
                <View className={styles.taskMetaItem}>
                  <Text className={styles.taskMetaValue} style={{ color: '#F53F3F' }}>{task.missingAssets.length}</Text>
                  <Text className={styles.taskMetaLabel}>差异</Text>
                </View>
              </View>

              <View className={styles.taskProgress}>
                <View className={styles.progressBar}>
                  <View
                    className={styles.progressFill}
                    style={{ width: `${task.progress}%` }}
                  />
                </View>
                <Text className={styles.progressText}>{task.progress}%</Text>
              </View>

              <View className={styles.taskFooter}>
                <Text className={styles.taskDate}>
                  创建时间：{formatDate(task.createTime)}
                </Text>
                <Button
                  className={classnames(
                    styles.actionBtn,
                    task.status === 'completed' && styles.disabled
                  )}
                  onClick={() => handleStartTask(task.id)}
                  disabled={task.status === 'completed'}
                >
                  {task.status === 'pending' ? '开始盘点' :
                   task.status === 'inProgress' ? '继续盘点' : '查看报告'}
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleExportReport}>
          导出报告
        </Button>
        <Button className={styles.btnPrimary} onClick={handleScanInventory}>
          扫码盘点
        </Button>
      </View>
    </ScrollView>
  )
}

export default InventoryPage
