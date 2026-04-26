import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'fronted-trao',
  date: '2026-4-19',
  designWidth: 400,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    400: 1.875,  // 750/400 = 1.875
    375: 2
  },

  sourceRoot: 'src',
  outputRoot: 'dist',

  framework: 'react',

  compiler: {
    type: 'webpack5'
  },

  plugins: [],
  
  defineConstants: {},
  
  copy: {
    patterns: [],
    options: {}
  },



  mini: {
    debugReact: true,
    prebundle: {
      enable: false
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          unitToConvert: 'rpx',
          rpxUnit: 1.875
        }
      },
      url: {
        enable: true,
        config: {
          limit: 10240
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  
  h5: {
    esnextModules: ['@tarojs/taro'],
    router: {
      mode: 'browser'
    },
    // H5 禁用默认 TabBar，使用自定义 TabBar 组件
    tabBar: false,
    // 配置环境支持 async/await
    publicPath: '/',
    staticDirectory: 'static',
    // 禁用模块联邦警告
    module: {
      federation: false
    },
    devServer: {
      port: 10086,
      https: false,
      proxy: {
        '/api': {
          target: 'http://192.168.1.3:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api': '/api'
          }
        }
      }
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          unitToConvert: 'rpx',
          rpxUnit: 1.875
        }
      },
      url: {
        enable: true,
        config: {
          limit: 10240
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
})
