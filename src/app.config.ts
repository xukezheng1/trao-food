const isH5 = process.env.TARO_ENV === 'h5'

export default {
  pages: [
        'pages/home/index',
    'pages/order/index',
    'pages/login/index',
    'pages/register/index',
    'pages/family/index',
    'pages/orders/index',
    'pages/mall/index',
    'pages/expense/index'
  ],
  subpackages: [
    {
      root: 'orderPackage',
      pages: [
        'pages/orderConfirm/index',
        'pages/orderDetail/index',
        'pages/orderList/index',
        'pages/billStats/index'
      ]
    },
    {
      root: 'chefPackage',
      pages: [
        'pages/chefDetail/index',
        'pages/chefSubmission/index',
        'pages/foodieDishSubmit/index',
        'pages/chefOrders/index'
      ]
    },
    {
      root: 'recipePackage',
      pages: [
        'pages/recipe/index',
        'pages/recipeDetail/index',
        'pages/homeRecipe/index',
        'pages/aiRecipe/index'
      ]
    },
    {
      root: 'mallPackage',
      pages: [
        'pages/productPublish/index',
        'pages/blindBox/index',
        'pages/bindRelation/index'
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '美食生活',
    navigationBarBackgroundColor: '#FFF2F6',
    backgroundColor: '#FFF2F6',
    baseUrl: 'http://8.135.32.152/api'
  },
  usingComponents: {},
  entryPagePath: 'pages/home/index',
  // H5 环境不配置 tabBar，使用自定义 TabBar 组件
  // 小程序环境使用自定义 tabBar
  ...(isH5 ? {} : {
    tabBar: {
      custom: true,
      color: '#8C8C8C',
      selectedColor: '#E84D5B',
      backgroundColor: '#FFFFFF',
      borderStyle: 'white',
      list: [
                {
          pagePath: 'pages/home/index',
          text: '首页',
          iconPath: 'assets/homeIcon.jpg',
          selectedIconPath: 'assets/homeIcon.jpg'
        },
        {
          pagePath: 'pages/order/index',
          text: '首页',
          iconPath: 'assets/homeIcon.jpg',
          selectedIconPath: 'assets/homeIcon.jpg'
        },
        {
          pagePath: 'pages/orders/index',
          text: '任务',
          iconPath: 'assets/plan.jpg',
          selectedIconPath: 'assets/plan.jpg'
        },
        {
          pagePath: 'pages/mall/index',
          text: '点餐',
          iconPath: 'assets/diandan.jpg',
          selectedIconPath: 'assets/diandan.jpg'
        },
        {
          pagePath: 'pages/family/index',
          text: '商城',
          iconPath: 'assets/sahngcheng.jpg',
          selectedIconPath: 'assets/sahngcheng.jpg'
        },
        {
          pagePath: 'pages/login/index',
          text: '我的',
          iconPath: 'assets/my.jpg',
          selectedIconPath: 'assets/my.jpg'
        }
      ]
    }
  })
}
