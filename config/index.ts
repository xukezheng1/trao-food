import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'fronted-trao',
  date: '2026-4-19',
  designWidth: 400,

  sourceRoot: 'src',
  outputRoot: 'dist',

  framework: 'react',

  compiler: {
    type: 'webpack5'
  },

  mini: {
    debugReact: true,
    prebundle: {
      enable: false
    }
  },
  h5: {}
})