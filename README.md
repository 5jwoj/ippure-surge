# Surge 模块集合

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/5jwoj/Surge/blob/main/LICENSE)
[![Surge](https://img.shields.io/badge/Surge-iOS%205.0%2B%20%7C%20Mac%204.0%2B-orange.svg)](https://nssurge.com)

精选实用的Surge模块集合，提升您的网络体验。

## 📦 模块列表

### 1️⃣ IPPure - IP纯净度检测

实时监控代理节点的IP纯净度，帮助您选择最优质的代理服务器。

**功能特点**：
- 🎯 单节点监控
- 📊 纯净度评分 (0-100%)
- 🏠 IP类型识别（住宅/机房、原生/广播）
- 🌍 地理位置显示
- ⚡ 实时延迟测量

**安装地址**：
```
https://raw.githubusercontent.com/5jwoj/Surge/main/ippure/ippure.sgmodule
```

**详细文档**：[IPPure README](./ippure/README.md)

---

### 2️⃣ Gemini节点检测器

检测Gemini策略组中哪些节点可以访问Gemini API，并按延时排序显示结果。

**功能特点**：
- ✅ 自动节点发现
- ✅ Gemini API连通性测试
- ✅ 延时测量和排序
- 🥇 前三名节点特殊标记
- 📊 可用/不可用节点统计

**安装地址**：
```
https://raw.githubusercontent.com/5jwoj/Surge/main/gemini-checker/gemini_checker.sgmodule
```

**详细文档**：[Gemini Checker README](./gemini-checker/README.md)

---

## 🚀 快速开始

### 安装方法

1. 打开Surge应用
2. 点击底部「模块」标签
3. 点击右上角「+」
4. 选择「安装新模块」
5. 粘贴上方对应的模块URL
6. 点击「确定」

### 使用建议

- **IPPure**：适合需要监控代理IP质量的场景，特别是访问流媒体、电商等服务
- **Gemini Checker**：适合使用Gemini AI服务，需要找到最优节点的用户

## 📁 仓库结构

```
Surge/
├── README.md                # 本文件
├── ippure/                  # IP纯净度检测模块
│   ├── ippure.sgmodule
│   ├── ippure_panel.js
│   ├── README.md
│   └── TROUBLESHOOTING.md
└── gemini-checker/          # Gemini节点检测模块
    ├── gemini_checker.sgmodule
    ├── gemini_checker.js
    ├── README.md
    └── USAGE.md
```

## 🔧 要求

- **Surge iOS**: 5.0 或更高版本
- **Surge Mac**: 4.0 或更高版本

## 💡 常见问题

### 模块无法加载？
- 检查Surge版本是否符合要求
- 确认网络连接正常
- 查看Surge日志获取详细错误信息

### 面板不显示？
- 确认模块已启用
- 检查策略组名称是否正确
- 重启Surge应用

更多问题请查看各模块的详细文档。

## 📝 版本历史

### v1.0.0 (2026-01-06)
- 🎉 重构仓库结构
- ➕ 新增Gemini节点检测模块
- ✅ IPPure模块稳定版本

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。

## ⭐ Star

如果这些模块对您有帮助，请给个⭐支持一下！

---

**问题反馈**: [GitHub Issues](https://github.com/5jwoj/Surge/issues)
