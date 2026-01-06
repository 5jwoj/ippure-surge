/**
 * Gemini节点检测器(美国策略组专用)
 * 版本: v1.3.0
 * 功能: 检测"美国手动"策略组中哪些节点可以访问Gemini API
 * 修复: 使用策略组切换方式来测试节点，解决无法直接引用订阅节点的问题
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
const POLICY_GROUP_NAME = "美国手动";

// 模块级变量控制日志
let isDebugLogged = false;

/**
 * 主函数
 */
async function main() {
    console.log(`🚀 Gemini检测器 v1.3.0 (切换测试模式) 开始运行...`);

    let allGroupDetails;
    try {
        allGroupDetails = $surge.selectGroupDetails();
    } catch (e) {
        return {
            title: "❌ API 错误",
            content: "无法获取策略组信息: " + e,
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        };
    }

    if (!allGroupDetails || !allGroupDetails.groups) {
        return {
            title: "❌ 错误",
            content: "API返回结构异常",
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        };
    }

    // 获取节点列表
    let nodes = allGroupDetails.groups[POLICY_GROUP_NAME];
    /* 省略模糊匹配逻辑，既然日志确认必须精确匹配 */

    if (!nodes || nodes.length === 0) {
        return {
            title: "⚠️ 策略组为空",
            content: `无法找到 "${POLICY_GROUP_NAME}" 或其内容为空`,
            icon: "exclamationmark.triangle.fill",
            "icon-color": "#FF9500"
        };
    }

    // 过滤节点
    const validNodes = getPolicyNodes(nodes);
    if (validNodes.length === 0) {
        return { title: "⚠️ 无有效节点", content: "无符合条件的节点", icon: "exclamationmark.triangle.fill" };
    }

    // 获取当前选中的节点，以便最后恢复
    // 注意: 如果策略组是 url-test 等类型，decisions 里可能没有它，我们也无法切换
    const currentPolicy = allGroupDetails.decisions[POLICY_GROUP_NAME];
    console.log(`当前策略组指向: ${currentPolicy || "未知(或非Select组)"}`);

    console.log(`开始轮询检测 ${validNodes.length} 个节点...`);

    // 检测所有节点
    const results = [];
    for (const nodeName of validNodes) {
        // 清理节点名称
        const cleanName = nodeName.trim().replace(/\u00A0/g, ' ');

        // 尝试切换策略组到该节点
        const switchSuccess = $surge.setSelectGroupPolicy(POLICY_GROUP_NAME, cleanName);

        if (!switchSuccess) {
            // 如果切换失败（比如不是Select组），则尝试直接测试（虽然之前失败了由于Direct referencing）
            // 但如果这里失败，基本说明该组不支持手动切换
            if (!isDebugLogged) {
                console.log(`⚠️ 无法切换策略组 "${POLICY_GROUP_NAME}"。请确认它是"手动选择"类型的策略组。`);
                isDebugLogged = true;
            }
        }

        // 给一点时间让切换生效
        await delay(50);

        // 测试策略组本身 (因为策略组现在指向了该节点)
        // 如果切换失败，我们还是尝试直接测 cleanName，万一它是全局节点呢
        const targetPolicy = switchSuccess ? POLICY_GROUP_NAME : cleanName;

        const result = await testNode(targetPolicy, cleanName); // 传入 实际策略名 和 显示用的节点名
        results.push(result);
    }

    // 恢复原来的选择
    if (currentPolicy) {
        console.log(`正在恢复策略组选择: ${currentPolicy}`);
        $surge.setSelectGroupPolicy(POLICY_GROUP_NAME, currentPolicy);
    }

    // 格式化并返回结果
    return formatResults(results);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getPolicyNodes(nodeList) {
    const nodes = [];
    for (const item of nodeList) {
        if (item && item !== "DIRECT" && item !== "REJECT" && item !== "PROXY" &&
            !item.includes("自动选择") && !item.includes("节点选择") && !item.includes("自动测速") &&
            !item.startsWith("🎯")) {
            nodes.push(item);
        }
    }
    return nodes;
}

/**
 * 测试单个节点
 * @param {string} policyToTest - 实际用于请求的策略名 (组名 或 节点名)
 * @param {string} displayNodeName - 用于结果显示的节点名
 */
async function testNode(policyToTest, displayNodeName) {
    const startTime = Date.now();
    try {
        const response = await new Promise((resolve, reject) => {
            $httpClient.get({
                url: GEMINI_TEST_URL,
                timeout: TIMEOUT / 1000,
                policy: policyToTest,
                headers: { "User-Agent": "Surge/5.0" }
            }, (error, response, data) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const latency = Date.now() - startTime;
        if (response.status === 200 || response.status === 403) {
            console.log(`✓ ${displayNodeName}: ${latency}ms`);
            return { node: displayNodeName, available: true, latency: latency, status: response.status };
        } else {
            console.log(`✗ ${displayNodeName}: HTTP ${response.status}`);
            return { node: displayNodeName, available: false, latency: latency, error: `HTTP ${response.status}` };
        }
    } catch (error) {
        const latency = Date.now() - startTime;
        // 简化日志
        let errStr = error.toString();
        if (errStr.length > 50) errStr = errStr.substring(0, 50) + "...";
        console.log(`✗ ${displayNodeName}: ${errStr}`);
        return { node: displayNodeName, available: false, latency: latency, error: errStr };
    }
}

function formatResults(results) {
    const availableNodes = results.filter(r => r.available);
    const unavailableNodes = results.filter(r => !r.available);

    // 按延时排序
    availableNodes.sort((a, b) => a.latency - b.latency);

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
