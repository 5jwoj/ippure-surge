/**
 * Gemini节点检测器
 * 版本: v2.0.0
 * 功能: 检测指定策略组中哪些节点可以访问Gemini API，并按延时排序
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
const POLICY_GROUP_NAME = $argument || "Gemini"; // 从参数获取策略组名，默认为Gemini

/**
 * 主函数
 */
async function main() {
    try {
        // 获取策略组中的所有节点
        const nodes = getPolicyNodes();

        if (nodes.length === 0) {
            return {
                title: "⚠️ 策略组为空",
                content: `"${POLICY_GROUP_NAME}"中没有可用节点或策略组不存在`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            };
        }

        console.log(`开始检测${nodes.length}个节点...`);

        // 检测所有节点
        const results = await testAllNodes(nodes);

        // 格式化并返回结果
        return formatResults(results);

    } catch (error) {
        console.log(`检测失败: ${error}`);
        return {
            title: "❌ 检测失败",
            content: error.toString(),
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        };
    }
}

/**
 * 获取策略组中的所有代理节点（支持地区策略组）
 */
function getPolicyNodes() {
    try {
        const details = $surge.selectGroupDetails();
        const groups = details.groups || {};
        const decisions = details.decisions || {};

        console.log("===== 调试信息 =====");
        console.log(`目标策略组: "${POLICY_GROUP_NAME}"`);

        if (!groups[POLICY_GROUP_NAME]) {
            console.log(`❌ 未找到策略组 "${POLICY_GROUP_NAME}"`);
            return [];
        }

        console.log(`✅ 找到策略组 "${POLICY_GROUP_NAME}"`);
        const policyGroup = groups[POLICY_GROUP_NAME];
        console.log(`该策略组包含: ${JSON.stringify(policyGroup)}`);

        const nodesToTest = [];

        for (const item of policyGroup) {
            // 跳过特殊策略
            if (!item || item === "DIRECT" || item === "REJECT" || item === "PROXY") {
                console.log(`⊗ 跳过特殊策略: ${item}`);
                continue;
            }

            // 检查是否是嵌套的策略组
            if (groups[item]) {
                // 这是一个策略组，获取其当前选中的节点
                const selectedNode = decisions[item];
                if (selectedNode && selectedNode !== "DIRECT" && selectedNode !== "REJECT") {
                    console.log(`📁 地区策略组 "${item}" 当前使用节点: ${selectedNode}`);
                    nodesToTest.push({
                        nodeName: selectedNode,
                        groupName: item
                    });
                } else {
                    console.log(`⚠️ 地区策略组 "${item}" 没有选中节点`);
                }
            } else {
                // 这可能是一个节点名称
                console.log(`✓ 直接添加节点: ${item}`);
                nodesToTest.push({
                    nodeName: item,
                    groupName: null
                });
            }
        }

        console.log(`\n最终结果: 共发现 ${nodesToTest.length} 个节点/策略组`);
        console.log("===== 调试结束 =====\n");

        return nodesToTest;

    } catch (error) {
        console.log(`❌ 获取策略组失败: ${error}`);
        console.log(`错误堆栈: ${error.stack}`);
        return [];
    }
}

/**
 * 测试所有节点
 */
async function testAllNodes(nodeList) {
    const results = [];

    for (const nodeInfo of nodeList) {
        const nodeName = nodeInfo.nodeName;
        const groupName = nodeInfo.groupName;

        const result = await testNode(nodeName);
        result.groupName = groupName; // 添加地区信息
        results.push(result);
    }

    // 按延时排序（可用的在前，不可用的在后）
    results.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        if (a.available && b.available) return a.latency - b.latency;
        return 0;
    });

    return results;
}

/**
 * 测试单个节点
 */
async function testNode(nodeName) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        $httpClient.get({
            url: GEMINI_TEST_URL,
            timeout: TIMEOUT / 1000,
            policy: nodeName,
            headers: {
                "User-Agent": "Surge/5.0"
            }
        }, (error, response, data) => {
            const latency = Date.now() - startTime;

            // 处理错误情况
            if (error) {
                console.log(`✗ ${nodeName}: ${error}`);
                resolve({
                    node: nodeName,
                    available: false,
                    latency: latency,
                    error: error.toString()
                });
                return;
            }

            // 检查响应状态
            if (response && (response.status === 200 || response.status === 403)) {
                // 200表示成功，403可能是API key问题但连接正常
                console.log(`✓ ${nodeName}: ${latency}ms`);
                resolve({
                    node: nodeName,
                    available: true,
                    latency: latency,
                    status: response.status
                });
            } else {
                const statusCode = response ? response.status : 'unknown';
                console.log(`✗ ${nodeName}: HTTP ${statusCode}`);
                resolve({
                    node: nodeName,
                    available: false,
                    latency: latency,
                    error: `HTTP ${statusCode}`
                });
            }
        });
    });
}

/**
 * 格式化检测结果
 */
function formatResults(results) {
    const available = results.filter(r => r.available).sort((a, b) => a.latency - b.latency);
    const unavailable = results.filter(r => !r.available);

    let content = "";
    let title = "";
    let icon = "checkmark.circle.fill";
    let iconColor = "#34C759";

    if (available.length === 0) {
        title = "❌ 无可用节点";
        content = `检测了${results.length}个地区策略组，均无法访问Gemini`;
        icon = "xmark.circle.fill";
        iconColor = "#FF3B30";
    } else {
        title = `✅ 可用地区 (${available.length}个)`;

        // 显示可用的地区和节点
        available.forEach((result, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            const groupInfo = result.groupName ? `\n   地区: ${result.groupName}` : "";
            content += `${medal} ${result.node}${groupInfo}\n   延时: ${result.latency}ms\n\n`;
        });

        // 显示不可用的地区
        if (unavailable.length > 0) {
            content += `\n❌ 不可用地区 (${unavailable.length}个):\n`;
            unavailable.forEach(result => {
                const groupInfo = result.groupName ? ` (${result.groupName})` : "";
                const error = result.error ? `: ${result.error}` : "";
                content += `• ${result.node}${groupInfo}${error}\n`;
            });
        }
    }

    return {
        title: title,
        content: content.trim(),
        icon: icon,
        "icon-color": iconColor
    };
}

// 执行主函数
main().then($done);
```
