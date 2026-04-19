const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function buildWeapp() {
  console.log('=== 开始构建微信小程序 ===');
  
  try {
    console.log('1. 清理旧的dist目录...');
    execSync('rm -rf dist', { stdio: 'ignore' });
    
    console.log('2. 先运行开发模式生成预构建文件...');
    const devProcess = require('child_process').spawn('npm', ['run', 'dev:weapp'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    let compiled = false;
    
    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (output.includes('Watching...') && !compiled) {
        compiled = true;
        console.log('\n3. 预构建文件已生成，停止开发模式...');
        
        setTimeout(() => {
          devProcess.kill();
          
          setTimeout(() => {
            console.log('4. 运行生产模式构建...');
            execSync('set NODE_ENV=production && npm run build:weapp', { 
              stdio: 'inherit',
              cwd: process.cwd()
            });
            
            console.log('=== 构建完成 ===');
            process.exit(0);
          }, 1000);
        }, 2000);
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    devProcess.on('error', (err) => {
      console.error('启动开发模式失败:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

buildWeapp();