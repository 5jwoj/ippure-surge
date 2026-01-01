/**
 * 测试脚本 - 用于验证 IPPure API 和数据格式
 */

const API_URL = "https://my.ippure.com/v1/info";

// 模拟 Surge 环境变量
const $environment = { language: "zh-CN" };

function isChinese() {
    const lang = ($environment.language || "").toLowerCase();
    return lang.startsWith("zh");
}

async function fetchIP(policy) {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("API 返回数据:", JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error("请求失败:", error);
        return null;
    }
}

function formatInfo(json) {
    if (!json) return isChinese() ? "获取失败" : "Failed";
    
    console.log("开始格式化数据...");
    console.log("fraudScore:", json.fraudScore);
    console.log("isResidential:", json.isResidential);
    console.log("isBroadcast:", json.isBroadcast);
    
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

    const result = `${riskIcon} ${location} | ${score} | ${typeText}`;
    console.log("格式化结果:", result);
    return result;
}

(async () => {
    console.log("开始测试...");
    const data = await fetchIP();
    const formatted = formatInfo(data);
    console.log("\n最终显示:", formatted);
})();
