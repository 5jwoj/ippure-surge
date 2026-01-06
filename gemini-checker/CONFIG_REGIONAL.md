# Gemini策略组配置 - 方案2（地区策略组）

## 配置文件修改

### 在 `[Proxy Group]` 部分

找到Gemini策略组的配置行（第14行），修改为：

**修改前**：
```ini
Gemini = select, include-other-group="✈️ 自动测速", icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
```

**修改为**：
```ini
Gemini = select, 🇺🇲 美国节点, 🇭🇰 香港节点, 🇸🇬 新加坡节点, 🇯🇵 日本节点, 节点选择, icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
```

## 说明

**这个配置的优势**：
- ✅ 包含主要地区的节点策略组
- ✅ 每个地区策略组会自动选择最优节点（smart类型）
- ✅ 脚本会测试每个地区当前使用的节点
- ✅ 根据测试结果，你可以在Gemini策略组中手动选择可用的地区

**使用流程**：
1. 修改配置并保存
2. 更新模块到v2.0.0
3. 运行检测 - 会显示哪些地区可用
4. 在Surge中手动选择可用的地区策略组

**示例结果**：
```
✅ 可用地区 (2个)
🥇 🇺🇸美国01-0.1倍 | 电信联通移动推荐
   地区: 🇺🇲 美国节点
   延时: 235ms

🥈 🇸🇬新加坡 | 高速专线-hy2
   地区: 🇸🇬 新加坡节点
   延时: 342ms

❌ 不可用地区 (2个):
• 🇭🇰香港01 | 移动联通推荐 (🇭🇰 香港节点)
• 🇯🇵日本东京 | 移动联通推荐-hy2 (🇯🇵 日本节点)
```

根据这个结果，你就知道应该使用"🇺🇲 美国节点"或"🇸🇬 新加坡节点"来访问Gemini。
