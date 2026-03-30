(function(global) {
    "use strict";

    var LAST_API_BASE = "";
    var FAVORITES_SYNC_IN_FLIGHT = null;
    var AUTH_MODAL_READY = false;

    var ROOM_SPACE_MAP = {
        "6": "living",
        "20": "living",
        "21": "living",
        "22": "living",
        "30": "living",
        "33": "living",
        "47": "living",
        "8": "kitchen",
        "26": "kitchen",
        "29": "kitchen",
        "34": "kitchen",
        "35": "kitchen",
        "45": "kitchen",
        "46": "kitchen",
        "12": "bathroom",
        "23": "bathroom",
        "24": "bathroom",
        "25": "bathroom",
        "40": "bathroom",
        "42": "bathroom",
        "44": "bathroom",
        "27": "outdoor",
        "28": "outdoor",
        "31": "outdoor",
        "32": "outdoor",
        "36": "bedroom",
        "37": "bedroom",
        "38": "bedroom",
        "39": "bedroom"
    };

    function pick(obj, keys, fallback) {
        var i, k, v;
        if (!obj) return fallback;
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            v = obj[k];
            if (v !== undefined && v !== null && v !== "") {
                return v;
            }
        }
        return fallback;
    }

    function toAbsUrl(input) {
        if (!input) return "";
        var s = String(input);
        if (/^https?:\/\//i.test(s) || /^\/\//.test(s) || /^data:/i.test(s)) return s;
        if (s.charAt(0) === "/") return s;
        return "/" + s.replace(/^\.?\//, "");
    }

    function normalizeProductLink(raw) {
        var s = String(raw || "").trim();
        if (!s || s === "-" || s === "null" || s === "undefined") return "";
        if (/^https?:\/\//i.test(s)) return s;
        if (/^www\./i.test(s)) return "https://" + s;
        if (s.charAt(0) === "/") {
            try {
                return (global.location && global.location.origin ? global.location.origin : "") + s;
            } catch (e) {
                return s;
            }
        }
        return s;
    }

    function normalizeApiBase(base) {
        if (!base) return "";
        var s = String(base).trim();
        if (!s) return "";
        if (s.slice(-1) !== "/") s += "/";
        return s;
    }

    function getAssetBase() {
        var fromGlobal = "";
        var fromPublicEnv = "";
        var fromStorage = "";
        var fromParent = "";
        try {
            fromGlobal = typeof global.VISUALIZER_ASSET_BASE === "string" ? global.VISUALIZER_ASSET_BASE : "";
        } catch (e) {}
        try {
            fromPublicEnv = typeof global.NEXT_PUBLIC_ASSET_BASE === "string" ? global.NEXT_PUBLIC_ASSET_BASE : "";
        } catch (e) {}
        try {
            fromParent = global.parent && (global.parent.NEXT_PUBLIC_ASSET_BASE || global.parent.VISUALIZER_ASSET_BASE) || "";
        } catch (e) {}
        try {
            fromStorage = global.localStorage && localStorage.getItem("visualizer_asset_base");
        } catch (e) {}
        var base = String(fromGlobal || fromStorage || fromPublicEnv || fromParent || "").trim();
        if (base.slice(-1) !== "/") base += "/";
        return base;
    }

    function getRemoteAssetBase() {
        var fromGlobal = "";
        var fromParent = "";
        try {
            fromGlobal = typeof global.NEXT_PUBLIC_REMOTE_ASSET_BASE === "string" ? global.NEXT_PUBLIC_REMOTE_ASSET_BASE : "";
        } catch (e) {}
        try {
            fromParent = global.parent && global.parent.NEXT_PUBLIC_REMOTE_ASSET_BASE || "";
        } catch (e) {}
        var base = normalizeApiBase(fromGlobal || fromParent || getAssetBase());
        return base;
    }

    function resolveAssetUrl(raw) {
        var value = String(raw || "").trim();
        if (!value) return "";
        if (/^data:/i.test(value)) return value;

        var assetBase = getAssetBase();
        var remoteAssetBase = getRemoteAssetBase();

        if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
            if (assetBase && remoteAssetBase && assetBase !== remoteAssetBase && value.indexOf(remoteAssetBase) === 0) {
                return assetBase + value.slice(remoteAssetBase.length);
            }
            return value;
        }

        if (value.indexOf("/app/") === 0 || value.indexOf("/images/") === 0) return value;
        if (value.indexOf("/assets/") === 0) return assetBase + value.slice("/assets/".length);
        if (value.charAt(0) === "/") return value;

        var cleaned = value.replace(/^\.?\//, "").replace(/^assets\//, "");
        return assetBase ? assetBase + cleaned : "/" + cleaned;
    }

    function detectRoomId(explicitRoomId) {
        if (explicitRoomId !== undefined && explicitRoomId !== null) return String(explicitRoomId);
        var match = (global.location && global.location.pathname || "").match(/\/(\d+)\.html$/);
        return match ? match[1] : "";
    }

    function detectSpaceName(roomId, explicitSpaceName) {
        if (explicitSpaceName) return explicitSpaceName;

        var mapped = ROOM_SPACE_MAP[String(roomId)];
        if (mapped) return mapped;

        try {
            var stored = global.localStorage && localStorage.getItem("selected_space_type");
            if (stored) return String(stored).toLowerCase();
        } catch (e) {}

        return "living";
    }

    function ensureTopHeaderActions(roomId, spaceName) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var targetUrl = "/visualizer?category=" + encodeURIComponent(spaceName || detectSpaceName(roomId));

        $("a[data-target='#roomsModal']").each(function() {
            var $a = $(this);
            if ($a.attr("data-room-nav-bound") === "1") {
                $a.attr("href", targetUrl);
                return;
            }

            $a.attr("href", targetUrl);
            $a.attr("data-room-nav-bound", "1");
            $a.removeAttr("data-toggle");
            $a.removeAttr("data-target");

            $a.on("click", function(e) {
                e.preventDefault();
                if (global.top && global.top.location) {
                    global.top.location.href = targetUrl;
                } else {
                    global.location.href = targetUrl;
                }
            });
        });
    }

    function parseSize(item) {
        var sizeText = String(pick(item, ["size_name", "sizeName", "size", "size_label"], "") || "");
        var sizeMatch = sizeText.match(/(\d+)\s*[xX]\s*(\d+)/);
        var a = sizeMatch ? Number(sizeMatch[1]) : Number(pick(item, ["height", "tile_height", "h"], 300));
        var b = sizeMatch ? Number(sizeMatch[2]) : Number(pick(item, ["width", "tile_width", "w"], 300));
        var h = isFinite(a) && a > 0 ? a : 300;
        var w = isFinite(b) && b > 0 ? b : 300;

        return {
            width: Math.max(w, h),
            height: Math.min(w, h),
            label: sizeText || (Math.min(w, h) + "x" + Math.max(w, h) + "mm")
        };
    }

    function getThumbUrl(item) {
        var skuCode = pick(item, ["sku_code", "skuCode", "code"], "");
        if (skuCode) return resolveAssetUrl(getAssetBase() + "media/thumb/" + skuCode + ".jpg");

        var direct = pick(item, ["thumb_url", "thumb", "thumbnail", "image", "image_url", "imageUrl"], "");
        if (direct) return resolveAssetUrl(toAbsUrl(direct));

        return "/app/images/saved_placeholder.svg";
    }

    function toRenderableUrl(remoteUrl) {
        var r = toAbsUrl(remoteUrl);
        if (!r) return "/app/images/saved_placeholder.svg";
        if (r.indexOf("/app/") === 0 || r.indexOf("/images/") === 0) return r;
        return resolveAssetUrl(r);
    }

    function getSimilarImages(item) {
        var list = pick(item, ["similar_images", "similarImages"], []);
        if (!(list instanceof Array)) return [];
        return list.map(function(x) { return toRenderableUrl(x); }).filter(Boolean);
    }

    function safeText(v, fallback) {
        if (v === undefined || v === null) return fallback || "";
        return String(v);
    }

    function asNumber(v, fallback) {
        var n = Number(v);
        return isFinite(n) ? n : (fallback || 0);
    }

    function splitCsvValues(raw) {
        return String(raw || "")
            .split(",")
            .map(function(v) { return String(v || "").replace(/\u00a0/g, " ").trim(); })
            .filter(Boolean);
    }

    function normalizeApplicationValue(raw) {
        var s = String(raw || "").toLowerCase();
        if (s.indexOf("wall") > -1) return "WALL";
        if (s.indexOf("floor") > -1) return "FLOOR";
        return "";
    }

    function mapToLegacyTile(item, panel, idx) {
        var baseId = asNumber(pick(item, ["tile_id", "tileId", "id"], idx + 1), idx + 1);
        var mappedId = baseId * 10 + panel;
        var size = parseSize(item);
        var category = safeText(pick(item, ["category_name", "category", "cat_name"], "Tiles"), "Tiles");
        var finish = safeText(pick(item, ["finish_name", "finish"], ""), "");
        var application = normalizeApplicationValue(pick(item, ["application_name", "application", "app_name"], ""));
        var color = splitCsvValues(pick(item, ["color_name", "color"], "")).join(",");
        var price = asNumber(pick(item, ["price", "mrp", "rate"], 0), 0);
        var skuName = safeText(pick(item, ["sku_name", "name", "title"], "Tile " + baseId), "Tile " + baseId);
        var skuCode = safeText(pick(item, ["sku_code", "skuCode", "code"], ""), "");
        var thumb = getThumbUrl(item);
        var renderImage = toRenderableUrl(thumb);
        var productLink = normalizeProductLink(pick(item, [
            "product_url",
            "productUrl",
            "product_link",
            "productLink",
            "detail_url",
            "details_url",
            "seo_url",
            "seoUrl",
            "url",
            "link",
            "permalink",
            "website_url",
            "web_url"
        ], ""));
        if (!productLink && skuCode) {
            productLink = normalizeProductLink("/product-details/" + encodeURIComponent(skuCode));
        }

        return {
            tile_type: panel,
            fixedId: baseId,
            fixed_tile_type: panel - 1,
            name: skuName,
            sku_name: skuName,
            sku_code: skuCode,
            cat_a_title: category || "Tiles",
            cat_b_title: safeText(pick(item, ["sub_category_name", "subcategory", "type"], "Type-1"), "Type-1"),
            grout_id: 1,
            grout_color: "#aeaeae",
            with_no_grouth: false,
            price: String(price || 0),
            link: productLink || "-",
            product_url: productLink || "",
            size: [size.width, size.height],
            id: mappedId,
            image: renderImage,
            thumb_image: thumb,
            similar_images: getSimilarImages(item),
            cat_b_id: panel === 1 ? 8 : 12,
            source_tile_id: baseId,
            filters: {
                "23": size.label,
                "24": size.label,
                "25": finish,
                "26": finish,
                "27": category || "Tiles",
                "28": category || "Tiles",
                "31": category || "Tiles",
                "34": application || "",
                "33": color || "",
                "29": "0",
                "30": String(price || 0)
            }
        };
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function buildPanelCats(panelTiles, panel) {
        var qMap = {};
        var qList = [];
        var i;
        for (i = 0; i < panelTiles.length; i++) {
            var t = panelTiles[i];
            var key = t.size[0] + "x" + t.size[1];
            if (qMap[key] === undefined) {
                qMap[key] = qList.length;
                qList.push(key);
            }
            t.__q = qMap[key];
            t.__catA = panel === 1 ? 12 : 20;
            t.__catB = panel === 1 ? 8 : 12;
        }

        var cats = {};
        cats[String(panel === 1 ? 12 : 20)] = {};
        cats[String(panel === 1 ? 12 : 20)][String(panel === 1 ? 8 : 12)] = {};
        for (i = 0; i < qList.length; i++) {
            cats[String(panel === 1 ? 12 : 20)][String(panel === 1 ? 8 : 12)][qList[i]] = i;
        }
        return cats;
    }

    function buildTileListHtml(panelTiles, panel) {
        return panelTiles.map(function(t) {
            var name = esc(t.name || ("Tile " + t.id));
            var img = esc(t.thumb_image || t.image || "");
            var favId = esc(t.source_tile_id || t.id);
            var filterSizeId = panel === 1 ? "23" : "24";
            var filterFinishId = panel === 1 ? "25" : "26";
            var filterTypeId = panel === 1 ? "27" : "28";
            return "" +
                "<li class=\"tile-wrap tile-item-" + panel + "\"" +
                    " data-filter-" + filterSizeId + "='" + esc(t.filters[filterSizeId] || "") + "'" +
                    " data-filter-" + filterFinishId + "='" + esc(t.filters[filterFinishId] || "") + "'" +
                    " data-filter-" + filterTypeId + "='" + esc(t.filters[filterTypeId] || "") + "'" +
                    " data-filter-31='" + esc(t.filters["31"] || "") + "'" +
                    " data-filter-34='" + esc(t.filters["34"] || "") + "'" +
                    " data-filter-33='" + esc(t.filters["33"] || "") + "'" +
                    " data-filter-29='" + esc(t.filters["29"] || "0") + "'" +
                    " data-filter-30='" + esc(t.filters["30"] || "0") + "'" +
                    " data-q='" + esc(t.__q) + "'" +
                    " data-fav-id='" + favId + "'" +
                    " data-cat-a='" + esc(t.__catA) + "'" +
                    " data-cat-b='" + esc(t.__catB) + "'>" +
                        "<input type=\"radio\" class=\"tile-type-input\" value=\"" + esc(t.id) + "\" data-tile-width=\"" + esc(t.size[0]) + "\" data-tile-height=\"" + esc(t.size[1]) + "\" name=\"tile_" + panel + "_radio\" id=\"tile_radio_" + esc(t.id) + "\"/>" +
                        "<label class=\"tile-type-label\" aria-label=\"" + name + "\" for=\"tile_radio_" + esc(t.id) + "\">" +
                            "<img style=\"max-width:100%;max-height:62px;\" data-src=\"" + img + "\"/>" +
                            "<div class=\"tile-name\">" + name + "</div>" +
                            "<button type=\"button\" class=\"tile-fav-btn\" data-fav-id=\"" + favId + "\" title=\"Add to favourites\"><span class=\"btn-icon\" aria-hidden=\"true\">♥</span></button>" +
                        "</label>" +
                "</li>";
        }).join("");
    }

    function buildBulkActionsHtml(panel, filterId) {
        return "" +
            "<div class='filter-bulk-actions'>" +
                "<button type='button' class='filter-bulk-btn' data-key='" + panel + "' data-filter-id='" + filterId + "' data-action='all'>All</button>" +
                "<button type='button' class='filter-bulk-btn' data-key='" + panel + "' data-filter-id='" + filterId + "' data-action='none'>None</button>" +
                "<button type='button' class='filter-bulk-btn' data-key='" + panel + "' data-filter-id='" + filterId + "' data-action='invert'>Invert</button>" +
            "</div>";
    }

    function replaceOptionsInFilterGroup(panel, filterId, values) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $modal = $("#filter-section-" + panel);
        if (!$modal.length) return;

        var $group = $modal.find('[data-filter-id="' + filterId + '"]').first().closest(".form-group");
        if (!$group.length || !(values instanceof Array) || !values.length) return;

        var html = buildBulkActionsHtml(panel, filterId) + "<hr/>";

        values.forEach(function(v) {
            var val = esc(v);
            html += "" +
                "<span style='display:inline-block; padding:8px 15px; width: 45%;'>" +
                    "<input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' data-for=\"filter\" data-filter-type=\"option\" data-filter-id=\"" + filterId + "\" data-min=0 data-max=1 value='" + val + "'/>" + val +
                "</span>";
        });

        $group.find(".col-sm-9").html(html);
    }

    function upsertOptionFilterGroup(panel, filterId, label, values) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $modal = $("#filter-section-" + panel);
        if (!$modal.length) return;
        if (!(values instanceof Array) || !values.length) return;

        var $targetInput = $modal.find('[data-filter-id="' + filterId + '"]').first();
        var $group = $targetInput.length ? $targetInput.closest(".form-group") : $();

        var optionHtml = buildBulkActionsHtml(panel, filterId) + "<hr/>";

        values.forEach(function(v) {
            var val = esc(v);
            optionHtml += "" +
                "<span style='display:inline-block; padding:8px 15px; width: 45%;'>" +
                "<input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' data-for=\"filter\" data-filter-type=\"option\" data-filter-id=\"" + filterId + "\" data-min=0 data-max=1 value='" + val + "'/>" + val +
                "</span>";
        });

        if ($group.length) {
            $group.find(".col-sm-3.control-label").text(label);
            $group.find(".col-sm-9").html(optionHtml);
            return;
        }

        var groupHtml = "" +
            "<div class=\"form-group\" data-dynamic-filter-group=\"1\" data-dynamic-filter-id=\"" + filterId + "\">" +
            "<label class=\"col-sm-3 control-label\">" + esc(label) + "</label>" +
            "<div class=\"col-sm-9\">" + optionHtml + "</div>" +
            "</div>";

        var $form = $modal.find("form.filter_form");
        var $footerGroup = $form.find(".form-group").last();
        if ($footerGroup.length) {
            $footerGroup.after(groupHtml);
        } else {
            $form.append(groupHtml);
        }
    }

    function removeFilterGroup(panel, filterId) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $modal = $("#filter-section-" + panel);
        if (!$modal.length) return;

        var $targetInput = $modal.find('[data-filter-id="' + filterId + '"]').first();
        if ($targetInput.length) {
            $targetInput.closest(".form-group").remove();
        }
    }

    function uniqNonEmpty(arr) {
        var out = [];
        var seen = {};
        (arr || []).forEach(function(v) {
            var s = String(v || "").trim();
            if (!s) return;
            var key = s.toLowerCase();
            if (seen[key]) return;
            seen[key] = true;
            out.push(s);
        });
        return out;
    }

    function fetchJson(url) {
        return fetch(url, { credentials: "include" }).then(function(res) {
            if (!res.ok) {
                throw new Error("Request failed (" + res.status + "): " + url);
            }
            return res.json();
        });
    }

    function getApiBase(opts) {
        var fromOpts = opts && opts.apiBase;
        var fromGlobal = global.VISUALIZER_API_BASE;
        var fromPublicEnv = global.NEXT_PUBLIC_API_BASE;
        var fromParentEnv = "";
        try {
            if (global.parent && global.parent !== global) {
                fromParentEnv = global.parent.NEXT_PUBLIC_API_BASE || global.parent.VISUALIZER_API_BASE || "";
            }
        } catch (e) {}
        var fromStorage = "";
        try {
            fromStorage = global.localStorage && localStorage.getItem("visualizer_api_base");
        } catch (e) {}
        return normalizeApiBase(fromOpts || fromPublicEnv || fromParentEnv || fromGlobal || fromStorage || "");
    }

    function getPreferredFilters() {
        var app = "";
        var color = "";
        try {
            app = (localStorage.getItem("selected_application") || "").trim();
            color = (localStorage.getItem("selected_color") || "").trim();
        } catch (e) {}
        return { app: app, color: color };
    }

    function syncStoredFiltersToCheckboxes(panel) {
        var scope = $("#filter-section-" + panel);
        if (!scope.length) return;
    
        var storedApp = (localStorage.getItem("selected_application") || "").toLowerCase();
        var storedColor = (localStorage.getItem("selected_color") || "").toLowerCase();
    
        // APPLICATION (id = 34)
        if (storedApp) {
            var $apps = scope.find('input[data-filter-id="34"]');
            $apps.prop("checked", false);
    
            $apps.each(function () {
                if ($(this).val().toLowerCase() === storedApp) {
                    $(this).prop("checked", true);
                }
            });
        }
    
        // COLOR (id = 33)
        if (storedColor) {
            var $colors = scope.find('input[data-filter-id="33"]');
            $colors.prop("checked", false);
    
            $colors.each(function () {
                if ($(this).val().toLowerCase() === storedColor) {
                    $(this).prop("checked", true);
                }
            });
        }
    
        refreshFilterVisualState(panel);
    }

    function applyTileDataToUi(panel, panelTiles) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $ul = $("#tiles-list-" + panel);
        if (!$ul.length) return;

        $ul.html(buildTileListHtml(panelTiles, panel));

        $ul.find(".tile-type-label > img").each(function() {
            if (this.dataset && this.dataset.src) {
                this.src = this.dataset.src;
                delete this.dataset.src;
            }
        });

        if ($.fn.preloader) {
            $ul.preloader();
        }
    }

    function setTilesLoading(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $ul = $("#tiles-list-" + panel);
        if (!$ul.length) return;
        $ul.html(
            "<li class='tile-state-item'>" +
                "<div class='tile-state tile-state-loading'>" +
                    "<div class='tile-spinner' aria-hidden='true'></div>" +
                    "<div class='tile-state-text'>Loading products...</div>" +
                "</div>" +
            "</li>"
        );
    }

    function setTilesEmpty(panel, message) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $ul = $("#tiles-list-" + panel);
        if (!$ul.length) return;
        $ul.html("<li class='tile-state-item'><div class='tile-state tile-state-empty'>" + esc(message || "No products available") + "</div></li>");
    }

    function getAuthToken() {
        try {
            return sessionStorage.getItem("pgatoken");
        } catch (e) {
            return null;
        }
    }

    function clearAuthToken() {
        try {
            sessionStorage.removeItem("pgatoken");
        } catch (e) {}
    }

    function getFavorites() {
        try {
            var raw = localStorage.getItem("visualizer_favorites_v1");
            var parsed = raw ? JSON.parse(raw) : [];
            return parsed instanceof Array ? parsed.map(String) : [];
        } catch (e) {
            return [];
        }
    }

    function setFavorites(list) {
        try {
            localStorage.setItem("visualizer_favorites_v1", JSON.stringify(list));
        } catch (e) {}
    }

    function toggleFavoriteId(id) {
        var favs = getFavorites();
        var key = String(id);
        var idx = favs.indexOf(key);
        if (idx >= 0) {
            favs.splice(idx, 1);
        } else {
            favs.push(key);
        }
        setFavorites(favs);
        return favs;
    }

    function authHeaders() {
        var token = getAuthToken();
        if (!token) return {};
        return { "Authorization": "Bearer " + token };
    }

    function parseFavoriteIds(payload) {
        var rows = [];
        if (payload instanceof Array) {
            rows = payload;
        } else if (payload && payload.data instanceof Array) {
            rows = payload.data;
        }
        return rows.map(function(item) {
            return String(pick(item, ["tile_id", "tileId", "id"], ""));
        }).filter(Boolean);
    }

    function apiListFavorites(apiBase) {
        return fetch(apiBase + "list_fav", {
            method: "GET",
            headers: authHeaders(),
            credentials: "include"
        }).then(function(res) {
            if (res.status === 401) {
                clearAuthToken();
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("list_fav failed: " + res.status);
            return res.json();
        });
    }

    function apiAddFavorite(apiBase, tileId) {
        return fetch(apiBase + "add_fav/" + encodeURIComponent(tileId), {
            method: "POST",
            headers: authHeaders(),
            credentials: "include"
        }).then(function(res) {
            if (res.status === 401) {
                clearAuthToken();
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("add_fav failed: " + res.status);
            return res.text();
        });
    }

    function apiRemoveFavorite(apiBase, tileId) {
        return fetch(apiBase + "remove_fav/" + encodeURIComponent(tileId), {
            method: "DELETE",
            headers: authHeaders(),
            credentials: "include"
        }).then(function(res) {
            if (res.status === 401) {
                clearAuthToken();
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("remove_fav failed: " + res.status);
            return res.text();
        });
    }

    function ensureAuthModal() {
        if (AUTH_MODAL_READY || !global.jQuery) return;
        var $ = global.jQuery;
        AUTH_MODAL_READY = true;

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
        }

        function isValidMobile(mobile) {
            var digitsOnly = String(mobile || "").replace(/\D/g, "");
            return /^\d{10,15}$/.test(digitsOnly);
        }

        var modalHtml =
            "<div id='authPopupOverlay' class='auth-popup-overlay' style='display:none;'>" +
                "<div class='auth-popup-card'>" +
                    "<button type='button' class='auth-popup-close' aria-label='Close'>×</button>" +
                    "<h3 class='auth-popup-title'>Login</h3>" +
                    "<p class='auth-popup-sub'>Continue to Visualizer</p>" +
                    "<div class='auth-popup-signup auth-signup-only' style='display:none;'>" +
                        "<input type='text' id='authName' placeholder='Full Name' />" +
                        "<div class='auth-grid-2'>" +
                            "<input type='text' id='authProfession' placeholder='Profession' value='Customer' />" +
                            "<input type='text' id='authMobile' placeholder='Mobile' />" +
                        "</div>" +
                    "</div>" +
                    "<input type='text' id='authEmail' placeholder='Email' />" +
                    "<div class='auth-password-wrap'>" +
                        "<input type='password' id='authPassword' placeholder='Password' />" +
                        "<button type='button' id='authTogglePass' class='auth-eye-btn' aria-label='Show password'>👁</button>" +
                    "</div>" +
                    "<button type='button' id='authSubmitBtn' class='auth-submit-btn'>Login</button>" +
                    "<div class='auth-switch-wrap'>" +
                        "<span id='authSwitchText'>No account?</span> " +
                        "<button type='button' id='authSwitchMode' class='auth-link-btn'>Create one</button>" +
                    "</div>" +
                    "<div id='authPopupError' class='auth-error' style='display:none;'></div>" +
                "</div>" +
            "</div>";

        $("body").append(modalHtml);

        var mode = "login";

        function setMode(nextMode) {
            mode = nextMode;
            var isSignup = mode === "signup";
            $("#authPopupOverlay .auth-popup-title").text(isSignup ? "Create Account" : "Login");
            $("#authSubmitBtn").text(isSignup ? "Create Account" : "Login");
            $("#authSwitchText").text(isSignup ? "Already have an account?" : "No account?");
            $("#authSwitchMode").text(isSignup ? "Login" : "Create one");
            $(".auth-signup-only").toggle(isSignup);
            $("#authPopupError").hide().text("");
        }

        function setLoading(isLoading) {
            $("#authSubmitBtn").prop("disabled", isLoading).text(isLoading ? "Please wait..." : (mode === "signup" ? "Create Account" : "Login"));
        }

        function showError(msg) {
            $("#authPopupError").text(msg || "Authentication failed").show();
        }

        function resetFields() {
            $("#authName").val("");
            $("#authProfession").val("Customer");
            $("#authMobile").val("");
            $("#authEmail").val("");
            $("#authPassword").val("");
            $("#authPopupError").hide().text("");
        }

        function closeModal() {
            $("#authPopupOverlay").hide();
        }

        global.openVisualizerAuthPopup = function(nextMode) {
            setMode(nextMode === "signup" ? "signup" : "login");
            resetFields();
            $("#authPopupOverlay").show();
        };

        $(document).on("click", ".auth-popup-close", function() {
            closeModal();
        });

        $(document).on("click", "#authSwitchMode", function() {
            setMode(mode === "login" ? "signup" : "login");
        });

        $(document).on("click", "#authTogglePass", function() {
            var $p = $("#authPassword");
            var isPassword = $p.attr("type") === "password";
            $p.attr("type", isPassword ? "text" : "password");
            $(this).text(isPassword ? "🙈" : "👁");
        });

        $(document).on("click", "#authSubmitBtn", function() {
            var email = String($("#authEmail").val() || "").trim();
            var password = String($("#authPassword").val() || "").trim();
            var name = String($("#authName").val() || "").trim();
            var profession = String($("#authProfession").val() || "Customer").trim() || "Customer";
            var mobile = String($("#authMobile").val() || "").trim();

            if (!email || !password) {
                showError("Please enter email and password.");
                return;
            }
            if (!isValidEmail(email)) {
                showError("Please enter a valid email address.");
                return;
            }
            if (mode === "signup" && (!name || !mobile)) {
                showError("Please enter name and mobile.");
                return;
            }
            if (mode === "signup" && !isValidMobile(mobile)) {
                showError("Please enter a valid mobile number.");
                return;
            }

            var endpoint = mode === "login" ? "cust_login" : "cust_signup";
            var payload = mode === "login"
                ? { email: email, password: password }
                : { name: name, email: email, profession: profession, mobile: mobile, password: password };

            setLoading(true);
            fetch(LAST_API_BASE + endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            }).then(function(res) {
                if (!res.ok) {
                    throw new Error("Request failed (" + res.status + ")");
                }
                return res.json().catch(function() { return null; });
            }).then(function(data) {
                if (mode === "login") {
                    var token = data && data.pgatoken;
                    if (!token) {
                        showError("Invalid credentials.");
                        return;
                    }
                    sessionStorage.setItem("pgatoken", token);
                    $(".sidebar-login-btn").text("Logout");
                    closeModal();
                    syncFavoritesFromServer(LAST_API_BASE);
                    return;
                }

                if (String(data).toLowerCase().indexOf("success") > -1 || (data && data.success)) {
                    setMode("login");
                    showError("Account created. Please login.");
                    return;
                }
                setMode("login");
                showError("Signup successful. Please login.");
            }).catch(function(err) {
                showError(err && err.message ? err.message : "Authentication failed.");
            }).finally(function() {
                setLoading(false);
            });
        });
    }

    function syncFavoritesFromServer(apiBase) {
        if (!getAuthToken()) return Promise.resolve(getFavorites());
        if (!apiBase) return Promise.resolve(getFavorites());
        if (FAVORITES_SYNC_IN_FLIGHT) return FAVORITES_SYNC_IN_FLIGHT;

        FAVORITES_SYNC_IN_FLIGHT = apiListFavorites(apiBase)
            .then(function(payload) {
                var ids = parseFavoriteIds(payload);
                setFavorites(ids);
                refreshFavoriteUi(1);
                refreshFavoriteUi(2);
                applyFavoriteFilter(1);
                applyFavoriteFilter(2);
                return ids;
            })
            .catch(function(err) {
                console.warn("[dynamic-tiles-api] list_fav sync failed:", err && err.message ? err.message : err);
                return getFavorites();
            })
            .finally(function() {
                FAVORITES_SYNC_IN_FLIGHT = null;
            });

        return FAVORITES_SYNC_IN_FLIGHT;
    }

    function ensureAuthBar(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $panel = $("#menuPanel" + panel);
        if (!$panel.length) return;

        if (!$panel.find(".sidebar-auth-bar").length) {
            var html =
                "<div class='sidebar-auth-bar'>" +
                    "<div class='sidebar-brand'>Ti<span>Vi</span></div>" +
                    "<div class='sidebar-auth-actions'>" +
                        "<button type='button' class='sidebar-fav-toggle' data-panel='" + panel + "' title='Favourites'><span class='btn-icon' aria-hidden='true'>♥</span></button>" +
                        "<button type='button' class='sidebar-login-btn' data-panel='" + panel + "'></button>" +
                    "</div>" +
                "</div>";
            $panel.find("form").first().prepend(html);
        }

        var loggedIn = !!getAuthToken();
        var $btn = $panel.find(".sidebar-login-btn").first();
        $btn.text(loggedIn ? "Logout" : "Login");
    }

    function ensureFilterIconButton(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $panel = $("#menuPanel" + panel);
        var $filterBtn = $panel.find(".top_btns .custom_default_btn[data-target='#filter-section-" + panel + "']").first();
        if (!$filterBtn.length) return;
        if ($filterBtn.hasClass("filter-icon-btn")) return;
        $filterBtn.addClass("filter-icon-btn");
        $filterBtn.html("<span class='btn-icon' aria-hidden='true'>◈</span><span>Filters</span>");
    }

    function ensureFavButtons(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $panel = $("#menuPanel" + panel);
        $panel.find(".tiles-list .tile-wrap").each(function() {
            var $li = $(this);
            var favId = $li.attr("data-fav-id");
            if (!favId) {
                var inputVal = $li.find(".tile-type-input").first().val();
                favId = String(inputVal || "");
                $li.attr("data-fav-id", favId);
            }
            var $label = $li.find(".tile-type-label").first();
            if ($label.length && !$label.find(".tile-fav-btn").length) {
                $label.append("<button type='button' class='tile-fav-btn' data-fav-id='" + esc(favId) + "' title='Add to favourites'><span class='btn-icon' aria-hidden='true'>♥</span></button>");
            }
        });
        refreshFavoriteUi(panel);
    }

    function refreshFavoriteUi(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var favs = getFavorites();
        $("#menuPanel" + panel).find(".tile-fav-btn").each(function() {
            var id = String($(this).attr("data-fav-id") || "");
            $(this).toggleClass("is-fav", favs.indexOf(id) >= 0);
        });
    }

    function applyFavoriteFilter(panel) {
        if (!global.jQuery) return;
        var $ = global.jQuery;
        var $panel = $("#menuPanel" + panel);
        var active = $panel.find(".sidebar-fav-toggle").hasClass("is-active");
        if (!active) {
            $panel.find(".tile-wrap").show();
            if (typeof global.updateVisualizerTileResultsState === "function") {
                global.updateVisualizerTileResultsState(panel, "No products found");
            }
            return;
        }

        var favs = getFavorites();
        $panel.find(".tile-wrap").each(function() {
            var id = String($(this).attr("data-fav-id") || "");
            $(this).toggle(favs.indexOf(id) >= 0);
        });
        if (typeof global.updateVisualizerTileResultsState === "function") {
            global.updateVisualizerTileResultsState(panel, "No products found");
        }
    }

    function bindSidebarEvents() {
        if (!global.jQuery || global.__sidebarEnhancementsBound) return;
        var $ = global.jQuery;
        global.__sidebarEnhancementsBound = true;
        ensureAuthModal();

        $(document).on("click", ".sidebar-login-btn", function() {
            if (getAuthToken()) {
                clearAuthToken();
                setFavorites([]);
                $(".sidebar-login-btn").text("Login");
                refreshFavoriteUi(1);
                refreshFavoriteUi(2);
                applyFavoriteFilter(1);
                applyFavoriteFilter(2);
                return;
            }
            global.openVisualizerAuthPopup("login");
        });

        $(document).on("click", ".sidebar-fav-toggle", function() {
            var panel = Number($(this).attr("data-panel"));
            if (!getAuthToken()) {
                global.openVisualizerAuthPopup("login");
                return;
            }
            syncFavoritesFromServer(LAST_API_BASE);
            $(this).toggleClass("is-active");
            applyFavoriteFilter(panel);
        });

        $(document).on("click", ".tile-fav-btn", function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!getAuthToken()) {
                global.openVisualizerAuthPopup("login");
                return;
            }

            var id = String($(this).attr("data-fav-id") || "");
            var favs = getFavorites();
            var alreadyFav = favs.indexOf(id) >= 0;

            var req = alreadyFav
                ? apiRemoveFavorite(LAST_API_BASE, id)
                : apiAddFavorite(LAST_API_BASE, id);

            req.then(function() {
                if (alreadyFav) {
                    var idx = favs.indexOf(id);
                    if (idx >= 0) favs.splice(idx, 1);
                } else if (favs.indexOf(id) === -1) {
                    favs.push(id);
                }
                setFavorites(favs);
                refreshFavoriteUi(1);
                refreshFavoriteUi(2);
                applyFavoriteFilter(1);
                applyFavoriteFilter(2);
            }).catch(function(err) {
                console.warn("[dynamic-tiles-api] favourite toggle failed:", err && err.message ? err.message : err);
            });
        });
    }

    function enhanceSidebar(panel) {
        ensureAuthBar(panel);
        ensureFilterIconButton(panel);
        ensureFavButtons(panel);
    }

    function forceEnhanceSidebar(panel) {
        bindSidebarEvents();
        enhanceSidebar(panel);
        if (LAST_API_BASE) {
            syncFavoritesFromServer(LAST_API_BASE);
        } else {
            refreshFavoriteUi(panel);
        }
    }

    function initializeDynamicTilesFromApi(opts) {
        opts = opts || {};
        if (typeof fetch !== "function") {
            return Promise.resolve(null);
        }

        var roomId = detectRoomId(opts.roomId);
        var spaceName = detectSpaceName(roomId, opts.spaceName);
        var apiBase = getApiBase(opts);
        LAST_API_BASE = apiBase;
        ensureTopHeaderActions(roomId, spaceName);

        setTilesLoading(1);
        setTilesLoading(2);

        var optionsUrl = apiBase + "FilterOptions?spaceName=" + encodeURIComponent(spaceName);
        // Fetch the complete tile set for the selected space.
        // Preference values are applied in UI state (checkboxes + applyFilter),
        // so users can switch to any other color/application without being
        // constrained by an already pre-filtered API response.
        var tilesQuery = "spaceName=" + encodeURIComponent(spaceName);
        var tilesUrl = apiBase + "FilterTileList?" + tilesQuery;

        return Promise.all([
            fetchJson(optionsUrl).catch(function() { return null; }),
            fetchJson(tilesUrl)
        ]).then(function(results) {
            var optionsData = results[0] || {};
            var tilesData = results[1];
            var rows = (tilesData instanceof Array) ? tilesData : (tilesData && tilesData.data instanceof Array ? tilesData.data : []);
            if (!rows.length) {
                setTilesEmpty(1, "No products available");
                setTilesEmpty(2, "No products available");
                return {
                    roomId: roomId,
                    spaceName: spaceName,
                    tileCount: 0
                };
            }

            var uniqueRows = [];
            var seen = {};
            rows.forEach(function(item, idx) {
                var key = String(pick(item, ["tile_id", "tileId", "id", "sku_code"], "r_" + idx));
                if (seen[key]) return;
                seen[key] = true;
                uniqueRows.push(item);
            });

            var panelTiles = { "1": [], "2": [] };
            uniqueRows.forEach(function(item, idx) {
                panelTiles["1"].push(mapToLegacyTile(item, 1, idx));
                panelTiles["2"].push(mapToLegacyTile(item, 2, idx));
            });

            buildPanelCats(panelTiles["1"], 1);
            buildPanelCats(panelTiles["2"], 2);

            var allTiles = panelTiles["1"].concat(panelTiles["2"]);
            var avail = {};
            allTiles.forEach(function(t) { avail[String(t.id)] = t; });
            global.avail_tiles = avail;

            global.tits = {
                "a12": "Tiles",
                "b8": "Type-1",
                "a20": "Random Tiles",
                "b12": "Type-1"
            };

            global.cats = {
                "1": buildPanelCats(panelTiles["1"], 1),
                "2": buildPanelCats(panelTiles["2"], 2)
            };

            global.colors = global.colors || {
                "1": "#aeaeae",
                "2": "#000000",
                "3": "#ffffff",
                "4": "#894545",
                "5": "#ffffd2",
                "6": "#2f3e17",
                "7": "#575757"
            };

            applyTileDataToUi(1, panelTiles["1"]);
            applyTileDataToUi(2, panelTiles["2"]);
            bindSidebarEvents();
            enhanceSidebar(1);
            enhanceSidebar(2);
            ensureTopHeaderActions(roomId, spaceName);
            syncFavoritesFromServer(apiBase);

            var sizeValues = uniqNonEmpty((optionsData && optionsData.sizes) || uniqueRows.map(function(r) { return pick(r, ["size_name", "sizeName"], ""); }));
            var finishValues = uniqNonEmpty((optionsData && optionsData.finishes) || uniqueRows.map(function(r) { return pick(r, ["finish_name", "finish"], ""); }));
            var categoryValues = uniqNonEmpty((optionsData && optionsData.categories) || uniqueRows.map(function(r) { return pick(r, ["cat_name", "category_name", "category"], ""); }));
            var applicationValues = ["WALL", "FLOOR"];
            var colorValues = uniqNonEmpty((optionsData && optionsData.colors) || uniqueRows.map(function(r) { return pick(r, ["color_name", "color"], ""); }));
            colorValues = uniqNonEmpty([].concat.apply([], colorValues.map(splitCsvValues)));

            replaceOptionsInFilterGroup(1, 23, sizeValues);
            replaceOptionsInFilterGroup(1, 25, finishValues);
            removeFilterGroup(1, 29); // Remove legacy Price (panel 1)
            removeFilterGroup(1, 30); // Remove Price
            removeFilterGroup(1, 31); // Remove legacy Sanita Wall
            removeFilterGroup(1, 32); // Remove legacy Sanita Floor
            upsertOptionFilterGroup(1, 27, "Category", categoryValues);
            upsertOptionFilterGroup(1, 34, "Application", applicationValues);
            upsertOptionFilterGroup(1, 33, "Color", colorValues);
            replaceOptionsInFilterGroup(2, 24, sizeValues);
            replaceOptionsInFilterGroup(2, 26, finishValues);
            removeFilterGroup(2, 29); // Defensive cleanup
            removeFilterGroup(2, 30); // Remove Price
            removeFilterGroup(2, 31); // Remove legacy Sanita Wall
            removeFilterGroup(2, 32); // Remove legacy Sanita Floor
            upsertOptionFilterGroup(2, 28, "Category", categoryValues);
            upsertOptionFilterGroup(2, 34, "Application", applicationValues);
            upsertOptionFilterGroup(2, 33, "Color", colorValues);

            syncStoredFiltersToCheckboxes("1");
            syncStoredFiltersToCheckboxes("2");

            if (typeof global.init_number_filters === "function") {
                global.init_number_filters("1");
                global.init_number_filters("2");
            }
            if (typeof global.applyFilter === "function") {
                // Apply filters after syncing stored preferences so initial view
                // reflects selected refine-preference values (e.g. color).
                global.applyFilter("1");
                global.applyFilter("2");
            }

            return {
                roomId: roomId,
                spaceName: spaceName,
                tileCount: uniqueRows.length
            };
        }).catch(function(err) {
            console.warn("[dynamic-tiles-api] API load failed:", err && err.message ? err.message : err);
            setTilesEmpty(1, "No products available");
            setTilesEmpty(2, "No products available");
            bindSidebarEvents();
            enhanceSidebar(1);
            enhanceSidebar(2);
            ensureTopHeaderActions(roomId, spaceName);
            syncFavoritesFromServer(apiBase);
            return null;
        });
    }

    global.initDynamicTilesFromApi = initializeDynamicTilesFromApi;
    global.forceEnhanceVisualizerSidebar = forceEnhanceSidebar;
    global.setVisualizerTilesLoading = setTilesLoading;
    global.setVisualizerTilesEmpty = setTilesEmpty;
})(window);
