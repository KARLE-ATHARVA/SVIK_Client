(function(global) {
    function readApiBase() {
        var base = "";

        try {
            if (typeof global.NEXT_PUBLIC_API_BASE === "string" && global.NEXT_PUBLIC_API_BASE.trim()) {
                base = global.NEXT_PUBLIC_API_BASE.trim();
            }
        } catch (e) {}

        if (!base) {
            try {
                if (global.parent && global.parent !== global) {
                    var parentBase = global.parent.NEXT_PUBLIC_API_BASE || global.parent.VISUALIZER_API_BASE || "";
                    if (typeof parentBase === "string" && parentBase.trim()) {
                        base = parentBase.trim();
                    }
                }
            } catch (e) {}
        }

        if (!base) {
            try {
                if (typeof global.VISUALIZER_API_BASE === "string" && global.VISUALIZER_API_BASE.trim()) {
                    base = global.VISUALIZER_API_BASE.trim();
                }
            } catch (e) {}
        }

        if (!base) {
            try {
                if (global.localStorage) {
                    var stored = localStorage.getItem("visualizer_api_base");
                    if (stored && stored.trim()) {
                        base = stored.trim();
                    }
                }
            } catch (e) {}
        }

        return base ? base.replace(/\/+$/, "") : "";
    }

    var DEFAULT_MAIL_ENDPOINT = (function() {
        var apiBase = readApiBase();
        return apiBase ? apiBase + "/visualizermail" : "/visualizermail";
    })();

    function normalizeMailEndpoint(endpoint) {
        var value = typeof endpoint === "string" ? endpoint.trim() : "";

        if (!value) {
            return DEFAULT_MAIL_ENDPOINT;
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (value.indexOf("/app/admin/visualizer/mail") !== -1) return DEFAULT_MAIL_ENDPOINT;
        if (value.indexOf("/api/visualizer/mail") !== -1) return DEFAULT_MAIL_ENDPOINT;
        if (value.indexOf("/visualizermail") !== -1) return value;

        return value;
    }

    global.getSharedVisualizerMailEndpoint = normalizeMailEndpoint;

    if (typeof global.send_mail_addr === "undefined" || !global.send_mail_addr) {
        global.send_mail_addr = DEFAULT_MAIL_ENDPOINT;
    } else {
        global.send_mail_addr = normalizeMailEndpoint(global.send_mail_addr);
    }
})(window);
