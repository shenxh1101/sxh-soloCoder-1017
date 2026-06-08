import React, { useState, useMemo } from 'react'
import { View, Text, Button, ScrollView, Input, Checkbox, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import type { InventoryFilter } from '@/types/asset'
import { formatPrice } from '@/utils/format'
import styles from './index.module.scss'

const InventoryCreatePage: React.FC = () => {
  const { assets, currentUser, filterAssetsForInventory, createInventoryTask } = useAssetStore()

  const [taskName, setTaskName] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'department' | 'location' | 'category'>('all')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [includeScrap, setIncludeScrap] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const departments = useMemo(() => {
    const deptSet = new Set<string>()
    assets.forEach(asset => {
      const dept = asset.location.split('-')[0]
      if (dept) deptSet.add(dept)
    })
    return Array.from(deptSet).sort()
  }, [assets])

  const locations = useMemo(() => {
    const locSet = new Set<string>()
    assets.forEach(asset => locSet.add(asset.location))
    return Array.from(locSet).sort()
  }, [assets])

  const categories = useMemo(() => {
    const catSet = new Set<string>()
    assets.forEach(asset => catSet.add(asset.category))
    return Array.from(catSet).sort()
  }, [assets])

  const isFilterComplete = useMemo(() => {
    if (filterType === 'all') return true
    if (filterType === 'department') return selectedDept !== ''
    if (filterType === 'location') return selectedLocation !== ''
    if (filterType === 'category') return selectedCategory !== ''
    return false
  }, [filterType, selectedDept, selectedLocation, selectedCategory])

  const filter: InventoryFilter = useMemo(() => {
    const f: InventoryFilter = { includeScrap }
    if (!isFilterComplete) return f
    if (filterType === 'department' && selectedDept) {
      f.department = selectedDept
    } else if (filterType === 'location' && selectedLocation) {
      f.location = selectedLocation
    } else if (filterType === 'category' && selectedCategory) {
      f.category = selectedCategory
    }
    return f
  }, [filterType, selectedDept, selectedLocation, selectedCategory, includeScrap, isFilterComplete])

  const previewAssets = useMemo(() => {
    if (!isFilterComplete) return []
    return filterAssetsForInventory(filter)
  }, [filter, filterAssetsForInventory, isFilterComplete])

  const totalValue = useMemo(() => {
    return previewAssets.reduce((sum, a) => sum + a.price, 0)
  }, [previewAssets])

  const canSubmit = taskName.trim() !== '' && isFilterComplete && previewAssets.length > 0

  const getSubmitError = () => {
    if (taskName.trim() === '') return '请填写任务名称'
    if (!isFilterComplete) {
      if (filterType === 'department') return '请选择具体部门'
      if (filterType === 'location') return '请选择具体位置'
      if (filterType === 'category') return '请选择具体类别'
    }
    if (previewAssets.length === 0) return '当前筛选条件下没有资产'
    return ''
  }

  const handleSubmit = () => {
    if (currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅管理员可创建盘点', icon: 'none' })
      return
    }

    const error = getSubmitError()
    if (error) {
      Taro.showToast({ title: error, icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认创建',
      content: `即将创建「${taskName}」，共 ${previewAssets.length} 件资产，是否确认？`,
      success: (res) => {
        if (res.confirm) {
          const newTask = createInventoryTask({
            name: taskName,
            description: taskDesc || '盘点任务',
            filter
          })
          Taro.showToast({ title: '创建成功', icon: 'success' })
          setTimeout(() => {
            Taro.redirectTo({ url: `/pages/inventory-detail/index?id=${newTask.id}` })
          }, 500)
        }
      }
    })
  }

  const getFilterLabel = () => {
    if (filterType === 'all') return '全公司'
    if (filterType === 'department') return selectedDept || '请选择部门'
    if (filterType === 'location') return selectedLocation || '请选择位置'
    if (filterType === 'category') return selectedCategory || '请选择类别'
    return '未设置'
  }

  const filterTypeOptions = [
    { label: '全公司', value: 'all', icon: '🏢' },
    { label: '按部门', value: 'department', icon: '👥' },
    { label: '按位置', value: 'location', icon: '📍' },
    { label: '按类别', value: 'category', icon: '📦' }
  ]

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>新建盘点任务</Text>
        <Text className={styles.headerSubtitle}>设置盘点范围和规则</Text>
      </View>

      <View className={styles.formSection}>
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>任务名称 *</Text>
          <Input
            className={styles.formInput}
            placeholder="如：2024年Q3资产盘点"
            value={taskName}
            onInput={(e) => setTaskName(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formLabel}>任务描述</Text>
          <Input
            className={styles.formInput}
            placeholder="简单描述本次盘点的目的和范围"
            value={taskDesc}
            onInput={(e) => setTaskDesc(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>盘点范围</Text>
        
        <View className={styles.filterTypeGrid}>
          {filterTypeOptions.map(option => (
            <View
              key={option.value}
              className={classnames(
                styles.filterTypeItem,
                filterType === option.value && styles.filterTypeItemActive
              )}
              onClick={() => {
                setFilterType(option.value as any)
                setSelectedDept('')
                setSelectedLocation('')
                setSelectedCategory('')
              }}
            >
              <Text className={styles.filterTypeIcon}>{option.icon}</Text>
              <Text className={styles.filterTypeText}>{option.label}</Text>
            </View>
          ))}
        </View>

        {filterType === 'department' && (
          <View className={styles.selectSection}>
            <Text className={styles.selectLabel}>选择部门</Text>
            <View className={styles.selectOptions}>
              {departments.map(dept => (
                <View
                  key={dept}
                  className={classnames(
                    styles.selectOption,
                    selectedDept === dept && styles.selectOptionActive
                  )}
                  onClick={() => setSelectedDept(dept)}
                >
                  <Checkbox
                    value={dept}
                    checked={selectedDept === dept}
                    color="#165DFF"
                    onClick={() => setSelectedDept(dept)}
                  />
                  <Text>{dept}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {filterType === 'location' && (
          <View className={styles.selectSection}>
            <Text className={styles.selectLabel}>选择存放位置</Text>
            <View className={styles.selectOptions}>
              {locations.map(loc => (
                <View
                  key={loc}
                  className={classnames(
                    styles.selectOption,
                    selectedLocation === loc && styles.selectOptionActive
                  )}
                  onClick={() => setSelectedLocation(loc)}
                >
                  <Checkbox
                    value={loc}
                    checked={selectedLocation === loc}
                    color="#165DFF"
                    onClick={() => setSelectedLocation(loc)}
                  />
                  <Text>{loc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {filterType === 'category' && (
          <View className={styles.selectSection}>
            <Text className={styles.selectLabel}>选择资产类别</Text>
            <View className={styles.selectOptions}>
              {categories.map(cat => (
                <View
                  key={cat}
                  className={classnames(
                    styles.selectOption,
                    selectedCategory === cat && styles.selectOptionActive
                  )}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <Checkbox
                    value={cat}
                    checked={selectedCategory === cat}
                    color="#165DFF"
                    onClick={() => setSelectedCategory(cat)}
                  />
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.scrapSection}>
          <View className={styles.scrapInfo}>
            <Text className={styles.scrapLabel}>包含已报废资产</Text>
            <Text className={styles.scrapDesc}>开启后，已报废资产也会纳入盘点范围</Text>
          </View>
          <Switch
            checked={includeScrap}
            onChange={(e) => setIncludeScrap(e.detail.value)}
            color="#165DFF"
          />
        </View>
      </View>

      <View className={styles.previewSection}>
        <View
          className={styles.previewHeader}
          onClick={() => setShowPreview(!showPreview)}
        >
          <View>
            <Text className={styles.previewTitle}>应盘资产预览</Text>
            <Text className={styles.previewSubtitle}>
              范围：{getFilterLabel()} · {previewAssets.length}件 · {formatPrice(totalValue)}
            </Text>
          </View>
          <Text className={styles.previewArrow}>{showPreview ? '▲' : '▼'}</Text>
        </View>

        {showPreview && (
          <View className={styles.previewContent}>
            {!isFilterComplete ? (
              <View className={styles.previewEmpty}>
                <Text>请先选择具体的{filterType === 'department' ? '部门' : filterType === 'location' ? '位置' : '类别'}</Text>
              </View>
            ) : previewAssets.length > 0 ? (
              previewAssets.map(asset => (
                <View key={asset.id} className={styles.previewItem}>
                  <View className={styles.previewItemInfo}>
                    <Text className={styles.previewItemName}>{asset.name}</Text>
                    <Text className={styles.previewItemCode}>{asset.code}</Text>
                    <Text className={styles.previewItemMeta}>
                      {asset.location} · {asset.category}
                    </Text>
                  </View>
                  <Text className={styles.previewItemPrice}>{formatPrice(asset.price)}</Text>
                </View>
              ))
            ) : (
              <View className={styles.previewEmpty}>
                <Text>暂无符合条件的资产</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          创建盘点任务
        </Button>
      </View>
    </ScrollView>
  )
}

export default InventoryCreatePage
