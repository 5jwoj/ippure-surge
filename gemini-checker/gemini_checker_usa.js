/**
 * Gemini节点检测器(美国策略组专用)
 * 版本: v1.3.2
 * 功能: 检测"美国手动"策略组中哪些节点可以访问Gemini API
 * 修复: 增加详细Body调试日志，确保正确识别Gemini可用性
 */

const GEMINI_TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 5000; // 5秒超时
const POLICY_GROUP_NAME = "美国手动";

let isDebugLogged = false;

async function main() {
    console.log(`🚀 Gemini检测器 v1.3.2 (深度调试模式) 开始运行...`);

    let allGroupDetails;
    try {
        allGroupDetails = $surge.selectGroupDetails();
    } catch (e) {
        return { title: "❌ API 错误", content: "无法获取策略组信息: " + e, icon: "xmark.circle.fill" };
    }

    if (!allGroupDetails || !allGroupDetails.groups) return { title: "❌ 错误", content: "API返回结构异常", icon: "xmark.circle.fill" };

    let nodes = allGroupDetails.groups[POLICY_GROUP_NAME];
    if (!nodes && allGroupDetails.groups) {
        const keys = Object.keys(allGroupDetails.groups);
        const match = keys.find(k => k.includes(POLICY_GROUP_NAME));
        if (match) nodes = allGroupDetails.groups[match];
    }

    if (!nodes || nodes.length === 0) return { title: "⚠️ 策略组为空", content: `无法找到 "${POLICY_GROUP_NAME}"`, icon: "exclamationmark.triangle.fill" };

    const validNodes = getPolicyNodes(nodes);
    if (validNodes.length === 0) return { title: "⚠️ 无有效节点", content: "无符合条件的节点", icon: "exclamationmark.triangle.fill" };

    const currentPolicy = allGroupDetails.decisions[POLICY_GROUP_NAME];
    console.log(`开始轮询检测 ${validNodes.length} 个节点...`);

    const results = [];
    for (const nodeName of validNodes) {
        const cleanName = nodeName.trim().replace(/\u00A0/g, ' ');
        const switchSuccess = $surge.setSelectGroupPolicy(POLICY_GROUP_NAME, cleanName);
        await delay(50);
        const targetPolicy = switchSuccess ? POLICY_GROUP_NAME : cleanName;
        const result = await testNode(targetPolicy, cleanName);
        results.push(result);
    }

    if (currentPolicy) $surge.setSelectGroupPolicy(POLICY_GROUP_NAME, currentPolicy);

    return formatResults(results);
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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

async function testNode(policyToTest, displayNodeName) {
    const startTime = Date.now();
    try {
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
        let data = responseData.data;

        // 统一转为字符串处理
        if (typeof data === 'object') {
            try { data = JSON.stringify(data); } catch (e) { data = ""; }
        } else if (!data) {
            data = "";
        }

        // 1. 200 OK
        if (response.status === 200) {
            console.log(`✓ ${displayNodeName}: ${latency}ms (200 OK)`);
            return { node: displayNodeName, available: true, latency: latency, status: 200 };
        }

        // 2. 检查Body
        const isRegionError = data.includes("User location is not supported");
        const isKeyError = data.includes("missing a valid API key") || data.includes("API key not valid") || data.includes("PERMISSION_DENIED");

        if (isRegionError) {
            console.log(`✗ ${displayNodeName}: 地区不支持 (${latency}ms)`);
            return { node: displayNodeName, available: false, latency: latency, error: "地区不支持" };
        }

        if (isKeyError) {
            console.log(`✓ ${displayNodeName}: ${latency}ms (可用-缺少Key)`);
            return { node: displayNodeName, available: true, latency: latency, status: response.status };
        }

        // 3. 未匹配到，打印 Body 调试
        if (!isDebugLogged && response.status === 403) {
            console.log(`[Debug Body] ${displayNodeName}: ${data.substring(0, 150)}`);
            isDebugLogged = true;
        }

        // 4. 默认放行其他 403 (因为我们无法穷举所有Google错误，只要不是Region Error就通过)
        if (response.status === 403 || response.status === 400) {
            console.log(`✓ ${displayNodeName}: ${latency}ms (API响应:${response.status})`);
            return { node: displayNodeName, available: true, latency: latency, status: response.status, warning: "未知响应内容" };
        }

        console.log(`✗ ${displayNodeName}: HTTP ${response.status}`);
        return { node: displayNodeName, available: false, latency: latency, error: `HTTP ${response.status}` };

    } catch (error) {
        const latency = Date.now() - startTime;
        let errStr = error.toString();
        if (errStr.length > 50) errStr = errStr.substring(0, 50) + "...";
        console.log(`✗ ${displayNodeName}: ${errStr}`);
        return { node: displayNodeName, available: false, latency: latency, error: errStr };
    }
}

function formatResults(results) {
    const availableNodes = results.filter(r => r.available);
    const unavailableNodes = results.filter(r => !r.available);
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
        if (unavailableNodes.length > 5) content += `... 还有 ${unavailableNodes.length - 5} 个不可用节点\n`;
    }

    const title = availableNodes.length > 0 ? `✅ 最快: ${availableNodes[0].node} (${availableNodes[0].latency}ms)` : `❌ 无可用节点`;

    return { title: title, content: content.trim(), icon: availableNodes.length > 0 ? "checkmark.circle.fill" : "xmark.circle.fill", "icon-color": availableNodes.length > 0 ? "#34C759" : "#FF3B30" };
}

main().then($done);
