# IPPure 模块故障排查指南

## 问题现象
Surge 面板无法显示 IP 纯净度信息

## 可能原因及解决方案

### 1️⃣ **网络连接问题**
**症状**: 面板显示"获取失败"或无任何内容

**解决方案**:
```bash
# 测试 API 连通性
curl -s "https://my.ippure.com/v1/info"
```
如果无法访问，检查：
- Surge 是否允许脚本访问外部网络
- 防火墙/DNS 设置是否拦截了 ippure.com

---

### 2️⃣ **模块配置错误**
**症状**: 面板完全不显示

**检查清单**:
- [ ] 模块是否已启用（Surge → 模块 → 查看开关状态）
- [ ] 脚本路径是否正确
- [ ] `update-interval` 是否设置（建议 3600 秒）

**正确配置示例**:
```ini
[Panel]
IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600

[Script]
IPPure-IP-Info = type=generic, script-path=https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure_panel.js, timeout=10
```

---

### 3️⃣ **超时时间过短**
**症状**: 偶尔显示成功，但经常失败

**解决方案**:
已将单个请求超时时间设置为 4 秒,确保双 IP 并行请求能在 Surge 的 5 秒全局超时内完成(v2.1 版本)

---

### 4️⃣ **策略组冲突**
**症状**: 代理 IP 部分显示"未检出代理组"

**原因**: 
- 策略组名称不在自动检测列表中
- 策略组被过滤（如 DIRECT、REJECT 等系统组）

**解决方案**:
手动指定策略组：
```ini
[Panel]
IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600, argument=policy=你的策略组名
```

---

### 5️⃣ **Surge 版本过低**
**要求**: Surge iOS 5.0+ 或 Surge Mac 4.0+

**检查方法**:
Surge → 关于 → 查看版本号

---

## 调试步骤

### 步骤 1: 使用调试版本
安装调试模块查看详细日志：
```
https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure_debug.sgmodule
```

### 步骤 2: 查看日志
1. 打开 Surge
2. 点击"最近请求"或"日志"
3. 搜索 `[IPPure]` 关键词
4. 查看错误信息

### 步骤 3: 手动测试 API
在终端运行：
```bash
curl -s "https://my.ippure.com/v1/info" | jq .
```

预期输出应包含：
- `fraudScore`: 风险评分
- `isResidential`: 是否住宅 IP
- `isBroadcast`: 是否广播 IP

---

## 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `请求失败` | 网络不通或 API 故障 | 检查网络连接 |
| `无数据返回` | API 返回空响应 | 稍后重试 |
| `JSON 解析失败` | API 返回格式错误 | 检查 API 是否正常 |
| `未检出代理组` | 无可用策略组 | 手动指定 policy 参数 |

---

## 版本更新日志

### v3.0.2 (2026-01-02)
- 🔧 修复延迟显示问题:通过测量 API 响应时间获取实际延迟
- 📊 现在会显示代理节点的真实延迟而不是 "?"
- 💡 改进延迟测量准确性

### v3.0 (2026-01-02)
- 🎯 完全重构为单节点监控模式
- 📊 显示纯净度百分比(100% = 最干净)
- ⏱️ 添加节点延迟显示
- 🎯 固定监控"自动测速"策略组
- 🗑️ 移除本地 DIRECT IP 检测
- 📝 全新的显示格式：节点名 | 纯净度% | IP类型 | 地理位置 | 延迟

### v2.5 (2026-01-02)
- 💡 改进提示信息,移除误导性的"长按编辑"说明
- 📝 显示当前检测的策略组和下一个切换目标

### v2.0 - v2.4
- 双 IP 检测模式（已弃用）

### v1.0
- 初始版本
