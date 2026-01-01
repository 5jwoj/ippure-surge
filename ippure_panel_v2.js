/**
 * IPPure Dual Panel for Surge (Enhanced Debug Version)
 * Version: 2.5
 * Features:
 * 1. Shows both Direct (Local) and Proxy IP info.
 * 2. Tap to cycle through detected Proxy Groups.
 * 3. Enhanced error logging and compatibility.
 */

const API_URL = "https://my.ippure.com/v1/info";

function isChinese() {
    const lang = ($environment.language || "").toLowerCase();
    return lang.startsWith("zh");
}

async function fetchIP(policy) {
    return new Promise((resolve) => {
        // Use shorter timeout for DIRECT to avoid blocking
        const timeout = (policy === "DIRECT") ? 2000 : 4000;
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
                    console.log(`[IPPure] 成功获取数据 (${policy || "DIRECT"}): fraudScore=${json.fraudScore}, isResidential=${json.isResidential}`);
                    resolve(json);
                } catch (e) {
                    console.log(`[IPPure] JSON 解析失败: ${e.message}`);
                    resolve(null);
                }
            }
        });
    });
}

function formatInfo(json) {
    if (!json) return isChinese() ? "获取失败" : "Failed";

    const score = json.fraudScore || 0;
    const isRes = !!json.isResidential;
    const isBrd = !!json.isBroadcast;

    let riskIcon = "🟢";
    if (score >= 40 && score < 70) riskIcon = "🟡";
    else if (score >= 70) riskIcon = "🔴";

    const typeText = isChinese()
        ? `${isRes ? "住宅" : "机房"}·${isBrd ? "广播" : "原生"}`
        : `${isRes ? "Res" : "DC"}·${isBrd ? "Brd" : "Nat"}`;

    const location = json.city || json.region || json.country || "?";

    return `${riskIcon} ${location} | ${score} | ${typeText}`;
}

/**
 * Parse arguments like "policy=Proxy&icon=shield"
 */
function getArgs() {
    return (typeof $argument !== "undefined" && $argument)
        ? Object.fromEntries($argument.split("&").map(item => item.split("=")))
        : {};
}

(async () => {
    console.log("[IPPure] 脚本启动...");
    const args = getArgs();
    let proxyGroups = [];

    // 检测可用的策略组
    if (typeof $surge !== "undefined") {
        try {
            const details = $surge.selectGroupDetails();
            proxyGroups = Object.keys(details.decisions || {}).filter(name => {
                const lowName = name.toLowerCase();
                // 排除系统保留组和选择组
                if (["direct", "reject", "dummy", "static", "ssid"].includes(lowName)) {
                    return false;
                }
                // 检查是否有实际的节点选择(不是空的或指向自己的)
                const selectedNode = details.decisions[name];
                return selectedNode && selectedNode !== name;
            });
            console.log(`[IPPure] 检测到可用策略组: ${proxyGroups.join(", ")}`);
        } catch (e) {
            console.log(`[IPPure] 策略组检测失败: ${e.message}`);
        }
    }

    // Selection Logic:
    // 1. If manual argument 'policy' is provided, use it and DISABLE cycling.
    // 2. Otherwise, use cycling index.
    let policy = args.policy || "";
    let isLocked = !!args.policy;
    let currentIndex = 0;

    if (!isLocked && proxyGroups.length > 0) {
        currentIndex = parseInt($persistentStore.read("ippure_index") || "0");
        if (currentIndex >= proxyGroups.length) currentIndex = 0;
        policy = proxyGroups[currentIndex];

        // Save next index for the next tap
        const nextIndex = (proxyGroups.length > 0) ? (currentIndex + 1) % proxyGroups.length : 0;
        $persistentStore.write(nextIndex.toString(), "ippure_index");
        console.log(`[IPPure] 当前策略组: ${policy} (索引: ${currentIndex}/${proxyGroups.length})`);
    } else if (isLocked) {
        console.log(`[IPPure] 锁定策略组: ${policy}`);
    }

    // Serial requests: Proxy first (fast), then Direct (may be slow)
    // This ensures we can show proxy IP even if Direct times out
    console.log("[IPPure] 开始请求 IP 信息...");
    let proxyData = null;
    let directData = null;
    let actualPolicy = policy;
    let nodeName = policy;

    if (policy) {
        // Get the actual selected node for this policy group
        if (typeof $surge !== "undefined") {
            const details = $surge.selectGroupDetails();
            nodeName = details.decisions[policy] || policy;
            // Use the actual node name for HTTP request instead of policy group name
            actualPolicy = nodeName;
            console.log(`[IPPure] 策略组: ${policy} -> 节点: ${nodeName}`);
        }
        // Get proxy IP first (usually faster)
        proxyData = await fetchIP(actualPolicy);
    }

    // Then get direct IP with shorter timeout
    directData = await fetchIP("DIRECT");

    const directLine = `🏠 ${formatInfo(directData)}`;
    let proxyLine = "";
    let tip = "";

    if (policy) {
        proxyLine = `\n🚀 ${formatInfo(proxyData)} (${nodeName})`;

        if (!isLocked && proxyGroups.length > 1) {
            // Show current policy being checked, not the misleading "long-press to edit" message
            const nextIndex = parseInt($persistentStore.read("ippure_index") || "0");
            const nextPolicy = proxyGroups[nextIndex] || policy;
            tip = isChinese()
                ? `\n💡 当前检测: ${policy} | 点击切换到: ${nextPolicy}`
                : `\n💡 Current: ${policy} | Tap for: ${nextPolicy}`;
        }
    } else {
        proxyLine = isChinese() ? "\n🚀 未检出代理组" : "\n🚀 No Proxy Group";
    }

    // Icon set based on proxy risk if available, else direct
    const score = (proxyData && proxyData.fraudScore) || (directData && directData.fraudScore) || 0;
    let riskColor = "#88A788";
    let riskIcon = "shield.check.fill";
    if (score >= 40 && score < 70) {
        riskColor = "#D4A017";
        riskIcon = "exclamationmark.shield.fill";
    } else if (score >= 70) {
        riskColor = "#C44";
        riskIcon = "shield.xmark.fill";
    }

    console.log(`[IPPure] 最终风险评分: ${score}, 图标: ${riskIcon}`);

    $done({
        title: isChinese() ? "IPPure 双 IP 检测" : "IPPure Dual IP Check",
        content: directLine + proxyLine + tip,
        icon: riskIcon,
        "icon-color": riskColor
    });
})();
