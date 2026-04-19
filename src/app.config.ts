export default {
  pages: [
    'pages/order/index',
    'pages/login/index',
    'pages/register/index',
    'pages/home/index',
    'pages/orders/index',
    'pages/mall/index',
    'pages/expense/index',
    'pages/family/index',
    'pages/recipe/index',
    'pages/recipeDetail/index',
    'pages/blindBox/index',
    'pages/chefDetail/index',
    'pages/orderConfirm/index',
    'pages/orderDetail/index',
    'pages/orderList/index',
    'pages/chefOrders/index',
    'pages/billStats/index',
    'pages/homeRecipe/index',
    'pages/aiRecipe/index',
    'pages/productPublish/index',
    'pages/chefSubmission/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '美食生活',
    navigationBarBackgroundColor: '#FFF2F6',
    backgroundColor: '#FFF2F6'
  },
  tabBar: {
    custom: true,
    color: '#8C8C8C',
    selectedColor: '#E84D5B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/order/index',
        text: '点餐',
        iconPath: 'assets/dachu.png',
        selectedIconPath: 'assets/dachu.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: 'assets/dachu.png',
        selectedIconPath: 'assets/dachu.png'
      },
      {
        pagePath: 'pages/mall/index',
        text: '商城',
        iconPath: 'assets/manghe.png',
        selectedIconPath: 'assets/manghe.png'
      },
      {
        pagePath: 'pages/expense/index',
        text: '记账',
        iconPath: 'assets/jizhang.png',
        selectedIconPath: 'assets/jizhang.png'
      },
      {
        pagePath: 'pages/family/index',
        text: '我的',
        iconPath: 'assets/homeIcon.png',
        selectedIconPath: 'assets/homeIcon.png'
      }
    ]
  }
}
