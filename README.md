# IPPure Surge Module

[中文](#中文使用说明) | [English](#english-instructions)

---

## 中文使用说明

自动监控"自动测速"策略组中延迟最低节点的 IP 纯净度。

### 功能特点
- **单节点监控**：专注监控"自动测速"策略组的最优节点
- **纯净度百分比**：直观显示 IP 纯净度（100% = 完全干净）
- **延迟显示**：实时显示节点延迟
- **IP 类型识别**：住宅/机房、原生/广播 IP 识别
- **地理位置**：显示 IP 所在城市/地区

### 显示信息
```
节点名称
纯净度: 92% | 住宅·原生
Tokyo | 延迟: 45ms
```

### 安装方法

1. **添加模块**：在 Surge 的模块（Modules）设置中，安装以下 URL：
   `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure.sgmodule`
2. **面板展示**：启用模块后，Surge 首页（Dashboard）将出现 **IPPure 节点监控** 面板。
3. **点击刷新**：点击面板可手动触发脚本刷新 IP 信息。

### 注意事项

- **策略组名称**：脚本默认监控"自动测速"策略组
- **如需更改**：编辑脚本中的 `POLICY_GROUP` 变量
- **延迟获取**：延迟数据来自 Surge 的策略组延迟测试结果

---

## English Instructions

Automatically monitor IP purity of the lowest-latency node from "自动测速" policy group.

### Features
- **Single Node Monitor**: Focus on the best node from auto-select policy group
- **Purity Percentage**: Display IP purity percentage (100% = cleanest)
- **Latency Display**: Show real-time node latency
- **IP Type Detection**: Residential/DC and Native/Broadcast detection
- **Geolocation**: Display IP city/region location

### Display Format
```
Node Name
Purity: 92% | Res·Nat
Tokyo | 45ms
```

### Installation

1. **Add Module**: In Surge Modules, install the following URL:
   `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure.sgmodule`
2. **Dashboard**: After enabling, the **IPPure Node Monitor** panel will appear on your Surge dashboard.
3. **Manual Refresh**: Tap the panel to manually refresh the IP data.

### Notes

- **Policy Group**: Default monitors "自动测速" policy group
- **Customize**: Edit `POLICY_GROUP` variable in the script to change target group
- **Latency Source**: Latency data comes from Surge's policy group latency test results
