import React, { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Checkbox, Picker, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import EmptyState from '@/components/EmptyState'
import type { Asset, User } from '@/types/asset'
import { formatPrice } from '@/utils/format'
import styles from './index.module.scss'

const BatchOwnerPage: React.FC = () => {
  const { assets, users, currentUser, batchUpdateOwner } = useAssetStore()
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showConfirm, setShowConfirm] = useState(false)

  const availableUsers = users.filter(u => u.role !== 'admin')

  useEffect(() => {
    console.log('[BatchOwnerPage] 页面加载，资产总数:', assets.length, '可选用户数:', availableUsers.length)
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可操作', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }, [assets.length, availableUsers.length, currentUser.role])

  const filteredAssets = assets.filter(asset => {
    if (asset.status === 'scrap') return false
    if (filterStatus !== 'all' && asset.status !== filterStatus) return false
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      return asset.name.toLowerCase().includes(keyword) ||
             asset.code.toLowerCase().includes(keyword) ||
             asset.category.toLowerCase().includes(keyword)
    }
    return true
  })

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(filteredAssets.map(a => a.id))
    }
  }

  const handleUserChange = (e: any) => {
    const index = parseInt(e.detail.value)
    setSelectedUserIndex(index)
  }

  const handleConfirm = () => {
    if (selectedAssets.length === 0) {
      Taro.showToast({ title: '请先选择资产', icon: 'none' })
      return
    }
    if (selectedUserIndex < 0) {
      Taro.showToast({ title: '请选择新负责人', icon: 'none' })
      return
    }
    setShowConfirm(true)
  }

  const handleSubmit = () => {
    if (selectedUserIndex < 0) return

    const targetUser = availableUsers[selectedUserIndex]
    console.log('[BatchOwnerPage] 批量调整负责人:', {
      assetCount: selectedAssets.length,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name
    })

    batchUpdateOwner(selectedAssets, targetUser.id, targetUser.name)

    Taro.showToast({
      title: `已调整 ${selectedAssets.length} 件资产`,
      icon: 'success'
    })

    setTimeout(() => {
      setShowConfirm(false)
      setSelectedAssets([])
      setSelectedUserIndex(-1)
    }, 1000)
  }

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '正常', value: 'normal' },
    { label: '借出中', value: 'borrowed' },
    { label: '维修中', value: 'repair' }
  ]

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>批量调整负责人</Text>
        <Text className={styles.headerSubtitle}>勾选资产后统一调整使用人</Text>
      </View>

      <View className={styles.searchSection}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索资产名称、编号、分类"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        <ScrollView scrollX className={styles.filterTabs} showScrollbar={false}>
          {filterOptions.map(option => (
            <View
              key={option.value}
              className={classnames(styles.filterTab, filterStatus === option.value && styles.active)}
              onClick={() => setFilterStatus(option.value)}
            >
              <Text>{option.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.selectAllBar}>
        <Checkbox
          value="all"
          checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
          onChange={handleSelectAll}
          color="#165DFF"
        />
        <Text className={styles.selectAllText}>
          {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0
            ? '取消全选'
            : '全选'}
        </Text>
        <Text className={styles.selectedCount}>
          已选 {selectedAssets.length} / {filteredAssets.length} 件
        </Text>
      </View>

      <View className={styles.assetList}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset: Asset) => (
            <View
              key={asset.id}
              className={classnames(
                styles.assetCard,
                selectedAssets.includes(asset.id) && styles.selected
              )}
              onClick={() => handleAssetToggle(asset.id)}
            >
              <Checkbox
                value={asset.id}
                checked={selectedAssets.includes(asset.id)}
                color="#165DFF"
                onClick={(e) => {
                  e.stopPropagation?.()
                  handleAssetToggle(asset.id)
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
                  <Text className={styles.assetOwner}>
                    当前使用人：{asset.currentUserName}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="📦"
            title="暂无符合条件的资产"
            description="试试调整搜索条件或筛选状态"
          />
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.userSelect}>
          <Text className={styles.userLabel}>新负责人：</Text>
          <Picker
            mode="selector"
            range={availableUsers.map(u => `${u.name} (${u.department})`)}
            value={selectedUserIndex}
            onChange={handleUserChange}
          >
            <View className={styles.pickerWrapper}>
              <Text className={classnames(styles.pickerText, selectedUserIndex < 0 && styles.placeholder)}>
                {selectedUserIndex >= 0
                  ? `${availableUsers[selectedUserIndex].name} (${availableUsers[selectedUserIndex].department})`
                  : '请选择负责人'}
              </Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>
        <Button
          className={classnames(styles.confirmBtn, selectedAssets.length === 0 && styles.disabled)}
          onClick={handleConfirm}
          disabled={selectedAssets.length === 0}
        >
          确认调整 ({selectedAssets.length})
        </Button>
      </View>

      {showConfirm && (
        <View className={styles.confirmModal} onClick={() => setShowConfirm(false)}>
          <View className={styles.confirmContent} onClick={(e) => e.stopPropagation?.()}>
            <Text className={styles.confirmTitle}>确认调整</Text>
            <Text className={styles.confirmDesc}>
              确定将 {selectedAssets.length} 件资产的负责人调整为
              <Text style={{ color: '#165DFF', fontWeight: 600 }}>
                {' '}{availableUsers[selectedUserIndex]?.name}
              </Text>{' '}
              吗？
            </Text>
            <View className={styles.confirmButtons}>
              <Button
                className={styles.cancelBtn}
                onClick={() => setShowConfirm(false)}
              >
                取消
              </Button>
              <Button className={styles.okBtn} onClick={handleSubmit}>
                确认
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default BatchOwnerPage
