/**
 * Gemini节点检测器(美国策略组专用)
 * 版本: v1.3.1
 * 功能: 检测"美国手动"策略组中哪些节点可以访问Gemini API
 * 修复: 使用策略组切换方式来测试节点; 增加API Body解析以准确判断地区支持性
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
// 根据之前的日志，虽然界面显示 "美国节点"，但 Surge 内部使用的策略组名称是 "美国手动"
const POLICY_GROUP_NAME = "美国手动";

// 模块级变量控制日志
let isDebugLogged = false;

/**
 * 主函数
 */
async function main() {
    console.log(`🚀 Gemini检测器 v1.3.1 (深度检测模式) 开始运行...`);

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

    if (!nodes && allGroupDetails.groups) {
        // 二次尝试：模糊匹配
        const keys = Object.keys(allGroupDetails.groups);
        const match = keys.find(k => k.includes(POLICY_GROUP_NAME));
        if (match) nodes = allGroupDetails.groups[match];
    }

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
    // 注意: 如果策略组是 url-test 等类型，decisions 里可能没有它
    const currentPolicy = allGroupDetails.decisions[POLICY_GROUP_NAME];

    console.log(`开始轮询检测 ${validNodes.length} 个节点...`);

    // 检测所有节点
    const results = [];
    for (const nodeName of validNodes) {
        // 清理节点名称
        const cleanName = nodeName.trim().replace(/\u00A0/g, ' ');

        // 尝试切换策略组到该节点
        const switchSuccess = $surge.setSelectGroupPolicy(POLICY_GROUP_NAME, cleanName);

        // 给一点时间让切换生效
        await delay(50);

        // 如果切换成功，测试策略组本身；否则尝试直接测节点（虽然可能失败）
        const targetPolicy = switchSuccess ? POLICY_GROUP_NAME : cleanName;

        const result = await testNode(targetPolicy, cleanName);
        results.push(result);
    }

    // 恢复原来的选择
    if (currentPolicy) {
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
        // 请求 API
        const responseData = await new Promise((resolve, reject) => {
            $httpClient.get({
                url: GEMINI_TEST_URL,
                timeout: TIMEOUT / 1000,
                policy: policyToTest,
                headers: { "User-Agent": "Surge/5.0" }
            }, (error, response, data) => {
                if (error) reject(error);
                else resolve({ response, data });
            });
        });

        const latency = Date.now() - startTime;
        const response = responseData.response;
        const data = responseData.data;

        // 判定逻辑

        // 1. 如果状态码是 200，绝对可用
        if (response.status === 200) {
            console.log(`✓ ${displayNodeName}: ${latency}ms (200 OK)`);
            return { node: displayNodeName, available: true, latency: latency, status: 200 };
        }

        // 2. 如果是 4xx/5xx，需要检查 Body 确认原因
        // 如果 Body 里包含 "User location is not supported"，则为不可用
        if (data && typeof data === 'string') {
            if (data.includes("User location is not supported")) {
                console.log(`✗ ${displayNodeName}: 地区不支持 (${latency}ms)`);
                return {
                    node: displayNodeName,
                    available: false,
                    latency: latency,
                    error: "地区不支持"
                };
            }
            // 如果包含 Key 错误，说明网络通畅且地区支持
            if (data.includes("missing a valid API key") || data.includes("API key not valid")) {
                console.log(`✓ ${displayNodeName}: ${latency}ms (可用-缺少Key)`);
                return {
                    node: displayNodeName,
                    available: true,
                    latency: latency,
                    status: response.status
                };
            }
        }

        // 3. 其他非明确拒绝的情况，默认视为连通 (因为我们访问的是需要Key的端点，拒绝访问是正常的)
        // 只要不是 地区不支持，我们通常认为它是通的
        if (response.status === 403 || response.status === 400 || response.status === 404) {
            console.log(`✓ ${displayNodeName}: ${latency}ms (API响应:${response.status})`);
            return { node: displayNodeName, available: true, latency: latency, status: response.status };
        }

        // 其他错误 (50x 等)
        console.log(`✗ ${displayNodeName}: HTTP ${response.status}`);
        return { node: displayNodeName, available: false, latency: latency, error: `HTTP ${response.status}` };

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
            if (result.error) content += `   原因: ${result.error}\n`;
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
