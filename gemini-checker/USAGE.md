# 使用指南

本指南详细说明如何使用Gemini节点检测器模块。

## 快速开始

### 1. 检查配置

确保你的Surge配置中有名为 **"Gemini"** 的策略组：

```ini
[Proxy Group]
Gemini = select, 香港节点01, 新加坡节点02, 日本节点03, ...
```

### 2. 安装模块

参考README.md中的安装方法。

### 3. 运行检测

在Surge主界面找到"Gemini节点检测"面板，点击即可运行。

## 高级配置

### 更改策略组名称

修改 `gemini_checker.sgmodule` 文件：

```ini
[Script]
gemini_checker = type=generic,timeout=60,script-path=gemini_checker.js,argument=你的策略组名
```

### 调整超时时间

修改 `gemini_checker.js` 中的常量：

```javascript
const TIMEOUT = 5000; // 单节点超时（毫秒）
```

模块总超时在 `.sgmodule` 文件中设置：

```ini
gemini_checker = type=generic,timeout=60,...  // 总超时（秒）
```

## 故障排查

### 问题：面板不显示
- 确认模块已启用
- 检查Surge日志查看错误信息
- 重启Surge应用

### 问题：所有节点不可用
- 检查网络连接
- 确认节点本身可用
- 尝试手动访问Gemini API

### 问题：检测速度慢
- 正常现象（串行检测所有节点）
- 减少策略组中的节点数量
- 或者耐心等待

## 最佳实践

1. **定期检测**：建议在使用Gemini前进行检测
2. **保持节点更新**：及时清理失效节点
3. **记录结果**：可以截图保存检测结果供参考
