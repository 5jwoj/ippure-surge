/**
 * IPPure Single Node Monitor for Surge (Enhanced Debug Version)
 * Version: 3.0
 * Features:
 * - Monitor the best node (lowest latency) from "自动测速" policy group
 * - Display: Node Name | Purity% | IP Type | Location | Latency
 */

const API_URL = "https://my.ippure.com/v1/info";
const POLICY_GROUP = "自动测速"; // Fixed policy group name

function isChinese() {
    const lang = ($environment.language || "").toLowerCase();
    return lang.startsWith("zh");
}

async function fetchIP(policy) {
    return new Promise((resolve) => {
        const timeout = 4000;
        const options = {
            url: API_URL,
            timeout: timeout,
            headers: {
                "User-Agent": "Surge/5.0"
            }
        };
        if (policy) options.policy = policy;

        $httpClient.get(options, (error, response, data) => {
            if (error) {
                console.log(`[IPPure] 请求失败 (${policy || "DIRECT"}): ${error}`);
                resolve(null);
            } else if (!data) {
                console.log(`[IPPure] 无数据返回 (${policy || "DIRECT"})`);
                resolve(null);
            } else {
                try {
                    const json = JSON.parse(data);
                    console.log(`[IPPure] 成功获取数据 (${policy}): fraudScore=${json.fraudScore}, isResidential=${json.isResidential}`);
                    resolve(json);
                } catch (e) {
                    console.log(`[IPPure] JSON 解析失败: ${e.message}`);
                    resolve(null);
                }
            }
        });
    });
}

function formatInfo(json, nodeName, latency) {
    if (!json) return isChinese() ? "获取失败" : "Failed";

    const score = json.fraudScore || 0;
    const purity = 100 - score; // Convert fraud score to purity percentage
    const isRes = !!json.isResidential;
    const isBrd = !!json.isBroadcast;

    const typeText = isChinese()
        ? `${isRes ? "住宅" : "机房"}·${isBrd ? "广播" : "原生"}`
        : `${isRes ? "Res" : "DC"}·${isBrd ? "Brd" : "Nat"}`;

    const location = json.city || json.region || json.country || "?";
    const latencyText = latency !== null ? `${latency}ms` : "?";

    // Format: NodeName | Purity% | IP Type | Location | Latency
    if (isChinese()) {
        return `${nodeName}\n纯净度: ${purity}% | ${typeText}\n${location} | 延迟: ${latencyText}`;
    } else {
        return `${nodeName}\nPurity: ${purity}% | ${typeText}\n${location} | ${latency}ms`;
    }
}

(async () => {
    console.log("[IPPure] 脚本启动...");
    let nodeName = POLICY_GROUP;
    let latency = null;

    // Get the selected node from the policy group
    if (typeof $surge !== "undefined") {
        try {
            const details = $surge.selectGroupDetails();
            nodeName = details.decisions[POLICY_GROUP] || POLICY_GROUP;
            console.log(`[IPPure] 策略组: ${POLICY_GROUP} -> 节点: ${nodeName}`);

            // Try to get latency info
            if (details.latencies && details.latencies[nodeName] !== undefined) {
                latency = details.latencies[nodeName];
                console.log(`[IPPure] 节点延迟: ${latency}ms`);
            }
        } catch (e) {
            console.log(`[IPPure] 获取节点信息失败: ${e.message}`);
        }
    }

    // Fetch IP info using the selected node
    console.log("[IPPure] 开始请求 IP 信息...");
    const ipData = await fetchIP(nodeName);

    const content = formatInfo(ipData, nodeName, latency);

    // Icon based on purity percentage
    const score = (ipData && ipData.fraudScore) || 0;
    const purity = 100 - score;
    let riskColor = "#88A788";
    let riskIcon = "shield.check.fill";
    if (purity < 30) {
        riskColor = "#C44";
        riskIcon = "shield.xmark.fill";
    } else if (purity < 60) {
        riskColor = "#D4A017";
        riskIcon = "exclamationmark.shield.fill";
    }

    console.log(`[IPPure] 纯净度: ${purity}%, 图标: ${riskIcon}`);

    $done({
        title: isChinese() ? "IPPure 节点监控" : "IPPure Node Monitor",
        content: content,
        icon: riskIcon,
        "icon-color": riskColor
    });
})();
