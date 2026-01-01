# IPPure Surge Module

[中文](#中文使用说明) | [English](#english-instructions)

---

## 中文使用说明

通过 IPPure.com 展示当前 IP 的详细信息、风险评分以及线路类型（原生/机房/住宅）。

### 功能特点
- **三合一面板**：整合 IP 地理位置、运营商、欺诈风险评分、住宅/机房识别及原生/广播 IP 识别。
- **状态监控**：根据风险评分自动切换图标颜色（绿色：安全；黄色：中风险；红色：高风险）。
- **智能语言**：根据 Surge 系统语言自动切换中英文显示。

### 安装方法

1. **添加模块**：在 Surge 的模块（Modules）设置中，安装以下 URL：
   `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure.sgmodule`
2. **面板展示**：启用模块后，Surge 首页（Dashboard）将出现 **IPPure IP 详情** 面板。
3. **点击刷新**：点击面板可手动触发脚本刷新当前 IP 信息。

### 进阶用法：检测代理节点

**自动循环模式（默认）**:
- 脚本会自动检测所有可用的策略组
- 每次点击面板会切换到下一个策略组
- 面板底部显示：`💡 当前检测: XXX | 点击切换到: XXX`

**固定特定策略组**:
如果你想固定检测某个特定策略组，需要在模块配置中添加 `argument` 参数：

1. 打开 Surge → 模块 → 找到 IPPure 模块 → 编辑
2. 在 `[Panel]` 部分找到 `IPPure-IP-Info` 行
3. 在行尾添加：`,argument=policy=你的策略组名`
   
**示例**：
```ini
IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600, argument=policy=🚀 节点选择
```

**预设模块（已固定策略组）**:
- **指定 Proxy 组**: `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure_proxy.sgmodule`
- **指定 节点选择 组**: `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure_select.sgmodule`

---

## English Instructions

Display detailed IP information, fraud risk score, and line classification (Residential/DC/Native/Broadcast) via IPPure.com.

### Features
- **All-in-One Panel**: Consolidates IP geolocation, ISP, fraud score, residential/DC detection, and native/broadcast detection into one panel.
- **Risk Indicator**: Automatically changes the panel icon color based on the risk score (Green: Low Risk; Yellow: Medium Risk; Red: High Risk).
- **Auto-Localization**: Automatically switches between English and Chinese based on your Surge environment settings.

### Installation

1. **Add Module**: In Surge Modules, install the following URL:
   `https://raw.githubusercontent.com/5jwoj/ippure-surge/main/ippure.sgmodule`
2. **Dashboard**: After enabling, the **IPPure IP Details** panel will appear on your Surge dashboard.
3. **Manual Refresh**: Tap the panel to manually refresh the IP data.

### Advanced: Check Proxy IP
To check the IP of a specific policy group (e.g., `Proxy`), add an argument to the configuration:
1. Edit the module and find the `IPPure-IP-Info` line under `[Panel]`.
2. Add `argument=policy=YourGroupName`.
   *Example:* `IPPure-IP-Info = script-name=IPPure-IP-Info, update-interval=3600, argument=policy=Proxy`
