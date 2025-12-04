# 部署指南

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开显示的地址（通常是 http://localhost:5173）

## 构建生产版本

```bash
npm run build
```

构建产物会在 `dist` 目录中。

## 部署到 GitHub Pages

### 方法一：手动部署

1. 在 GitHub 上创建新仓库
2. 将代码推送到仓库：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

3. 在 GitHub 仓库设置中：
   - 进入 Settings > Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"，文件夹选择 "/ (root)"
   - 点击 Save

4. 手动构建并推送 dist 目录：
```bash
npm run build
# 将 dist 目录的内容推送到 gh-pages 分支
```

### 方法二：使用 GitHub Actions 自动部署（推荐）

1. 创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. 在仓库设置中启用 GitHub Pages，选择 `gh-pages` 分支作为源

3. 每次推送到 main 分支时，GitHub Actions 会自动构建并部署

## 注意事项

- 确保 `vite.config.js` 中的 `base: './'` 设置正确，这样资源路径才能正确加载
- 如果部署到子目录，需要修改 `base` 为对应的路径，例如 `base: '/clock-in-out-statistics/'`

