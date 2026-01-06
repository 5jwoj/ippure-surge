/**
 * Gemini节点检测器
 * 版本: v1.8.0
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
 * 获取策略组中的所有代理节点（递归处理嵌套策略组）
 */
function getPolicyNodes() {
    try {
        const details = $surge.selectGroupDetails();
        const groups = details.groups || {}; // 策略组数据在groups属性中

        // 调试：打印所有可用的策略组名称
        console.log("===== 调试信息 =====");
        console.log("可用的策略组列表:");
        const groupNames = Object.keys(groups);
        groupNames.forEach(name => {
            console.log(`  - "${name}"`);
        });
        console.log(`目标策略组: "${POLICY_GROUP_NAME}"`);

        // 检查目标策略组是否存在
        if (!groups[POLICY_GROUP_NAME]) {
            console.log(`❌ 未找到策略组 "${POLICY_GROUP_NAME}"`);
            console.log("可能的原因：策略组名称不匹配");
            return [];
        }

        console.log(`✅ 找到策略组 "${POLICY_GROUP_NAME}"`);
        console.log(`该策略组包含: ${JSON.stringify(groups[POLICY_GROUP_NAME])}`);

        const allNodes = new Set(); // 使用Set避免重复节点

        // 递归函数：从策略组中提取所有实际节点
        function extractNodes(groupName, visited = new Set(), depth = 0) {
            const indent = "  ".repeat(depth);

            // 避免循环引用
            if (visited.has(groupName)) {
                console.log(`${indent}⚠️ 跳过已访问的策略组: ${groupName}`);
                return;
            }
            visited.add(groupName);

            const group = groups[groupName];
            if (!group) {
                console.log(`${indent}⚠️ 策略组 "${groupName}" 不存在`);
                return;
            }

            console.log(`${indent}📂 处理策略组: ${groupName} (包含 ${group.length} 项)`);

            for (const item of group) {
                // 跳过特殊策略
                if (!item || item === "DIRECT" || item === "REJECT" || item === "PROXY") {
                    console.log(`${indent}  ⊗ 跳过特殊策略: ${item}`);
                    continue;
                }

                // 检查是否是嵌套的策略组
                if (groups[item]) {
                    // 递归获取嵌套策略组中的节点
                    console.log(`${indent}  📁 发现嵌套策略组: ${item}`);
                    extractNodes(item, visited, depth + 1);
                } else {
                    // 使用模式匹配判断是否是策略组名称（而非真实节点）
                    // 策略组通常包含：emoji + 地区/功能名称，或者纯中文功能名
                    const isPolicyGroupName = /^[🇨🇳🇭🇰🇺🇲🇸🇬🇯🇵🇹🇼✈️🎯📡]+ /.test(item) ||
                        /^[\u4e00-\u9fa5]+$/.test(item) ||
                        item.includes("节点") ||
                        item.includes("选择") ||
                        item.includes("自动");

                    if (isPolicyGroupName) {
                        // 可能是策略组但不在groups中，尝试递归
                        console.log(`${indent}  🔍 "${item}" 看起来像策略组，尝试查找...`);
                        // 即使不在groups中，也可能需要跳过
                        console.log(`${indent}  ⊗ 跳过疑似策略组: ${item}`);
                    } else {
                        // 这是一个实际的节点（真实代理服务器）
                        console.log(`${indent}  ✓ 添加节点: ${item}`);
                        allNodes.add(item);
                    }
                }
            }
        }

        // 从目标策略组开始递归
        extractNodes(POLICY_GROUP_NAME);

        const nodeArray = Array.from(allNodes);
        console.log(`\n最终结果: 共发现 ${nodeArray.length} 个节点`);
        console.log("===== 调试结束 =====\n");
        return nodeArray;

    } catch (error) {
        console.log(`❌ 获取策略组失败: ${error}`);
        console.log(`错误堆栈: ${error.stack}`);
        return [];
    }
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
