/**
 * IPPure Dual Panel for Surge
 * Features:
 * 1. Shows both Direct (Local) and Proxy IP info.
 * 2. Tap to cycle through detected Proxy Groups.
 */

const API_URL = "https://my.ippure.com/v1/info";

function isChinese() {
    const lang = ($environment.language || "").toLowerCase();
    return lang.startsWith("zh");
}

async function fetchIP(policy) {
    return new Promise((resolve) => {
        const options = { url: API_URL, timeout: 5000 };
        if (policy) options.policy = policy;
        $httpClient.get(options, (error, response, data) => {
            if (error || !data) resolve(null);
            else {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
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
    const args = getArgs();
    let proxyGroups = [];

    if (typeof $surge !== "undefined") {
        const details = $surge.selectGroupDetails();
        proxyGroups = Object.keys(details.decisions || {}).filter(name => {
            const lowName = name.toLowerCase();
            return !["direct", "reject", "dummy", "static", "ssid"].includes(lowName);
        });
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
    }

    // Parallel requests
    const [directData, proxyData] = await Promise.all([
        fetchIP("DIRECT"),
        policy ? fetchIP(policy) : Promise.resolve(null)
    ]);

    const directLine = `🏠 ${formatInfo(directData)}`;
    let proxyLine = "";
    let tip = "";

    if (policy) {
        const nodeName = (typeof $surge !== "undefined")
            ? ($surge.selectGroupDetails().decisions[policy] || policy)
            : policy;
        proxyLine = `\n🚀 ${formatInfo(proxyData)} (${nodeName})`;

        if (!isLocked && proxyGroups.length > 1) {
            tip = isChinese() ? "\n💡 长按编辑参数以固定组: policy=" + policy : "\n💡 Long-press to lock: policy=" + policy;
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

    $done({
        title: isChinese() ? "IPPure 双 IP 检测" : "IPPure Dual IP Check",
        content: directLine + proxyLine + tip,
        icon: riskIcon,
        "icon-color": riskColor
    });
})();
