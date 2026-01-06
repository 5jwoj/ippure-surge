# Surge配置快速修改模板

> 根据检测结果更新Gemini策略组的配置模板

## 第一步：添加Gemini策略组

在 `[Proxy Group]` 部分找到注释的Gemini行，修改为：

```ini
# 取消注释并修改这一行
Gemini = select, include-other-group="✈️ 自动测速", icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
```

位置建议：放在OpenAi策略组后面

## 第二步：添加Gemini规则

在 `[Rule]` 部分找到 `# > 谷歌服务` 上方，添加：

```ini
# > Gemini
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.list,Gemini
DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini
DOMAIN-SUFFIX,gemini.google.com,Gemini
DOMAIN-SUFFIX,aistudio.google.com,Gemini
```

**同时修改**：将原来的Gemini规则从"谷歌服务"改为"Gemini"
```ini
# 原来（第121行）：
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.list,谷歌服务

# 改为：
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.list,Gemini
```

## 第三步：测试检测

1. 保存配置，重载Surge
2. 更新模块到v1.6.0
3. 运行"Gemini节点检测"
4. 查看日志，记录可用节点

## 第四步：精简策略组（可选）

根据检测结果，将策略组改为只包含可用节点：

```ini
# 假设检测出3个可用节点：HK-01, US-02, SG-03
Gemini = select, HK-01, US-02, SG-03, 节点选择, icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
```

---

## 完整示例

### 添加后的 [Proxy Group] 部分
```ini
[Proxy Group]
OpenAi = select, 节点选择, "🇭🇰 香港节点", "🇺🇲 美国节点", "🇸🇬 新加坡节点", "🇯🇵 日本节点", "🇨🇳 台湾节点", icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
Gemini = select, include-other-group="✈️ 自动测速", icon-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/chxm1023/ChatGPT5.png
TikTok = select, 节点选择, "🇭🇰 香港节点", "🇺🇲 美国节点", "🇸🇬 新加坡节点", "🇯🇵 日本节点", "🇨🇳 台湾节点", icon-url=https://raw.githubusercontent.com/sooyaaabo/Loon/main/Icon/App/TikTok.png
```

### 添加后的 [Rule] 部分
```ini
# > AI
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/OpenAI/OpenAI.list,OpenAi
# > Gemini
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.list,Gemini
DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini
DOMAIN-SUFFIX,gemini.google.com,Gemini
DOMAIN-SUFFIX,aistudio.google.com,Gemini
# > 微软服务
RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Surge/Microsoft/Microsoft.list,微软服务
```
