import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'fronted-trao',
  date: '2024-01-01',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
  },
  copy: {
    patterns: [
    ],
    options: {
    }
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: true,
    prebundle: {
      enable: true
    }
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          unitToConvert: 'rpx',
          rpxUnit: 3.75
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
    devServer: {
      port: 10086,
      https: false
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          unitToConvert: 'rpx',
          rpxUnit: 3.75
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
