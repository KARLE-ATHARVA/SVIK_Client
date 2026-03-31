(function(global) {
    function buildDefaultMailEndpoint() {
        var explicit = typeof global.NEXT_PUBLIC_VISUALIZER_MAIL_ENDPOINT === "string"
            ? global.NEXT_PUBLIC_VISUALIZER_MAIL_ENDPOINT.trim()
            : "";
        if (explicit) return explicit;

        var apiBase = typeof global.NEXT_PUBLIC_API_BASE === "string"
            ? global.NEXT_PUBLIC_API_BASE.trim()
            : "";
        if (!apiBase) return "";

        return apiBase.replace(/\/+$/, "") + "/visualizermail";
    }

    var DEFAULT_MAIL_ENDPOINT = buildDefaultMailEndpoint();

    function normalizeMailEndpoint(endpoint) {
        var value = typeof endpoint === "string" ? endpoint.trim() : "";

        if (!value) {
            return DEFAULT_MAIL_ENDPOINT;
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (value.indexOf("/api/visualizer/mail") !== -1) {
            return DEFAULT_MAIL_ENDPOINT;
        }

        return value;
    }

    global.getSharedVisualizerMailEndpoint = normalizeMailEndpoint;

    if (typeof global.send_mail_addr === "undefined" || !global.send_mail_addr) {
        global.send_mail_addr = DEFAULT_MAIL_ENDPOINT;
    } else {
        global.send_mail_addr = normalizeMailEndpoint(global.send_mail_addr);
    }
})(window);
