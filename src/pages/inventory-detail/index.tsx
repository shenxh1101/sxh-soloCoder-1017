import React, { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Checkbox, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useAssetStore } from '@/store/useAssetStore'
import StatusTag from '@/components/StatusTag'
import EmptyState from '@/components/EmptyState'
import type { InventoryAssetSnapshot, InventoryExportType } from '@/types/asset'
import { InventoryAuditActionMap, InventoryExportTypeMap } from '@/types/asset'
import { formatPrice, formatDateTime } from '@/utils/format'
import { handleAssetScan } from '@/utils/scan'
import styles from './index.module.scss'

const InventoryDetailPage: React.FC = () => {
  const router = useRouter()
  const taskId = router.params.id || ''
  const autoShowReport = router.params.report === '1'

  const {
    getInventoryTaskById,
    currentUser,
    startInventoryTask,
    checkInventoryAsset,
    markInventoryMissing,
    unmarkInventoryMissing,
    completeInventoryTask,
    scanInventoryAsset,
    exportInventoryReport
  } = useAssetStore()

  const task = getInventoryTaskById(taskId)
  const [showReport, setShowReport] = useState(autoShowReport && task?.status === 'completed')
  const [showAudit, setShowAudit] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'checked' | 'missing' | 'pending'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [expandedLocs, setExpandedLocs] = useState<Set<string>>(new Set())
  const [summaryView, setSummaryView] = useState<'department' | 'location' | 'none'>('none')

  useEffect(() => {
    console.log('[InventoryDetailPage] 盘点详情:', taskId, '任务:', task?.name, 'autoShowReport:', autoShowReport)
    if (!task) {
      Taro.showToast({ title: '盘点任务不存在', icon: 'none' })
    }
    if (autoShowReport && task?.status === 'completed') {
      setShowReport(true)
    }
  }, [taskId, task, autoShowReport])

  if (!task) {
    return <View className={styles.page} />
  }

  const snapshotAssets = task.assetSnapshot
  const isCompleted = task.status === 'completed'
  const isPending = task.status === 'pending'
  const checkedCount = task.checkedAssets.length
  const missingCount = task.missingAssets.length
  const pendingCount = task.totalAssets - checkedCount - missingCount

  const filteredAssets = snapshotAssets.filter(asset => {
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
      (assetId) => {
        const result = scanInventoryAsset(taskId, assetId)
        Taro.showToast({ 
          title: result.message, 
          icon: result.success ? 'success' : 'none' 
        })
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
    
    const isCurrentlyMissing = task.missingAssets.includes(assetId)
    const asset = snapshotAssets.find(a => a.id === assetId)
    
    if (isCurrentlyMissing) {
      unmarkInventoryMissing(taskId, assetId)
      Taro.showToast({ title: '已取消标记', icon: 'none' })
    } else {
      markInventoryMissing(taskId, assetId)
      Taro.showToast({ title: `已标记缺失: ${asset?.name}`, icon: 'none' })
    }
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
    setShowAudit(false)
  }

  const handleViewAudit = () => {
    setShowAudit(true)
    setShowReport(false)
  }

  const handleExport = (type: InventoryExportType, groupName?: string) => {
    setShowExportMenu(false)
    const content = exportInventoryReport(taskId, { type, groupName })
    
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({ title: '报告已复制到剪贴板', icon: 'success' })
      }
    })
    
    console.log('[Export] 导出报告:', { type, groupName })
  }

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '已盘', value: 'checked' },
    { label: '缺失', value: 'missing' },
    { label: '待盘', value: 'pending' }
  ]

  if (showReport) {
    const pendingAssets = snapshotAssets.filter(asset => 
      !task.checkedAssets.includes(asset.id) && 
      !task.missingAssets.includes(asset.id)
    )

    const checkedAssets = snapshotAssets.filter(asset => task.checkedAssets.includes(asset.id))
    const missingAssets = snapshotAssets.filter(asset => task.missingAssets.includes(asset.id))

    const totalValue = snapshotAssets.reduce((sum, a) => sum + a.price, 0)
    const checkedValue = checkedAssets.reduce((sum, a) => sum + a.price, 0)
    const missingValue = missingAssets.reduce((sum, a) => sum + a.price, 0)
    const pendingValue = pendingAssets.reduce((sum, a) => sum + a.price, 0)

    const deptMap = new Map<string, InventoryAssetSnapshot[]>()
    snapshotAssets.forEach(asset => {
      if (!deptMap.has(asset.department)) {
        deptMap.set(asset.department, [])
      }
      deptMap.get(asset.department)!.push(asset)
    })
    const byDepartment = Array.from(deptMap.entries()).map(([name, assets]) => ({
      name,
      count: assets.length,
      totalValue: assets.reduce((sum, a) => sum + a.price, 0),
      checkedCount: assets.filter(a => task.checkedAssets.includes(a.id)).length,
      missingCount: assets.filter(a => task.missingAssets.includes(a.id)).length,
      pendingCount: assets.filter(a => !task.checkedAssets.includes(a.id) && !task.missingAssets.includes(a.id)).length,
      assets
    }))

    const locMap = new Map<string, InventoryAssetSnapshot[]>()
    snapshotAssets.forEach(asset => {
      if (!locMap.has(asset.location)) {
        locMap.set(asset.location, [])
      }
      locMap.get(asset.location)!.push(asset)
    })
    const byLocation = Array.from(locMap.entries()).map(([name, assets]) => ({
      name,
      count: assets.length,
      totalValue: assets.reduce((sum, a) => sum + a.price, 0),
      checkedCount: assets.filter(a => task.checkedAssets.includes(a.id)).length,
      missingCount: assets.filter(a => task.missingAssets.includes(a.id)).length,
      pendingCount: assets.filter(a => !task.checkedAssets.includes(a.id) && !task.missingAssets.includes(a.id)).length,
      assets
    }))

    const toggleDept = (name: string) => {
      const newSet = new Set(expandedDepts)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      setExpandedDepts(newSet)
    }

    const toggleLoc = (name: string) => {
      const newSet = new Set(expandedLocs)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      setExpandedLocs(newSet)
    }

    const getAssetResult = (assetId: string) => {
      if (task.checkedAssets.includes(assetId)) return { text: '已盘', color: '#00B42A' }
      if (task.missingAssets.includes(assetId)) return { text: '缺失', color: '#F53F3F' }
      return { text: '待盘', color: '#86909C' }
    }

    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>盘点报告</Text>
          <Text className={styles.headerSubtitle}>{task.name}</Text>
        </View>

        <View className={styles.reportTabBar}>
          <View
            className={classnames(styles.reportTab, !showAudit && styles.reportTabActive)}
            onClick={() => setShowAudit(false)}
          >
            <Text>📊 盘点结果</Text>
          </View>
          <View
            className={classnames(styles.reportTab, showAudit && styles.reportTabActive)}
            onClick={() => setShowAudit(true)}
          >
            <Text>📝 操作流水</Text>
          </View>
        </View>

        {!showAudit ? (
          <ScrollView scrollY className={styles.reportScroll}>
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
                  <Text className={styles.statSubLabel}>{formatPrice(totalValue)}</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#00B42A' }}>{checkedCount}</Text>
                  <Text className={styles.statLabel}>已盘</Text>
                  <Text className={styles.statSubLabel} style={{ color: '#00B42A' }}>{formatPrice(checkedValue)}</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{missingCount}</Text>
                  <Text className={styles.statLabel}>缺失</Text>
                  <Text className={styles.statSubLabel} style={{ color: '#F53F3F' }}>{formatPrice(missingValue)}</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#86909C' }}>{pendingCount}</Text>
                  <Text className={styles.statLabel}>待盘</Text>
                  <Text className={styles.statSubLabel} style={{ color: '#86909C' }}>{formatPrice(pendingValue)}</Text>
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

              <View className={styles.summaryTabBar}>
                <View
                  className={classnames(styles.summaryTab, summaryView === 'department' && styles.summaryTabActive)}
                  onClick={() => setSummaryView(summaryView === 'department' ? 'none' : 'department')}
                >
                  <Text>📊 按部门汇总</Text>
                </View>
                <View
                  className={classnames(styles.summaryTab, summaryView === 'location' && styles.summaryTabActive)}
                  onClick={() => setSummaryView(summaryView === 'location' ? 'none' : 'location')}
                >
                  <Text>📍 按位置汇总</Text>
                </View>
              </View>

              {summaryView === 'department' && (
                <View className={styles.summarySection}>
                  {byDepartment.map(item => (
                    <View key={item.name} className={styles.summaryGroup}>
                      <View className={styles.summaryGroupHeader} onClick={() => toggleDept(item.name)}>
                        <View className={styles.summaryGroupInfo}>
                          <Text className={styles.summaryGroupName}>{item.name}</Text>
                          <Text className={styles.summaryGroupCount}>
                            {item.count}件 / {formatPrice(item.totalValue)}
                          </Text>
                        </View>
                        <View className={styles.summaryGroupStats}>
                          <Text style={{ color: '#00B42A' }}>{item.checkedCount}✓</Text>
                          <Text style={{ color: '#F53F3F', marginLeft: 12 }}>{item.missingCount}✗</Text>
                          <Text style={{ color: '#86909C', marginLeft: 12 }}>{item.pendingCount}○</Text>
                        </View>
                        <Text className={styles.summaryArrow}>
                          {expandedDepts.has(item.name) ? '▲' : '▼'}
                        </Text>
                      </View>
                      {expandedDepts.has(item.name) && (
                        <View className={styles.summaryGroupContent}>
                          {item.assets.map(asset => {
                            const result = getAssetResult(asset.id)
                            return (
                              <View key={asset.id} className={styles.summaryAssetItem}>
                                <View className={styles.summaryAssetInfo}>
                                  <Text className={styles.summaryAssetName}>{asset.name}</Text>
                                  <Text className={styles.summaryAssetCode}>{asset.code}</Text>
                                </View>
                                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Text style={{ color: result.color, fontSize: 24 }}>{result.text}</Text>
                                  <Text className={styles.summaryAssetPrice}>{formatPrice(asset.price)}</Text>
                                </View>
                              </View>
                            )
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {summaryView === 'location' && (
                <View className={styles.summarySection}>
                  {byLocation.map(item => (
                    <View key={item.name} className={styles.summaryGroup}>
                      <View className={styles.summaryGroupHeader} onClick={() => toggleLoc(item.name)}>
                        <View className={styles.summaryGroupInfo}>
                          <Text className={styles.summaryGroupName}>{item.name}</Text>
                          <Text className={styles.summaryGroupCount}>
                            {item.count}件 / {formatPrice(item.totalValue)}
                          </Text>
                        </View>
                        <View className={styles.summaryGroupStats}>
                          <Text style={{ color: '#00B42A' }}>{item.checkedCount}✓</Text>
                          <Text style={{ color: '#F53F3F', marginLeft: 12 }}>{item.missingCount}✗</Text>
                          <Text style={{ color: '#86909C', marginLeft: 12 }}>{item.pendingCount}○</Text>
                        </View>
                        <Text className={styles.summaryArrow}>
                          {expandedLocs.has(item.name) ? '▲' : '▼'}
                        </Text>
                      </View>
                      {expandedLocs.has(item.name) && (
                        <View className={styles.summaryGroupContent}>
                          {item.assets.map(asset => {
                            const result = getAssetResult(asset.id)
                            return (
                              <View key={asset.id} className={styles.summaryAssetItem}>
                                <View className={styles.summaryAssetInfo}>
                                  <Text className={styles.summaryAssetName}>{asset.name}</Text>
                                  <Text className={styles.summaryAssetCode}>{asset.code}</Text>
                                </View>
                                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Text style={{ color: result.color, fontSize: 24 }}>{result.text}</Text>
                                  <Text className={styles.summaryAssetPrice}>{formatPrice(asset.price)}</Text>
                                </View>
                              </View>
                            )
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {missingCount > 0 && (
                <View className={styles.missingSection}>
                  <Text className={styles.sectionTitle}>缺失资产清单 ({missingCount})</Text>
                  {missingAssets.map(asset => (
                    <View key={asset.id} className={styles.missingItem}>
                      <View className={styles.missingInfo}>
                        <Text className={styles.missingName}>{asset.name}</Text>
                        <Text className={styles.missingCode}>{asset.code}</Text>
                        <Text style={{ fontSize: 22, color: '#86909C' }}>
                          {asset.department} · {asset.location}
                          {asset.currentUserName ? ` · ${asset.currentUserName}` : ''}
                        </Text>
                      </View>
                      <Text className={styles.missingValue}>{formatPrice(asset.price)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {checkedCount > 0 && (
                <View className={styles.checkedSection}>
                  <Text className={styles.sectionTitle}>已盘点资产 ({checkedCount})</Text>
                  {checkedAssets.map(asset => (
                    <View key={asset.id} className={styles.checkedItem}>
                      <View className={styles.checkedInfo}>
                        <Text className={styles.checkedName}>{asset.name}</Text>
                        <Text className={styles.checkedCode}>{asset.code}</Text>
                        <Text style={{ fontSize: 22, color: '#86909C' }}>
                          {asset.department} · {asset.location}
                          {asset.currentUserName ? ` · ${asset.currentUserName}` : ''}
                        </Text>
                      </View>
                      <Text className={styles.checkedValue}>✓</Text>
                    </View>
                  ))}
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
                        <Text style={{ fontSize: 22, color: '#86909C' }}>
                          {asset.department} · {asset.location}
                          {asset.currentUserName ? ` · ${asset.currentUserName}` : ''}
                        </Text>
                      </View>
                      <Text className={styles.pendingValue}>○</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView scrollY className={styles.auditContent}>
            {task.auditLogs && task.auditLogs.length > 0 ? (
              task.auditLogs.slice().reverse().map(log => {
                const actionInfo = InventoryAuditActionMap[log.action]
                return (
                  <View key={log.id} className={styles.auditItem}>
                    <View className={styles.auditIcon} style={{ backgroundColor: `${actionInfo.color}15` }}>
                      <Text style={{ color: actionInfo.color }}>{actionInfo.icon}</Text>
                    </View>
                    <View className={styles.auditInfo}>
                      <View className={styles.auditHeader}>
                        <Text className={styles.auditAction} style={{ color: actionInfo.color }}>
                          {actionInfo.label}
                        </Text>
                        <Text className={styles.auditTime}>{formatDateTime(log.createTime)}</Text>
                      </View>
                      <Text className={styles.auditOperator}>操作人：{log.operatorName}</Text>
                      {log.assetName && (
                        <Text className={styles.auditAsset}>
                          资产：{log.assetName} ({log.assetCode})
                        </Text>
                      )}
                      {log.remark && (
                        <Text className={styles.auditRemark}>备注：{log.remark}</Text>
                      )}
                    </View>
                  </View>
                )
              })
            ) : (
              <EmptyState
                icon="📝"
                title="暂无操作记录"
                description="开始盘点后会自动记录所有操作"
              />
            )}
          </ScrollView>
        )}

        {!showAudit && (
          <View className={styles.exportMenu} style={{ display: showExportMenu ? 'flex' : 'none' }}>
            <View className={styles.exportMenuMask} onClick={() => setShowExportMenu(false)} />
            <View className={styles.exportMenuContent}>
              <Text className={styles.exportMenuTitle}>选择导出方式</Text>
              {(['full', 'missing', 'byDepartment', 'byLocation'] as InventoryExportType[]).map(type => {
                const typeInfo = InventoryExportTypeMap[type]
                return (
                  <View
                    key={type}
                    className={styles.exportMenuItem}
                    onClick={() => handleExport(type)}
                  >
                    <View>
                      <Text className={styles.exportItemLabel}>{typeInfo.label}</Text>
                      <Text className={styles.exportItemDesc}>{typeInfo.desc}</Text>
                    </View>
                    <Text className={styles.exportArrow}>›</Text>
                  </View>
                )
              })}
              <View className={styles.exportMenuCancel} onClick={() => setShowExportMenu(false)}>
                <Text>取消</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.bottomBar}>
          {!showAudit && (
            <Button className={styles.exportBtn} onClick={() => setShowExportMenu(true)}>
              📤 导出报告
            </Button>
          )}
          {autoShowReport ? (
            <Button
              className={styles.closeBtn}
              style={{ flex: 1 }}
              onClick={() => Taro.navigateBack()}
            >
              返回列表
            </Button>
          ) : (
            <>
              <Button className={styles.backBtn} onClick={() => {
                if (showAudit) {
                  setShowAudit(false)
                } else {
                  setShowReport(false)
                }
              }}>
                返回
              </Button>
              <Button
                className={styles.closeBtn}
                onClick={() => Taro.navigateBack()}
              >
                关闭
              </Button>
            </>
          )}
        </View>
      </View>
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
            filteredAssets.map((asset: InventoryAssetSnapshot) => {
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
                    value={asset.id}
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
