# Surge配置示例

本文档提供使用Gemini节点检测器所需的Surge配置示例。

## 方法一:创建独立的Gemini策略组(推荐)

在你的Surge配置文件中添加以下策略组:

```ini
[Proxy Group]
# 创建Gemini专用策略组,引用美国手动策略组的所有节点
Gemini = select, include-other-group=美国手动

# 或者,如果你想手动指定节点:
# Gemini = select, 美国节点01, 美国节点02, 美国节点03
```

### 优点
- ✅ 可以独立管理Gemini使用的节点
- ✅ 使用默认的 `gemini_checker.sgmodule` 模块(无需修改)
- ✅ 检测后可以在Gemini策略组中手动选择最快节点

### 使用的模块
安装 `gemini_checker.sgmodule` (默认版本)

---

## 方法二:直接检测现有策略组

如果你不想创建新策略组,可以直接检测现有的"美国手动"策略组。

### 使用的模块
安装 `gemini_checker_usa.sgmodule` (美国策略组版本)

### 注意事项
- ⚠️ 这个方法不会自动切换节点,只是显示检测结果
- ⚠️ 你需要手动在"美国手动"策略组中选择可用节点

---

## 配置Gemini相关规则

建议在Surge配置中为Gemini服务添加规则:

```ini
[Rule]
# Gemini API
DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini
DOMAIN-SUFFIX,gemini.google.com,Gemini
DOMAIN-SUFFIX,googlevideo.com,Gemini

# Google AI Studio
DOMAIN-SUFFIX,makersuite.google.com,Gemini
DOMAIN-SUFFIX,aistudio.google.com,Gemini
```

---

## 完整配置示例

以下是一个完整的Surge配置片段示例:

```ini
[Proxy]
# 你的代理节点
美国节点01 = ss, server.example.com, 8388, ...
美国节点02 = vmess, server2.example.com, 443, ...
美国节点03 = trojan, server3.example.com, 443, ...

[Proxy Group]
# 美国手动策略组(假设你已有)
美国手动 = select, 美国节点01, 美国节点02, 美国节点03

# Gemini专用策略组(推荐添加)
Gemini = select, include-other-group=美国手动

[Rule]
# Gemini服务规则
DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini
DOMAIN-SUFFIX,gemini.google.com,Gemini
DOMAIN-SUFFIX,googlevideo.com,Gemini
DOMAIN-SUFFIX,makersuite.google.com,Gemini
DOMAIN-SUFFIX,aistudio.google.com,Gemini

# 其他规则...
FINAL,DIRECT
```

---

## 模块安装后的使用

1. **打开Surge** → 主界面
2. **找到面板** → "Gemini节点检测" 或 "Gemini节点检测(美国)"
3. **点击面板** → 开始检测
4. **查看结果** → 显示可用节点和延时排名
5. **手动选择** → 根据检测结果在策略组中选择最快的节点

---

## 常见问题

### Q: 我应该用哪个方法?
**A:** 推荐使用方法一(创建独立Gemini策略组)。这样管理更清晰,也可以重用现有节点。

### Q: 检测后需要手动选择节点吗?
**A:** 是的,当前版本只提供检测功能,不会自动切换节点。你需要根据检测结果手动选择。

### Q: 多久检测一次?
**A:** 建议在使用Gemini前检测一次,或者当发现节点不可用时重新检测。

### Q: 策略组名称必须是"Gemini"或"美国手动"吗?
**A:** 不是必须的。你可以修改 `.sgmodule` 文件中的 `argument` 参数来使用自定义名称。
