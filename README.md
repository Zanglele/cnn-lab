# 看懂卷积 · CNN 实验室

中文交互式 CNN 教学网站：卷积七步课、手绘矩阵、逐步扫描、多通道运算、可调超参数的 3D 网络、旋转与全屏查看。纯 HTML/CSS/JavaScript，无依赖，无后端，手绘不上传。

## 启用 GitHub Pages

Settings → Pages → Source 选择 Deploy from a branch → Branch 选择 main，文件夹选择 /docs → Save。部署成功后访问 https://zanglele.github.io/cnn-lab/ 。

## 本地使用

打开 docs/index.html。源码在 docs/，修改后提交到 main 即会更新已启用的 Pages。design/ 包含教学说明。

## 验证

安装 Node.js 后运行：

```sh
node tests/math.test.cjs
node tests/network-model.test.cjs
node tests/interaction.test.cjs
node tests/cnn-bridge.test.cjs
node tests/cnn-bridge-flow.test.cjs
```

交互测试使用 DOM/Canvas 替身，不替代浏览器视觉验收。网络使用固定教学权重，未训练，不承诺识别效果。U-Net 仅为结构示意。
