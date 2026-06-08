export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/scan/index',
    'pages/borrow/index',
    'pages/repair/index',
    'pages/mine/index',
    'pages/asset-detail/index',
    'pages/asset-add/index',
    'pages/borrow-apply/index',
    'pages/approval-detail/index',
    'pages/dept-stats/index',
    'pages/inventory/index',
    'pages/qrcode/index',
    'pages/batch-owner/index',
    'pages/inventory-detail/index',
    'pages/inventory-create/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '企业资产管理',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '资产首页'
      },
      {
        pagePath: 'pages/scan/index',
        text: '扫码登记'
      },
      {
        pagePath: 'pages/borrow/index',
        text: '借用归还'
      },
      {
        pagePath: 'pages/repair/index',
        text: '维修报废'
      },
      {
        pagePath: 'pages/mine/index',
        text: '个人资产'
      }
    ]
  }
})
