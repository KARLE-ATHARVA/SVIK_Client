(function(global) {
    var DEFAULT_MAIL_ENDPOINT = "/api/visualizer/mail";

    function normalizeMailEndpoint(endpoint) {
        var value = typeof endpoint === "string" ? endpoint.trim() : "";

        if (!value) {
            return DEFAULT_MAIL_ENDPOINT;
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (
            value.indexOf("/visualizermail") !== -1 ||
            value.indexOf("/app/admin/visualizer/mail") !== -1 ||
            value.indexOf(DEFAULT_MAIL_ENDPOINT) !== -1
        ) {
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
