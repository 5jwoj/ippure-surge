# GitHub发布指南

本文档说明如何将Gemini节点检测器发布到GitHub,以便通过URL安装。

## 前提条件

- ✅ 已完成Git初始化和首次提交
- ⚠️ 需要一个GitHub账户

---

## 步骤一:在GitHub上创建仓库

1. **登录GitHub** → [https://github.com](https://github.com)

2. **创建新仓库**
   - 点击右上角 `+` → `New repository`
   - **Repository name**: `gemini-checker` (或你喜欢的名称)
   - **Description**: `检测Surge策略组中可用的Gemini节点并按延时排序`
   - **Public/Private**: 选择 `Public` (公开仓库才能通过URL安装)
   - **不要勾选** "Initialize this repository with a README" (我们已有README)
   - 点击 `Create repository`

---

## 步骤二:推送代码到GitHub

在创建仓库后,GitHub会显示推送指令。使用以下命令:

### 1. 配置远程仓库

```bash
cd /Users/z.W./.gemini/antigravity/scratch/gemini-checker
git remote add origin https://github.com/你的用户名/gemini-checker.git
```

**替换** `你的用户名` 为你的实际GitHub用户名。

### 2. 推送代码

```bash
git branch -M main
git push -u origin main
```

如果需要输入凭据:
- **Username**: 你的GitHub用户名
- **Password**: 使用 **Personal Access Token** (不是密码)

> **💡 提示:** 如果没有Personal Access Token,在GitHub设置中创建:
> Settings → Developer settings → Personal access tokens → Generate new token

---

## 步骤三:获取模块安装URL

推送成功后,你可以获取以下URL用于Surge安装:

### 默认版本
```
https://raw.githubusercontent.com/你的用户名/gemini-checker/main/gemini_checker.sgmodule
```

### 美国策略组版本
```
https://raw.githubusercontent.com/你的用户名/gemini-checker/main/gemini_checker_usa.sgmodule
```

---

## 步骤四:在Surge中通过URL安装

1. 打开Surge应用
2. 进入 `配置` → `模块`
3. 点击右上角 `+`
4. 选择 `Install Module from URL`
5. 粘贴上面的URL
6. 点击确定

---

## 后续更新流程

当你修改了代码并想发布新版本时:

```bash
cd /Users/z.W./.gemini/antigravity/scratch/gemini-checker

# 查看修改
git status

# 添加所有修改
git add .

# 提交修改(记得更新版本号)
git commit -m "v1.2.0: 描述你的更新内容"

# 推送到GitHub
git push
```

Surge会自动从GitHub拉取最新版本(根据模块的update-interval设置)。

---

## 示例:完整的GitHub URL

假设你的GitHub用户名是 `john`,仓库名是 `gemini-checker`,那么:

- **仓库地址**: `https://github.com/john/gemini-checker`
- **默认模块**: `https://raw.githubusercontent.com/john/gemini-checker/main/gemini_checker.sgmodule`
- **美国版模块**: `https://raw.githubusercontent.com/john/gemini-checker/main/gemini_checker_usa.sgmodule`

---

## 常见问题

### Q: 推送时要求输入用户名和密码?
**A:** GitHub已不再支持密码认证,必须使用Personal Access Token。在GitHub设置中生成一个token,然后在密码处输入token。

### Q: 推送失败,提示 "remote repository not found"?
**A:** 检查远程URL是否正确,使用 `git remote -v` 查看配置的远程地址。

### Q: 能否使用私有仓库?
**A:** 私有仓库无法通过URL直接安装模块。必须使用公开仓库。

### Q: 如何更新README中的GitHub链接?
**A:** 在推送到GitHub后,你可以在README.md中添加实际的GitHub链接和安装URL。
