/**
 * Debug script to inspect $surge.selectGroupDetails() structure
 * Version: debug-1.0
 */

const POLICY_GROUP = "✈️ 自动测速";

(async () => {
    console.log("[DEBUG] Starting debug script...");

    if (typeof $surge !== "undefined") {
        try {
            const details = $surge.selectGroupDetails();

            // Log the entire details object
            console.log("[DEBUG] Full details object:", JSON.stringify(details, null, 2));

            // Log decisions
            console.log("[DEBUG] Decisions:", JSON.stringify(details.decisions, null, 2));

            // Log latencies
            console.log("[DEBUG] Latencies:", JSON.stringify(details.latencies, null, 2));

            // Get the selected node name
            const nodeName = details.decisions[POLICY_GROUP];
            console.log(`[DEBUG] Policy group: ${POLICY_GROUP}`);
            console.log(`[DEBUG] Selected node: ${nodeName}`);

            // Try different ways to get latency
            if (details.latencies) {
                console.log(`[DEBUG] latencies[nodeName]: ${details.latencies[nodeName]}`);
                console.log(`[DEBUG] latencies[POLICY_GROUP]: ${details.latencies[POLICY_GROUP]}`);

                // List all available latency keys
                console.log("[DEBUG] All latency keys:", Object.keys(details.latencies));
            }

        } catch (e) {
            console.log(`[DEBUG] Error: ${e.message}`);
            console.log(`[DEBUG] Stack: ${e.stack}`);
        }
    } else {
        console.log("[DEBUG] $surge is not defined");
    }

    $done({
        title: "Debug Complete",
        content: "Check Surge logs for details"
    });
})();
