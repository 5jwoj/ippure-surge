/**
 * IPPure Panel for Surge
 * Consolidates IP Info, Fraud Score, and Native Check.
 */

const URL = "https://my.ippure.com/v1/info";

async function request() {
    return new Promise((resolve) => {
        $httpClient.get(URL, (error, response, data) => {
            resolve({ error, data });
        });
    });
}

function isChinese() {
    const lang = ($environment.language || "").toLowerCase();
    return lang.startsWith("zh");
}

(async () => {
    const { error, data } = await request();

    const title = isChinese() ? "IPPure IP 详情" : "IPPure IP Details";

    if (error || !data) {
        $done({
            title,
            content: isChinese() ? "网络连接请求失败" : "Network Request Failed",
            icon: "exclamationmark.icloud",
            "icon-color": "#C44"
        });
        return;
    }

    try {
        const json = JSON.parse(data);
        const score = json.fraudScore || 0;
        const isRes = !!json.isResidential;
        const isBrd = !!json.isBroadcast;

        // Location & Org
        const location = json.city || json.region || json.country || (isChinese() ? "未知区域" : "Unknown");
        const org = json.asOrganization || (isChinese() ? "未知运行商" : "Unknown");

        // Risk Level
        let riskColor = "#88A788"; // Green
        let riskIcon = "shield.check.fill";
        let riskText = isChinese() ? "低风险" : "Low Risk";

        if (score >= 40 && score < 70) {
            riskColor = "#D4A017"; // Yellow
            riskIcon = "exclamationmark.shield.fill";
            riskText = isChinese() ? "中风险" : "Medium Risk";
        } else if (score >= 70) {
            riskColor = "#C44"; // Red
            riskIcon = "shield.xmark.fill";
            riskText = isChinese() ? "高风险" : "High Risk";
        }

        // IP Type
        const resText = isChinese() ? (isRes ? "住宅" : "机房") : (isRes ? "Residential" : "DataCenter");
        const brdText = isChinese() ? (isBrd ? "广播" : "原生") : (isBrd ? "Broadcast" : "Native");

        // Formatting content
        // Line 1: Location - ISP
        // Line 2: Score (Level) | Type
        const content = `${location} - ${org}\n` + 
                        (isChinese() 
                            ? `评分: ${score} (${riskText}) | ${resText} · ${brdText}`
                            : `Score: ${score} (${riskText}) | ${resText} · ${brdText}`);

        $done({
            title,
            content,
            icon: riskIcon,
            "icon-color": riskColor
        });

    } catch (e) {
        $done({
            title,
            content: isChinese() ? "数据解析失败" : "Data Parsing Error",
            icon: "xmark.octagon",
            "icon-color": "#C44"
        });
    }
})();
