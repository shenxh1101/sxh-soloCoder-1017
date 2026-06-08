import React, { useState, useEffect } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import AssetCard from '@/components/AssetCard'
import EmptyState from '@/components/EmptyState'
import StatusTag from '@/components/StatusTag'
import type { Asset, ApprovalRecord, AssetStatus } from '@/types/asset'
import { RecordTypeMap } from '@/types/asset'
import styles from './index.module.scss'

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '正常', value: 'normal' },
  { label: '借出中', value: 'borrowed' },
  { label: '维修中', value: 'repair' },
  { label: '已报废', value: 'scrap' }
]

const BorrowPage: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showScan, setShowScan] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const {
    assets,
    getPendingApprovals,
    approveApproval,
    rejectApproval,
    currentUser,
    getAssetsByStatus
  } = useAssetStore()

  const pendingApprovals = getPendingApprovals()

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = activeFilter === 'all' || asset.status === activeFilter
    const matchesSearch = !searchKeyword ||
      asset.name.includes(searchKeyword) ||
      asset.code.includes(searchKeyword) ||
      asset.category.includes(searchKeyword)
    return matchesFilter && matchesSearch
  })

  useEffect(() => {
    console.log('[BorrowPage] 页面加载，待审批数量:', pendingApprovals.length)
  }, [pendingApprovals])

  const handlePullDownRefresh = () => {
    setRefreshing(true)
    console.log('[BorrowPage] 下拉刷新')
    setTimeout(() => {
      setRefreshing(false)
      Taro.stopPullDownRefresh?.()
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

  const handleScan = () => {
    console.log('[BorrowPage] 点击扫码')
    Taro.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        console.log('[BorrowPage] 扫码成功:', res.result)
        const match = res.result.match(/id=([^&]+)/)
        if (match) {
          Taro.navigateTo({
            url: `/pages/asset-detail/index?id=${match[1]}`
          })
        } else {
          Taro.showToast({ title: '无效的资产二维码', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('[BorrowPage] 扫码失败:', err)
      }
    })
  }

  const handleQuickBorrow = () => {
    console.log('[BorrowPage] 快速领用')
    const normalAssets = getAssetsByStatus('normal')
    if (normalAssets.length === 0) {
      Taro.showToast({ title: '暂无可领用资产', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/borrow-apply/index?id=${normalAssets[0].id}` })
  }

  const handleApprove = (record: ApprovalRecord) => {
    console.log('[BorrowPage] 审批通过:', record.id)
    Taro.showModal({
      title: '确认通过',
      content: `确定通过${record.applicantName}的${RecordTypeMap[record.type].label}申请吗？`,
      success: (res) => {
        if (res.confirm) {
          approveApproval(record.id, currentUser.id, currentUser.name)
          Taro.showToast({ title: '已通过', icon: 'success' })
        }
      }
    })
  }

  const handleReject = (record: ApprovalRecord) => {
    console.log('[BorrowPage] 审批驳回:', record.id)
    Taro.showModal({
      title: '确认驳回',
      content: `确定驳回${record.applicantName}的${RecordTypeMap[record.type].label}申请吗？`,
      editable: true,
      placeholderText: '请输入驳回原因',
      success: (res) => {
        if (res.confirm) {
          rejectApproval(record.id, currentUser.id, currentUser.name, res.content || '申请不符合要求')
          Taro.showToast({ title: '已驳回', icon: 'none' })
        }
      }
    })
  }

  const handleReturn = (asset: Asset) => {
    console.log('[BorrowPage] 申请归还:', asset.id)
    if (asset.currentUserId !== currentUser.id && currentUser.role !== 'admin') {
      Taro.showToast({ title: '只能归还自己领用的资产', icon: 'none' })
      return
    }
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${asset.id}&type=return`
    })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索资产名称、编号、分类"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            confirmType="search"
          />
        </View>
        <ScrollView scrollX className={styles.filterTabs} showScrollbar={false}>
          {filterOptions.map(option => (
            <View
              key={option.value}
              className={classnames(styles.filterTab, activeFilter === option.value && styles.active)}
              onClick={() => setActiveFilter(option.value)}
            >
              <Text>{option.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.content}>
        {pendingApprovals.length > 0 && currentUser.role === 'approver' && (
          <View className={styles.pendingSection}>
            <View className={styles.pendingHeader}>
              <Text className={styles.pendingTitle}>待我审批</Text>
              <Text className={styles.pendingCount}>{pendingApprovals.length}</Text>
            </View>
            {pendingApprovals.slice(0, 3).map(record => (
              <View key={record.id} className={styles.pendingItem}>
                <View className={styles.pendingInfo}>
                  <Text className={styles.pendingAssetName}>{record.assetName}</Text>
                  <View className={styles.pendingMeta}>
                    <StatusTag type={record.type} variant="record" size="sm" />
                    <Text>{record.applicantName}</Text>
                  </View>
                </View>
                <View className={styles.pendingActions}>
                  <Button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(record)}
                  >
                    通过
                  </Button>
                  <Button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(record)}
                  >
                    驳回
                  </Button>
                </View>
              </View>
            ))}
            {pendingApprovals.length > 3 && (
              <View style={{ textAlign: 'center', paddingTop: 24 }}>
                <Text style={{ color: '#165DFF', fontSize: 24 }}>
                  查看全部 {pendingApprovals.length} 条待审批 ›
                </Text>
              </View>
            )}
          </View>
        )}

        <View className={styles.assetList}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset: Asset) => (
              <View key={asset.id}>
                <AssetCard asset={asset} />
                {asset.status === 'borrowed' && asset.currentUserId === currentUser.id && (
                  <View style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Button
                      className="btnSecondary"
                      style={{ flex: 1, height: 72, fontSize: 26 }}
                      onClick={() => handleReturn(asset)}
                    >
                      申请归还
                    </Button>
                  </View>
                )}
                {asset.status === 'normal' && (
                  <View style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Button
                      className="btnPrimary"
                      style={{ flex: 1, height: 72, fontSize: 26 }}
                      onClick={() => Taro.navigateTo({ url: `/pages/borrow-apply/index?id=${asset.id}` })}
                    >
                      申请领用
                    </Button>
                  </View>
                )}
              </View>
            ))
          ) : (
            <EmptyState
              icon="📦"
              title="暂无资产"
              description={searchKeyword ? '没有找到匹配的资产，请尝试其他关键词' : '暂无符合条件的资产'}
            />
          )}
        </View>
      </View>

      <View className={styles.fab} onClick={handleScan}>
        <Text className={styles.fabIcon}>📷</Text>
      </View>

      {showScan && (
        <View className={styles.scanPrompt}>
          <View className={styles.scanFrame}>
            <View className={styles.scanLine} />
          </View>
          <Text className={styles.scanText}>将二维码放入框内，自动识别</Text>
          <Button className={styles.scanCancel} onClick={() => setShowScan(false)}>
            取消
          </Button>
        </View>
      )}
    </ScrollView>
  )
}

export default BorrowPage
