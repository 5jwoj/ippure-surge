/**
 * Gemini节点检测器(美国策略组专用)
 * 版本: v1.1.3
 * 功能: 检测"美国手动"策略组中哪些节点可以访问Gemini API
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
const POLICY_GROUP_NAME = "美国手动";

/**
 * 主函数
 */
async function main() {
    try {
        // 获取策略组信息
        // 使用 $surge.selectGroupDetails 获取策略组详情
        // 注意: 这需要由 Surge 这里的 API 支持
        let policyGroup;
        try {
            policyGroup = $surge.selectGroupDetails(POLICY_GROUP_NAME);
        } catch (e) {
            // 忽略错误，下面判断 policyGroup
        }

        if (!policyGroup) {
            return {
                title: "❌ 错误",
                content: `策略组"${POLICY_GROUP_NAME}"不存在或无法访问`,
                icon: "xmark.circle.fill",
                "icon-color": "#FF3B30"
            };
        }

        // 获取策略组中的所有节点
        // selectGroupDetails 返回对象包含 options 数组
        const nodes = getPolicyNodes(policyGroup);

        if (nodes.length === 0) {
            return {
                title: "⚠️ 策略组为空",
                content: `"${POLICY_GROUP_NAME}"中没有可用节点`,
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
 * 获取策略组中的所有代理节点
 */
/**
 * 获取策略组中的所有代理节点
 */
function getPolicyNodes(policyGroup) {
    const nodes = [];
    const groupInfo = policyGroup.options || [];

    for (const item of groupInfo) {
        // 过滤掉"DIRECT"、"REJECT"等特殊策略
        if (item &&
            item !== "DIRECT" &&
            item !== "REJECT" &&
            item !== "PROXY" &&
            !item.startsWith("🎯")) {
            nodes.push(item);
        }
    }

    return nodes;
}

/**
 * 测试所有节点
 */
async function testAllNodes(nodes) {
    const results = [];

    for (const nodeName of nodes) {
        const result = await testNode(nodeName);
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
    const startTime = Date.now();

    try {
        const response = await $httpClient.get({
            url: GEMINI_TEST_URL,
            timeout: TIMEOUT / 1000,
            policy: nodeName,
            headers: {
                "User-Agent": "Surge/5.0"
            }
        });

        const latency = Date.now() - startTime;

        // 检查响应状态
        if (response.status === 200 || response.status === 403) {
            // 200表示成功，403可能是API key问题但连接正常
            console.log(`✓ ${nodeName}: ${latency}ms`);
            return {
                node: nodeName,
                available: true,
                latency: latency,
                status: response.status
            };
        } else {
            console.log(`✗ ${nodeName}: HTTP ${response.status}`);
            return {
                node: nodeName,
                available: false,
                latency: latency,
                error: `HTTP ${response.status}`
            };
        }

    } catch (error) {
        const latency = Date.now() - startTime;
        console.log(`✗ ${nodeName}: ${error}`);
        return {
            node: nodeName,
            available: false,
            latency: latency,
            error: error.toString()
        };
    }
}

/**
 * 格式化结果
 */
function formatResults(results) {
    const availableNodes = results.filter(r => r.available);
    const unavailableNodes = results.filter(r => !r.available);

    let content = "";

    // 可用节点
    if (availableNodes.length > 0) {
        content += `✅ 可用节点 (${availableNodes.length}个):\n`;
        availableNodes.forEach((result, index) => {
            const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▫️";
            content += `${emoji} ${result.node}\n   延时: ${result.latency}ms\n`;
        });
    }

    // 不可用节点
    if (unavailableNodes.length > 0) {
        if (content) content += "\n";
        content += `❌ 不可用节点 (${unavailableNodes.length}个):\n`;
        unavailableNodes.slice(0, 5).forEach(result => {
            content += `▫️ ${result.node}\n`;
            if (result.error) {
                content += `   错误: ${result.error.substring(0, 30)}\n`;
            }
        });
        if (unavailableNodes.length > 5) {
            content += `... 还有 ${unavailableNodes.length - 5} 个不可用节点\n`;
        }
    }

    // 汇总信息
    const title = availableNodes.length > 0
        ? `✅ 最快: ${availableNodes[0].node} (${availableNodes[0].latency}ms)`
        : `❌ 无可用节点`;

    return {
        title: title,
        content: content.trim(),
        icon: availableNodes.length > 0 ? "checkmark.circle.fill" : "xmark.circle.fill",
        "icon-color": availableNodes.length > 0 ? "#34C759" : "#FF3B30"
    };
}

// 执行主函数
main().then($done);
