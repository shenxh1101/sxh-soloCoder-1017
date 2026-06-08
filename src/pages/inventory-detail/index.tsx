import React, { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Checkbox, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import EmptyState from '@/components/EmptyState'
import type { Asset } from '@/types/asset'
import { formatPrice, formatDate, formatDateTime } from '@/utils/format'
import { handleAssetScan } from '@/utils/scan'
import styles from './index.module.scss'

const InventoryDetailPage: React.FC = () => {
  const router = useRouter()
  const taskId = router.params.id || ''

  const {
    assets,
    getInventoryTaskById,
    currentUser,
    startInventoryTask,
    checkInventoryAsset,
    markInventoryMissing,
    completeInventoryTask
  } = useAssetStore()

  const task = getInventoryTaskById(taskId)
  const [showReport, setShowReport] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'checked' | 'missing' | 'pending'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    console.log('[InventoryDetailPage] 盘点详情:', taskId, '任务:', task?.name)
    if (!task) {
      Taro.showToast({ title: '盘点任务不存在', icon: 'none' })
    }
  }, [taskId, task])

  if (!task) {
    return <View className={styles.page} />
  }

  const isCompleted = task.status === 'completed'
  const isPending = task.status === 'pending'
  const checkedCount = task.checkedAssets.length
  const missingCount = task.missingAssets.length
  const pendingCount = task.totalAssets - checkedCount - missingCount

  const filteredAssets = assets.filter(asset => {
    if (asset.status === 'scrap') return false

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      if (!asset.name.toLowerCase().includes(keyword) &&
          !asset.code.toLowerCase().includes(keyword) &&
          !asset.category.toLowerCase().includes(keyword)) {
        return false
      }
    }

    const isChecked = task.checkedAssets.includes(asset.id)
    const isMissing = task.missingAssets.includes(asset.id)

    if (filterType === 'checked') return isChecked
    if (filterType === 'missing') return isMissing
    if (filterType === 'pending') return !isChecked && !isMissing
    return true
  })

  const handleStart = () => {
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可操作', icon: 'none' })
      return
    }
    startInventoryTask(taskId)
    Taro.showToast({ title: '盘点已开始', icon: 'success' })
  }

  const handleScan = () => {
    if (isCompleted) {
      Taro.showToast({ title: '盘点已完成', icon: 'none' })
      return
    }
    handleAssetScan(
      (assetId, assetData) => {
        const asset = assets.find(a => a.id === assetId)
        if (asset) {
          const isChecked = task.checkedAssets.includes(assetId)
          const isMissing = task.missingAssets.includes(assetId)
          
          if (isChecked) {
            Taro.showToast({ title: '该资产已盘点', icon: 'none' })
          } else {
            checkInventoryAsset(taskId, assetId)
            if (isMissing) {
              Taro.showToast({ title: `已从缺失转为已盘: ${asset.name}`, icon: 'success' })
            } else {
              Taro.showToast({ title: `已盘点: ${asset.name}`, icon: 'success' })
            }
          }
        }
      }
    )
  }

  const handleCheckAsset = (assetId: string) => {
    if (isCompleted) return
    checkInventoryAsset(taskId, assetId)
  }

  const handleMarkMissing = (assetId: string, e: any) => {
    e.stopPropagation?.()
    if (isCompleted) return
    markInventoryMissing(taskId, assetId)
    const asset = assets.find(a => a.id === assetId)
    Taro.showToast({
      title: task.missingAssets.includes(assetId) ? '已取消标记' : `已标记缺失: ${asset?.name}`,
      icon: 'none'
    })
  }

  const handleComplete = () => {
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可操作', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '确认完成盘点',
      content: `已盘点 ${checkedCount} 件，缺失 ${missingCount} 件，待盘 ${pendingCount} 件。确定完成盘点吗？`,
      success: (res) => {
        if (res.confirm) {
          completeInventoryTask(taskId)
          Taro.showToast({ title: '盘点已完成', icon: 'success' })
          setShowReport(true)
        }
      }
    })
  }

  const handleViewReport = () => {
    setShowReport(true)
  }

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '已盘', value: 'checked' },
    { label: '缺失', value: 'missing' },
    { label: '待盘', value: 'pending' }
  ]

  if (showReport) {
    const pendingAssets = assets.filter(asset => 
      asset.status !== 'scrap' && 
      !task.checkedAssets.includes(asset.id) && 
      !task.missingAssets.includes(asset.id)
    )

    return (
      <ScrollView scrollY className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>盘点报告</Text>
          <Text className={styles.headerSubtitle}>{task.name}</Text>
        </View>

        <View className={styles.reportContent}>
          <View className={styles.reportCard}>
            <Text className={styles.reportLabel}>盘点任务</Text>
            <Text className={styles.reportValue}>{task.name}</Text>
          </View>

          <View className={styles.reportCard}>
            <Text className={styles.reportLabel}>盘点描述</Text>
            <Text className={styles.reportDesc}>{task.description}</Text>
          </View>

          <View className={styles.reportCard}>
            <Text className={styles.reportLabel}>创建人</Text>
            <Text className={styles.reportValue}>{task.creatorName}</Text>
          </View>

          <View className={styles.reportCard}>
            <Text className={styles.reportLabel}>盘点时间</Text>
            <Text className={styles.reportValue}>
              {task.startTime ? formatDateTime(task.startTime) : '-'}
              {' ~ '}
              {task.completeTime ? formatDateTime(task.completeTime) : '进行中'}
            </Text>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#165DFF' }}>{task.totalAssets}</Text>
              <Text className={styles.statLabel}>应盘资产</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#00B42A' }}>{checkedCount}</Text>
              <Text className={styles.statLabel}>已盘</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{missingCount}</Text>
              <Text className={styles.statLabel}>缺失</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#86909C' }}>{pendingCount}</Text>
              <Text className={styles.statLabel}>待盘</Text>
            </View>
          </View>

          <View className={styles.progressSection}>
            <Text className={styles.progressLabel}>盘点进度</Text>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${task.progress}%` }}
              />
            </View>
            <Text className={styles.progressText}>{task.progress}%</Text>
          </View>

          {missingCount > 0 && (
            <View className={styles.missingSection}>
              <Text className={styles.sectionTitle}>缺失资产清单 ({missingCount})</Text>
              {task.missingAssets.map(assetId => {
                const asset = assets.find(a => a.id === assetId)
                if (!asset) return null
                return (
                  <View key={asset.id} className={styles.missingItem}>
                    <View className={styles.missingInfo}>
                      <Text className={styles.missingName}>{asset.name}</Text>
                      <Text className={styles.missingCode}>{asset.code}</Text>
                    </View>
                    <Text className={styles.missingValue}>{formatPrice(asset.price)}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {checkedCount > 0 && (
            <View className={styles.checkedSection}>
              <Text className={styles.sectionTitle}>已盘点资产 ({checkedCount})</Text>
              {task.checkedAssets.map(assetId => {
                const asset = assets.find(a => a.id === assetId)
                if (!asset) return null
                return (
                  <View key={asset.id} className={styles.checkedItem}>
                    <View className={styles.checkedInfo}>
                      <Text className={styles.checkedName}>{asset.name}</Text>
                      <Text className={styles.checkedCode}>{asset.code}</Text>
                    </View>
                    <Text className={styles.checkedValue}>✓</Text>
                  </View>
                )
              })}
            </View>
          )}

          {pendingCount > 0 && (
            <View className={styles.pendingSection}>
              <Text className={styles.sectionTitle}>待盘资产清单 ({pendingCount})</Text>
              {pendingAssets.map(asset => (
                <View key={asset.id} className={styles.pendingItem}>
                  <View className={styles.pendingInfo}>
                    <Text className={styles.pendingName}>{asset.name}</Text>
                    <Text className={styles.pendingCode}>{asset.code}</Text>
                  </View>
                  <Text className={styles.pendingValue}>○</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.bottomBar}>
          <Button className={styles.backBtn} onClick={() => setShowReport(false)}>
            返回
          </Button>
          <Button
            className={styles.closeBtn}
            onClick={() => Taro.navigateBack()}
          >
            关闭
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{task.name}</Text>
        <Text className={styles.headerSubtitle}>{task.description}</Text>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#165DFF' }}>{task.totalAssets}</Text>
            <Text className={styles.statLabel}>应盘</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#00B42A' }}>{checkedCount}</Text>
            <Text className={styles.statLabel}>已盘</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{missingCount}</Text>
            <Text className={styles.statLabel}>缺失</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#86909C' }}>{pendingCount}</Text>
            <Text className={styles.statLabel}>待盘</Text>
          </View>
        </View>

        <View className={styles.progressSection}>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${task.progress}%` }}
            />
          </View>
          <Text className={styles.progressText}>{task.progress}%</Text>
        </View>
      </View>

      {isPending && (
        <View className={styles.startBanner}>
          <Text className={styles.startText}>盘点任务尚未开始</Text>
          <Button className={styles.startBtn} onClick={handleStart}>
            开始盘点
          </Button>
        </View>
      )}

      {!isPending && (
        <View className={styles.filterSection}>
          <View className={styles.searchBar}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索资产名称、编号"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
            />
          </View>

          <ScrollView scrollX className={styles.filterTabs} showScrollbar={false}>
            {filterOptions.map(option => (
              <View
                key={option.value}
                className={classnames(styles.filterTab, filterType === option.value && styles.active)}
                onClick={() => setFilterType(option.value as any)}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {!isPending && (
        <View className={styles.assetList}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset: Asset) => {
              const isChecked = task.checkedAssets.includes(asset.id)
              const isMissing = task.missingAssets.includes(asset.id)

              return (
                <View
                  key={asset.id}
                  className={classnames(
                    styles.assetCard,
                    isChecked && styles.checked,
                    isMissing && styles.missing,
                    isCompleted && styles.disabled
                  )}
                  onClick={() => handleCheckAsset(asset.id)}
                >
                  <Checkbox
                    checked={isChecked}
                    color="#00B42A"
                    disabled={isCompleted}
                    onClick={(e) => {
                      e.stopPropagation?.()
                      handleCheckAsset(asset.id)
                    }}
                  />
                  <View className={styles.assetInfo}>
                    <View className={styles.assetHeader}>
                      <Text className={styles.assetName}>{asset.name}</Text>
                      <StatusTag type={asset.status} variant="asset" size="sm" />
                    </View>
                    <Text className={styles.assetCode}>{asset.code}</Text>
                    <View className={styles.assetMeta}>
                      <Text className={styles.assetCategory}>{asset.category}</Text>
                      <Text className={styles.assetPrice}>{formatPrice(asset.price)}</Text>
                    </View>
                    {asset.currentUserName && (
                      <Text className={styles.assetOwner}>使用人：{asset.currentUserName}</Text>
                    )}
                  </View>
                  {!isCompleted && (
                    <Button
                      className={classnames(
                        styles.missingBtn,
                        isMissing && styles.active
                      )}
                      onClick={(e) => handleMarkMissing(asset.id, e)}
                    >
                      {isMissing ? '已标记' : '缺失'}
                    </Button>
                  )}
                </View>
              )
            })
          ) : (
            <EmptyState
              icon="📋"
              title="暂无符合条件的资产"
              description="试试调整搜索条件"
            />
          )}
        </View>
      )}

      {!isPending && (
        <View className={styles.bottomBar}>
          <Button
            className={classnames(styles.scanBtn, isCompleted && styles.disabled)}
            onClick={handleScan}
            disabled={isCompleted}
          >
            📷 扫码盘点
          </Button>
          {isCompleted ? (
            <Button className={styles.reportBtn} onClick={handleViewReport}>
              查看报告
            </Button>
          ) : (
            <Button
              className={classnames(styles.completeBtn, currentUser.role !== 'admin' && styles.disabled)}
              onClick={handleComplete}
              disabled={currentUser.role !== 'admin'}
            >
              完成盘点
            </Button>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default InventoryDetailPage
