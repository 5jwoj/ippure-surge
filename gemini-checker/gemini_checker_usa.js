/**
 * Gemini节点检测器(美国策略组专用)
 * 版本: v1.2.3
 * 功能: 检测"美国手动"策略组中哪些节点可以访问Gemini API
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
// 根据日志，实际包含具体节点列表的策略组名为 "美国手动"
const POLICY_GROUP_NAME = "美国手动";

// 模块级变量控制日志
let isDebugLogged = false;

/**
 * 主函数
 */
async function main() {
    console.log(`🚀 Gemini检测器 v1.2.3 开始运行...`);
    try {
        // 获取策略组信息
        let allGroupDetails;
        try {
            allGroupDetails = $surge.selectGroupDetails();
        } catch (e) {
            console.log("selectGroupDetails error: " + e);
            return {
                title: "❌ API 错误",
                content: "无法获取策略组信息: " + e,
                icon: "xmark.circle.fill",
                "icon-color": "#FF3B30"
            };
        }

        if (!allGroupDetails || !allGroupDetails.groups) {
            console.log("Debug: groups对象不存在");
            return {
                title: "❌ 错误",
                content: "API返回结构异常，未找到groups数据",
                icon: "xmark.circle.fill",
                "icon-color": "#FF3B30"
            };
        }

        // 尝试直接匹配 "美国手动"
        let nodes = allGroupDetails.groups[POLICY_GROUP_NAME];

        // 模糊匹配
        if (!nodes) {
            console.log(`未找到精确匹配 "${POLICY_GROUP_NAME}"，尝试模糊匹配...`);
            const groupKeys = Object.keys(allGroupDetails.groups);
            const matchKey = groupKeys.find(k => k.includes(POLICY_GROUP_NAME) || k.includes("美国节点"));
            if (matchKey) {
                console.log(`找到模糊匹配: ${matchKey}`);
                nodes = allGroupDetails.groups[matchKey];
            }
        }

        if (!nodes || nodes.length === 0) {
            return {
                title: "⚠️ 策略组为空或未找到",
                content: `无法在配置中找到 "${POLICY_GROUP_NAME}" 或其内容为空`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            };
        }

        console.log(`找到策略组，包含Raw节点 ${nodes.length} 个`);

        // 过滤节点
        const validNodes = getPolicyNodes(nodes);

        if (validNodes.length === 0) {
            return {
                title: "⚠️ 无有效节点",
                content: "策略组中没有符合条件的节点",
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            };
        }

        console.log(`过滤后开始检测 ${validNodes.length} 个节点...`);

        // 检测所有节点
        const results = await testAllNodes(validNodes);

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
 * @param {Array} nodeList - 节点名称数组
 */
function getPolicyNodes(nodeList) {
    const nodes = [];

    for (const item of nodeList) {
        // 过滤掉特殊策略
        if (item &&
            item !== "DIRECT" &&
            item !== "REJECT" &&
            item !== "PROXY" &&
            !item.includes("自动选择") &&
            !item.includes("节点选择") &&
            !item.includes("自动测速") &&
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

    // 按延时排序
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
async function testNode(rawNodeName) {
    const startTime = Date.now();

    // 清理节点名称: 去除首尾空格，将 &nbsp; 替换为普通空格
    const nodeName = rawNodeName.trim().replace(/\u00A0/g, ' ');

    // 调试: 打印第一个节点的编码，检查是否有隐形字符
    if (!isDebugLogged) {
        console.log(`Debug Node Name: "${nodeName}"`);
        console.log(`Debug Node Encode: ${encodeURIComponent(nodeName)}`);
        isDebugLogged = true;
    }

    try {
        const response = await new Promise((resolve, reject) => {
            $httpClient.get({
                url: GEMINI_TEST_URL,
                timeout: TIMEOUT / 1000,
                policy: nodeName, // 使用清理后的名称
                headers: {
                    "User-Agent": "Surge/5.0"
                }
            }, (error, response, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });

        const latency = Date.now() - startTime;

        // 检查响应状态
        if (response.status === 200 || response.status === 403) {
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

    if (availableNodes.length > 0) {
        content += `✅ 可用节点 (${availableNodes.length}个):\n`;
        availableNodes.forEach((result, index) => {
            const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▫️";
            content += `${emoji} ${result.node}\n   延时: ${result.latency}ms\n`;
        });
    }

    if (unavailableNodes.length > 0) {
        if (content) content += "\n";
        content += `❌ 不可用节点 (${unavailableNodes.length}个):\n`;
        unavailableNodes.slice(0, 5).forEach(result => {
            content += `▫️ ${result.node}\n`;
            if (result.error) {
                // 简化错误信息
                let err = result.error;
                if (err.includes("doesn't exist")) err = "策略不存在(命名问题?)";
                content += `   错误: ${err.substring(0, 20)}\n`;
            }
        });
        if (unavailableNodes.length > 5) {
            content += `... 还有 ${unavailableNodes.length - 5} 个不可用节点\n`;
        }
    }

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
