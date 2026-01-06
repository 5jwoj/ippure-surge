# IPPure 故障排查指南

当 IPPure 面板无法正常工作时,请按照以下步骤排查问题。

## 常见问题

### 1️⃣ 面板显示"获取失败"

**症状**: 面板内容显示为"获取失败"或"Failed"

**可能原因**:
- 网络连接问题
- IPPure API 服务不可用
- 代理节点无法访问外部网络

**解决步骤**:

1. **测试 API 连通性**
   ```bash
   curl -s "https://my.ippure.com/v1/info"
   ```
   正常情况应返回 JSON 格式的 IP 信息。

2. **检查 Surge 网络设置**
   - 确认 Surge 处于启用状态
   - 检查是否有规则阻止了对 `ippure.com` 的访问

3. **切换节点测试**
   - 尝试切换到其他代理节点
   - 或暂时使用 DIRECT 模式测试

---

### 2️⃣ 延迟显示为 "?"

**症状**: 延迟字段显示问号而不是具体数值

**可能原因**:
- API 请求超时(超过 4 秒)
- 代理节点连接失败或不稳定
- 网络延迟过高

**解决方案**:
1. 检查当前代理节点是否正常工作
2. 使用 Surge 的"测试延迟"功能验证节点连接
3. 尝试切换到延迟较低的节点

---

### 3️⃣ 面板完全不显示

**症状**: Surge 面板区域看不到 IPPure 模块

**检查清单**:
- [ ] 模块是否已安装并启用
  - Surge → 模块 → 查看"IPPure"是否在列表中
  - 确认开关处于启用状态
  
- [ ] 脚本路径是否正确
  - 检查模块配置中的 script-path
  - 确认 GitHub 文件链接可访问
  
- [ ] 面板配置是否正确
  ```ini
  [Panel]
  IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600
  ```

---

### 4️⃣ 策略组识别失败

**症状**: 面板显示策略组名称而不是实际节点名称

**原因**: 
策略组名称与脚本中配置的不匹配

**解决方案**:

编辑 `ippure_panel.js` 第 10 行,修改策略组名称:

```javascript
const POLICY_GROUP = "✈️ 自动测速"; // 改为您实际的策略组名称
```

**如何查看您的策略组名称**:
1. 打开 Surge
2. 点击"策略组"
3. 查看您想监控的策略组的完整名称(包括 emoji)

---

### 5️⃣ Surge 版本过低

**要求**: 
- Surge iOS 5.0 或更高版本
- Surge Mac 4.0 或更高版本

**检查版本**:
Surge → 关于 → 查看版本号

如版本过低,请升级到最新版本。

---

## 调试步骤

### 步骤 1: 查看 Surge 日志

1. 打开 Surge
2. 点击"最近请求"或"日志"选项卡
3. 搜索 `[IPPure]` 关键词
4. 查看是否有错误信息

### 步骤 2: 手动测试 API

在终端运行以下命令:

```bash
# 测试 API 基本连通性
curl -s "https://my.ippure.com/v1/info"

# 查看格式化的 JSON 输出(需要安装 jq)
curl -s "https://my.ippure.com/v1/info" | jq .
```

**预期输出示例**:
```json
{
  "fraudScore": 17,
  "isResidential": true,
  "isBroadcast": true,
  "city": "Los Angeles",
  "region": "California",
  "country": "US"
}
```

### 步骤 3: 检查模块配置

确认 `ippure.sgmodule` 内容正确:

```ini
#!name=IPPure IP Info
#!desc=显示当前代理的 IP 纯净度信息

[Panel]
IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600

[Script]
IPPure-IP-Info = type=generic, script-path=https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure_panel.js, timeout=10
```

---

## 错误信息对照表

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `获取失败` | API 请求失败 | 检查网络连接和代理设置 |
| `延迟: ?` | 超时或连接失败 | 切换节点或检查网络延迟 |
| 面板无内容 | 模块未启用 | 在模块列表中启用 IPPure |
| 显示策略组名 | 无法获取节点信息 | 检查策略组名称配置 |

---

## 获取帮助

如果以上方法都无法解决问题,请:

1. **收集信息**:
   - Surge 版本
   - 错误日志截图
   - 当前配置(脱敏后)

2. **提交 Issue**:
   访问 [GitHub Issues](https://github.com/5jwoj/ippure-surge/issues) 提交问题报告

---

## 版本历史

### v1.0 (2026-01-02)
- 🎉 正式版本发布
- 🔧 优化延迟测量逻辑
- 📝 完善故障排查指南
