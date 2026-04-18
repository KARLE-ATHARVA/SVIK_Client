var actualWdth;
var menuLeft = document.getElementById('cbp-spmenu-s1'),
    showLeft = document.getElementById('showLeft'),
    body     = document.body;
// Ensure asset base is available inside iframe
try {
    if (window.parent && window.parent !== window) {
        var parentAsset = window.parent.NEXT_PUBLIC_ASSET_BASE || window.parent.VISUALIZER_ASSET_BASE || "";
        var parentRemoteAsset = window.parent.NEXT_PUBLIC_REMOTE_ASSET_BASE || "";
        var isLocalDevHost = false;
        try {
            var host = (window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
            isLocalDevHost = host === "localhost" || host === "127.0.0.1";
        } catch (e) {}
        if (typeof parentAsset === "string" && parentAsset.trim()) {
            var base = parentAsset.trim();
            if (!isLocalDevHost && base.indexOf("/__asset_proxy__/") === 0 && typeof parentRemoteAsset === "string" && parentRemoteAsset.trim()) {
                base = parentRemoteAsset.trim();
            }
            if (base.slice(-1) !== "/") base += "/";
            window.VISUALIZER_ASSET_BASE = base;
            if (window.localStorage) {
                localStorage.setItem("visualizer_asset_base", base);
            }
        }
    }
} catch (e) {}
$(window).load(function() {
    $('#preloader').hide();
    $('#preloader2').hide();
    // img_click();
    orient();
    sidemenu();
    // btn_click();
    hideAddressbar('#page');
    setRightMenu();

    $('#show_btn').click(function(event) {
        if ($('.show_img').is(":visible")) {
            $('#cbp-spmenu-s1').removeClass('cbp-spmenu-open');
            $(".header_nav_xs").show();
            $(".right_side_btns").show();
            $(".show_img").hide();
            $(".hide_img").show();
            $('.right_toggle_btn').css({
                'left': '0px'
            });
        } else {
            if ($('.hide_img').is(':visible')) {
                $(".header_nav_xs").hide();
                $(".right_side_btns").hide();
                $('.right_toggle_btn').show();
                $(".show_img").show();
                $(".hide_img").hide();
                $('.right_toggle_btn').css('left', '90%');
            }
        }
    });

    $("#showLeft").click(function() {
        classie.toggle(this, 'active');
        classie.toggle(menuLeft, 'cbp-spmenu-open');
        disableOther('showLeft');
    });
});

$(function(){
    if (typeof $ === "function") {
        $("body").addClass("has-highlight-btn");
    }
    function isRoom6Page() {
        return true;
    }
    function isHighlightWallTarget() {
        var target = Number(window.__targetTileType || window.__wallTargetTileType || 1);
        if (window.__wallTileTypes && window.__wallTileTypes.length) {
            return window.__wallTileTypes.indexOf(target) !== -1;
        }
        if (window.scene_data && scene_data.length) {
            for (var i = 0; i < scene_data.length; i++) {
                if (scene_data[i][0] == target) {
                    var name = String(scene_data[i][176] || "").toLowerCase();
                    if (name.indexOf("floor") !== -1) return false;
                    if (name.indexOf("wall") !== -1) return true;
                }
            }
        }
        return target !== 2;
    }

    $(document).on("click", ".highlight-area-btn", function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!isRoom6Page()) return;
        if (!isHighlightWallTarget()) return;
        if (window.__highlightModeActive && !window.__highlightActive) {
            window.__highlightModeActive = false;
            window.__highlightPending = false;
            window.__highlightShape = null;
            window.__highlightLastShape = null;
            window.__highlightAllowRetile = false;
            if (typeof window.hideHighlightOverlay === "function") {
                window.hideHighlightOverlay();
            }
            return;
        }
        if (typeof window.startHighlightArea === "function") {
            window.startHighlightArea();
        }
    });

    window.scheduleRender = (function() {
        var pending = false;
        return function() {
            if (pending) return;
            pending = true;
            var run = function() {
                pending = false;
                if (typeof render === "function" && window.vis_cvs) {
                    render(vis_cvs);
                }
            };
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(run);
            } else {
                setTimeout(run, 0);
            }
        };
    })();

    function getHighlightTileOverlay() {
        var canvas = document.getElementById("highlight-tile-overlay");
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "highlight-tile-overlay";
            canvas.style.position = "absolute";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "50";
            canvas.style.opacity = "1";
            canvas.style.mixBlendMode = "normal";
            var host = document.getElementById("cont_for_vis_cvs") || document.body;
            if (host && host !== document.body) {
                try {
                    var computed = window.getComputedStyle(host);
                    if (computed && computed.position === "static") {
                        host.style.position = "relative";
                    }
                } catch (e) {}
            }
            host.appendChild(canvas);
        }
        return canvas;
    }

    function updateHighlightOverlayPlacement(canvas) {
        if (!window.vis_cvs || !canvas) return;
        var rect = vis_cvs.getBoundingClientRect();
        var host = canvas.parentNode;
        var hostRect = host && host.getBoundingClientRect ? host.getBoundingClientRect() : null;
        canvas.width = vis_cvs.width;
        canvas.height = vis_cvs.height;
        if (hostRect) {
            canvas.style.left = (rect.left - hostRect.left) + "px";
            canvas.style.top = (rect.top - hostRect.top) + "px";
        } else {
            canvas.style.left = rect.left + "px";
            canvas.style.top = rect.top + "px";
        }
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
    }

    function createHighlightBrushEl(index) {
        var el = document.createElement("button");
        el.type = "button";
        el.textContent = "✎";
        el.setAttribute("data-highlight-index", String(index));
        el.style.position = "absolute";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.border = "1px solid #0e4645";
            el.style.background = "#fff";
            el.style.color = "#0e4645";
            el.style.fontSize = "14px";
            el.style.lineHeight = "22px";
            el.style.textAlign = "center";
            el.style.padding = "0";
            el.style.cursor = "pointer";
            el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.18)";
            el.style.zIndex = "120";
        el.style.display = "none";
        var host = document.getElementById("cont_for_vis_cvs") || document.body;
        if (host && host !== document.body) {
            try {
                var computed = window.getComputedStyle(host);
                if (computed && computed.position === "static") {
                    host.style.position = "relative";
                }
            } catch (e) {}
        }
        host.appendChild(el);
        el.addEventListener("click", function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!window.__highlightSelections || !window.__highlightSelections.length) return;
            var idx = Number(el.getAttribute("data-highlight-index"));
            if (!isFinite(idx)) return;
            var sel = window.__highlightSelections[idx];
            if (!sel || !sel.shape) return;
            window.__highlightModeActive = true;
            window.__highlightAllowRetile = true;
            window.__highlightLastShape = cloneObj(sel.shape);
            window.__highlightActiveSelectionIndex = idx;
            window.__highlightPending = false;
            if (typeof showLeftMenu === "function") {
                var panel = 1;
                var target = Number(window.__targetTileType || window.__wallTargetTileType || 1);
                if (target === 2) panel = 2;
                showLeftMenu(panel);
            }
        }, true);
        return el;
    }

    function updateHighlightBrushUI() {
        if (!isRoom6Page()) return;
        if (!window.__highlightSelections || !window.__highlightSelections.length || !window.vis_cvs) {
            if (window.__highlightBrushEls) {
                window.__highlightBrushEls.forEach(function(el) { if (el) el.style.display = "none"; });
            }
            return;
        }
        window.__highlightBrushEls = window.__highlightBrushEls || [];
        var rect = vis_cvs.getBoundingClientRect();
        var baseW = (window.line_cvs && line_cvs.width) ? line_cvs.width : vis_cvs.width;
        var baseH = (window.line_cvs && line_cvs.height) ? line_cvs.height : vis_cvs.height;
        var scaleX = rect.width / baseW;
        var scaleY = rect.height / baseH;
        window.__highlightSelections.forEach(function(sel, idx) {
            var el = window.__highlightBrushEls[idx];
            if (!el) {
                el = createHighlightBrushEl(idx);
                window.__highlightBrushEls[idx] = el;
            }
            el.setAttribute("data-highlight-index", String(idx));
            if (!sel || !sel.shape || !sel.shape.length) {
                el.style.display = "none";
                return;
            }
            var bounds = sel.shape.reduce(function(acc, p) {
                var px = p[0] * scaleX;
                var py = p[1] * scaleY;
                acc.minX = Math.min(acc.minX, px);
                acc.maxX = Math.max(acc.maxX, px);
                acc.minY = Math.min(acc.minY, py);
                acc.maxY = Math.max(acc.maxY, py);
                return acc;
            }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
            if (!isFinite(bounds.minX) || !isFinite(bounds.minY)) {
                el.style.display = "none";
                return;
            }
            var host = el.parentNode;
            var hostRect = host && host.getBoundingClientRect ? host.getBoundingClientRect() : null;
            var left = rect.left + bounds.maxX - 12;
            var top = rect.top + bounds.minY - 12;
            if (hostRect) {
                left -= hostRect.left;
                top -= hostRect.top;
            }
            el.style.left = Math.max(0, left) + "px";
            el.style.top = Math.max(0, top) + "px";
            el.style.display = "block";
        });
    }

    function drawTileInShape(ctx, canvas, tile, shapePoints, selectionIndex, version) {
        if (!tile || !shapePoints || !shapePoints.length) return;
        var src = "";
        if (typeof getTileImageSrc === "function") {
            src = getTileImageSrc(tile);
        }
        if (!src) {
            src = (typeof tile.image === "string") ? tile.image : (tile.image && tile.image.src ? tile.image.src : "");
        }
        if (!src) return;

        window.__highlightImageCache = window.__highlightImageCache || {};
        window.__highlightImageLoading = window.__highlightImageLoading || {};
        var cached = window.__highlightImageCache[src];
        if (cached && cached.complete) {
            var img = cached;
            if (typeof selectionIndex === "number") {
                if (!window.__highlightSelectionVersion || window.__highlightSelectionVersion[selectionIndex] !== version) {
                    return;
                }
            }
            drawImageNow(img);
            return;
        }
        if (window.__highlightImageLoading[src]) return;
        var img = new Image();
        if (typeof resolveVisualizerImageSrc === "function") {
            src = resolveVisualizerImageSrc(src);
        }
        try {
            var parsedSrc = new URL(src, window.location.href);
            if (parsedSrc.origin !== window.location.origin) {
                img.crossOrigin = "anonymous";
            }
        } catch (e) {}
        window.__highlightImageLoading[src] = true;
        img.onload = function() {
            window.__highlightImageCache[src] = img;
            window.__highlightImageLoading[src] = false;
            if (typeof selectionIndex === "number") {
                if (!window.__highlightSelectionVersion || window.__highlightSelectionVersion[selectionIndex] !== version) {
                    return;
                }
            }
            drawImageNow(img);
        };
        img.onerror = function() {
            window.__highlightImageLoading[src] = false;
        };
        img.src = src;

        function drawImageNow(imgEl) {
            var baseW = (window.line_cvs && line_cvs.width) ? line_cvs.width : canvas.width;
            var baseH = (window.line_cvs && line_cvs.height) ? line_cvs.height : canvas.height;
            var scaleX = canvas.width / baseW;
            var scaleY = canvas.height / baseH;

            ctx.save();
            var maskPoints = findSceneMask(tile.tile_type || tile.tileType || tile.type);
            if (maskPoints && maskPoints.length) {
                ctx.beginPath();
                for (var m = 0; m < maskPoints.length; m++) {
                    ctx.lineTo(maskPoints[m][0] * scaleX, maskPoints[m][1] * scaleY);
                }
                ctx.closePath();
                ctx.clip();
            }

            ctx.beginPath();
            var scaled = [];
            for (var k = 0; k < shapePoints.length; k++) {
                var px = shapePoints[k][0] * scaleX;
                var py = shapePoints[k][1] * scaleY;
                scaled.push([px, py]);
                ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.clip();

            var bounds = scaled.reduce(function(acc, p) {
                acc.minX = Math.min(acc.minX, p[0]);
                acc.maxX = Math.max(acc.maxX, p[0]);
                acc.minY = Math.min(acc.minY, p[1]);
                acc.maxY = Math.max(acc.maxY, p[1]);
                return acc;
            }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
            var bw = Math.max(1, bounds.maxX - bounds.minX);
            var bh = Math.max(1, bounds.maxY - bounds.minY);
            ctx.drawImage(imgEl, bounds.minX, bounds.minY, bw, bh);
            if (window.scene_foreground_mask_img) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.drawImage(scene_foreground_mask_img, 0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = "source-over";
            }
            ctx.restore();
        }
    }

    function redrawHighlightTileOverlay() {
        if (!isRoom6Page()) return;
        var canvas = getHighlightTileOverlay();
        updateHighlightOverlayPlacement(canvas);
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (window.__highlightUseShapes) {
            updateHighlightBrushUI();
            return;
        }
        if (!window.__highlightSelections || !window.__highlightSelections.length) return;
        window.__highlightSelections.forEach(function(sel, idx) {
            if (sel && sel.tile && sel.shape) {
                var version = (window.__highlightSelectionVersion && window.__highlightSelectionVersion[idx]) || 0;
                drawTileInShape(ctx, canvas, sel.tile, sel.shape, idx, version);
            }
        });
        updateHighlightBrushUI();
    }

    function findSceneMask(tileType) {
        if (!window.scene_data || !tileType) return null;
        for (var i = 0; i < scene_data.length; i++) {
            if (scene_data[i][0] == tileType) {
                return scene_data[i][11];
            }
        }
        return null;
    }

    window.applyHighlightTileOverlay = function(tile, shapePoints, selectionIndex) {
        if (!isRoom6Page()) return;
        if (!window.vis_cvs || !tile || !shapePoints || !shapePoints.length) return;
        window.__highlightSelections = window.__highlightSelections || [];
        window.__highlightSelectionVersion = window.__highlightSelectionVersion || [];
        var highlightTileType = Number(window.__wallTargetTileType || window.__targetTileType || tile.tile_type || 1);
        if (window.__wallTileTypes && window.__wallTileTypes.length) {
            if (window.__wallTileTypes.indexOf(highlightTileType) === -1) {
                highlightTileType = Number(window.__wallTileTypes[0] || highlightTileType);
            }
        }
        var idx = (typeof selectionIndex === "number" && isFinite(selectionIndex)) ? selectionIndex : -1;
        if (idx < 0) {
            idx = window.__highlightSelections.length;
        }
        window.__highlightSelections[idx] = {
            tile: tile,
            shape: cloneObj(shapePoints)
        };
        window.__highlightSelectionVersion[idx] = (window.__highlightSelectionVersion[idx] || 0) + 1;
        window.__highlightUseShapes = true;
        window.__highlightShapes = window.__highlightShapes || [];

        function normalizeSizeForHighlight(data, sourceTile) {
            if (data.size && data.size.length) return;
            if (sourceTile && sourceTile.size && sourceTile.size.length) {
                data.size = sourceTile.size;
                return;
            }
            var raw = String((sourceTile && (sourceTile.size_name || sourceTile.sizeName || sourceTile.size)) || "");
            var m = raw.match(/(\d+)\s*[xX]\s*(\d+)/);
            if (m) {
                data.size = [Number(m[1]), Number(m[2])];
            }
        }

        function upsertHighlightShape(data) {
            if (!data) return;
            data.shape = cloneObj(shapePoints);
            data.__highlight = true;
            data.__highlightIndex = idx;
            if (tile && tile.grout_color && !data.grout_color) data.grout_color = tile.grout_color;
            if (tile && tile.grout_id && !data.grout_id) data.grout_id = tile.grout_id;
            normalizeSizeForHighlight(data, tile);
            var replaced = false;
            for (var i = 0; i < window.__highlightShapes.length; i++) {
                if (window.__highlightShapes[i] && window.__highlightShapes[i].__highlightIndex === idx) {
                    window.__highlightShapes[i] = data;
                    replaced = true;
                    break;
                }
            }
            if (!replaced) window.__highlightShapes.push(data);
            if (window.shapes && shapes.length) {
                shapes = shapes.filter(function(s) { return !s || !s.__highlight; });
            } else {
                shapes = shapes || [];
            }
            window.__highlightShapes.forEach(function(s) { shapes.push(s); });
            if (typeof window.scheduleRender === "function") {
                scheduleRender();
            } else if (typeof render === "function" && window.vis_cvs) {
                render(vis_cvs);
            }
            updateHighlightBrushUI();
        }

        tile.tile_type = highlightTileType;
        if (typeof setShape === "function") {
            setShape(highlightTileType, tile, function(data1) {
                data1.tile_type = highlightTileType;
                upsertHighlightShape(data1);
            });
        } else {
            tile.tile_type = highlightTileType;
            upsertHighlightShape(tile);
        }
    };

    function applyHighlightShapeTile(tile, shapePoints, selectionIndex) {
        if (!tile || !shapePoints || !shapePoints.length) return;
        var targetType = Number(window.__wallTargetTileType || window.__targetTileType || tile.tile_type || 1);
        if (window.__wallTileTypes && window.__wallTileTypes.length) {
            if (window.__wallTileTypes.indexOf(targetType) === -1) {
                targetType = Number(window.__wallTileTypes[0] || targetType);
            }
        }
        var idx = (typeof selectionIndex === "number" && isFinite(selectionIndex)) ? selectionIndex : null;
        var tileData = cloneObj(tile);
        tileData.tile_type = targetType;
        function parseSizeFromString(raw) {
            var m = String(raw || "").match(/(\d+)\s*[xX]\s*(\d+)/);
            if (!m) return null;
            return [Number(m[1]), Number(m[2])];
        }
        function resolveTileSize(obj) {
            if (!obj) return null;
            if (obj.size && obj.size.length >= 2) return obj.size;
            if (obj.size_name) return parseSizeFromString(obj.size_name);
            if (obj.sizeName) return parseSizeFromString(obj.sizeName);
            if (obj.size_label) return parseSizeFromString(obj.size_label);
            if (obj.filters) {
                if (obj.filters["23"]) return parseSizeFromString(obj.filters["23"]);
                if (obj.filters["24"]) return parseSizeFromString(obj.filters["24"]);
            }
            return null;
        }

        var finish = function(data1) {
            data1.shape = cloneObj(shapePoints);
            data1.__highlight = true;
            data1.__highlightIndex = idx != null ? idx : (Date.now());
            if (!data1.size || !data1.size.length) {
                var sz = resolveTileSize(data1) || resolveTileSize(tileData) || resolveTileSize(tile) || [300, 300];
                data1.size = sz;
            }
            if (window.shapes && shapes.length) {
                shapes = shapes.filter(function(s) {
                    if (!s || !s.__highlight) return true;
                    if (idx == null) return false;
                    return s.__highlightIndex !== idx;
                });
            } else {
                shapes = shapes || [];
            }
            shapes.push(data1);
            if (typeof window.scheduleRender === "function") {
                scheduleRender();
            } else if (typeof render === "function" && window.vis_cvs) {
                render(vis_cvs);
            }
            if (typeof clearMask === "function") {
                clearMask();
            } else {
                activeShape = null;
            }
        };

        if (typeof setShape === "function") {
            setShape(targetType, tileData, function(data1) {
                data1.tile_type = targetType;
                finish(data1);
            });
        } else {
            finish(tileData);
        }
    }

    if (window && window.addEventListener) {
        window.addEventListener("resize", function() {
            if (!isRoom6Page()) return;
            updateHighlightBrushUI();
        });
    }

    // Ensure shape-based selections are actually rendered.
    (function wrapRenderForShapes() {
        if (!isRoom6Page()) return;
        if (window.__renderShapesWrapped) return;
        if (typeof render !== "function") return;
        var originalRender = render;
        window.render = function(cvs) {
            originalRender(cvs);
            try {
                if (typeof renderShapes === "function" && window.shapes && shapes.length) {
                    renderShapes(cvs);
                }
            } catch (e) {}
        };
        window.__renderShapesWrapped = true;
    })();

    window.startHighlightArea = function() {
        if (!isRoom6Page()) return;
        if (!isHighlightWallTarget()) return;
        if (!window.vis_cvs) {
            return;
        }
        window.__highlightModeActive = true;
        window.__highlightAllowRetile = true;

        var $overlay = $("#highlight-overlay");
        if (!$overlay.length) {
            $overlay = $("<div id=\"highlight-overlay\"></div>").appendTo(document.body);
            $overlay.css({
                position: "fixed",
                inset: 0,
                zIndex: 500000,
                cursor: "crosshair",
                background: "transparent"
            });
            $overlay.append("<canvas id=\"highlight-cvs\"></canvas>");
        }

        var $canvas = $("#highlight-cvs");
        var canvas = $canvas[0];
        var ctx = canvas.getContext("2d");
        var visRect = vis_cvs.getBoundingClientRect();
        var targetType = Number(window.__targetTileType || window.__wallTargetTileType || 1);
        var targetScene = null;
        if (window.scene_data && scene_data.length) {
            for (var si = 0; si < scene_data.length; si++) {
                if (scene_data[si][0] == targetType) {
                    targetScene = scene_data[si];
                    break;
                }
            }
        }
        var targetName = targetScene && targetScene[176] ? String(targetScene[176]).toLowerCase() : "";
        var isFloorTarget = targetType === 2 || targetName.indexOf("floor") !== -1;
        var maskEl = document.getElementById("mask");
        var maskRect = null;
        if (maskEl && typeof maskEl.getBoundingClientRect === "function") {
            maskRect = maskEl.getBoundingClientRect();
            if (!maskRect || (!maskRect.width && !maskRect.height)) {
                maskRect = null;
            }
        }
        if (!isFloorTarget) {
            maskRect = null;
        }
        var baseRect = maskRect || visRect;
        var targetW = (window.line_cvs && line_cvs.width) ? line_cvs.width : vis_cvs.width;
        var targetH = (window.line_cvs && line_cvs.height) ? line_cvs.height : vis_cvs.height;

        function getSceneMaskPoints() {
            if (!targetScene || !targetScene[11] || !targetScene[11].length) return null;
            return targetScene[11];
        }
        function pointInPolygon(point, vs) {
            if (!vs || vs.length < 3) return false;
            var x = point[0], y = point[1];
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0], yi = vs[i][1];
                var xj = vs[j][0], yj = vs[j][1];
                var intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }

        function isAxisAlignedRect(points) {
            if (!points || points.length < 4) return true;
            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            points.forEach(function(p) {
                minX = Math.min(minX, p[0]);
                maxX = Math.max(maxX, p[0]);
                minY = Math.min(minY, p[1]);
                maxY = Math.max(maxY, p[1]);
            });
            for (var i = 0; i < points.length; i++) {
                var x = points[i][0], y = points[i][1];
                var onX = (Math.abs(x - minX) < 0.001) || (Math.abs(x - maxX) < 0.001);
                var onY = (Math.abs(y - minY) < 0.001) || (Math.abs(y - maxY) < 0.001);
                if (!(onX && onY)) return false;
            }
            return true;
        }

        function shouldSkewToMask() {
            return false;
        }

        function normalizeMaskPoints(points) {
            if (!points || points.length < 4) return null;
            var sorted = points.slice().sort(function(a, b) {
                if (a[1] === b[1]) return a[0] - b[0];
                return a[1] - b[1];
            });
            var top = sorted.slice(0, 2).sort(function(a, b) { return a[0] - b[0]; });
            var bottom = sorted.slice(sorted.length - 2).sort(function(a, b) { return a[0] - b[0]; });
            return [top[0], top[1], bottom[1], bottom[0]];
        }

        function mapRectToQuad(rectA, rectB, quad) {
            var minX = Math.min(rectA.x, rectB.x);
            var maxX = Math.max(rectA.x, rectB.x);
            var minY = Math.min(rectA.y, rectB.y);
            var maxY = Math.max(rectA.y, rectB.y);
            var rect = [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY }
            ];
            var q = normalizeMaskPoints(quad);
            if (!q) return rect;
            var bounds = q.reduce(function(acc, p) {
                acc.minX = Math.min(acc.minX, p[0]);
                acc.maxX = Math.max(acc.maxX, p[0]);
                acc.minY = Math.min(acc.minY, p[1]);
                acc.maxY = Math.max(acc.maxY, p[1]);
                return acc;
            }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
            var w = bounds.maxX - bounds.minX || 1;
            var h = bounds.maxY - bounds.minY || 1;
            function lerp(a, b, t) { return a + (b - a) * t; }
            function bilinear(u, v) {
                var topL = q[0], topR = q[1], botR = q[2], botL = q[3];
                var xTop = lerp(topL[0], topR[0], u);
                var yTop = lerp(topL[1], topR[1], u);
                var xBot = lerp(botL[0], botR[0], u);
                var yBot = lerp(botL[1], botR[1], u);
                return { x: lerp(xTop, xBot, v), y: lerp(yTop, yBot, v) };
            }
            return rect.map(function(p) {
                var u = Math.max(0, Math.min(1, (p.x - bounds.minX) / w));
                var v = Math.max(0, Math.min(1, (p.y - bounds.minY) / h));
                return bilinear(u, v);
            });
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        $overlay.show();
        window.__highlightActive = true;
        activeShape = null;

        var rectStart = null;
        var rectActive = false;

        function toVisCoords(x, y) {
            var vx = (x - baseRect.left) * (targetW / baseRect.width);
            var vy = (y - baseRect.top) * (targetH / baseRect.height);
            return {
                x: Math.max(0, Math.min(targetW, vx)),
                y: Math.max(0, Math.min(targetH, vy))
            };
        }

        function drawRect(a, b) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!a || !b) return;
            if (shouldSkewToMask()) {
                var mask = getSceneMaskPoints();
                if (mask && mask.length) {
                    var maskScreen = mask.map(function(p) {
                        return [
                            visRect.left + (p[0] / targetW) * visRect.width,
                            visRect.top + (p[1] / targetH) * visRect.height
                        ];
                    });
                    var quad = mapRectToQuad(a, b, maskScreen);
                    ctx.fillStyle = "rgba(255,255,255,0.35)";
                    ctx.strokeStyle = "#0e4645";
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();
                    quad.forEach(function(pt, idx) {
                        if (idx === 0) ctx.moveTo(pt.x, pt.y);
                        else ctx.lineTo(pt.x, pt.y);
                    });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = "#0e4645";
                    quad.forEach(function(pt) {
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    return;
                }
            }
            var x1 = Math.min(a.x, b.x);
            var y1 = Math.min(a.y, b.y);
            var x2 = Math.max(a.x, b.x);
            var y2 = Math.max(a.y, b.y);
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = "#0e4645";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "#0e4645";
            [ [x1,y1], [x2,y1], [x2,y2], [x1,y2] ].forEach(function(p) {
                ctx.beginPath();
                ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        $overlay.off(".highlightRect");
        $(window).off(".highlightRect");

        $overlay.on("mousedown.highlightRect", function(e) {
            if (!isHighlightWallTarget()) return;
            rectActive = true;
            rectStart = { x: e.clientX, y: e.clientY };
            try {
                var startVis = toVisCoords(rectStart.x, rectStart.y);
                var maskPts = getSceneMaskPoints();
                if (maskPts && maskPts.length && !pointInPolygon([startVis.x, startVis.y], maskPts)) {
                    rectActive = false;
                    return;
                }
            } catch (err) {}
            drawRect(rectStart, rectStart);
            e.preventDefault();
        });
        $overlay.on("mousemove.highlightRect", function(e) {
            if (!rectActive) return;
            drawRect(rectStart, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        var finishRect = function(e) {
            if (!rectActive) return;
            rectActive = false;
            var end = { x: e.clientX, y: e.clientY };
            drawRect(rectStart, end);

            var v1 = toVisCoords(Math.min(rectStart.x, end.x), Math.min(rectStart.y, end.y));
            var v2 = toVisCoords(Math.max(rectStart.x, end.x), Math.min(rectStart.y, end.y));
            var v3 = toVisCoords(Math.max(rectStart.x, end.x), Math.max(rectStart.y, end.y));
            var v4 = toVisCoords(Math.min(rectStart.x, end.x), Math.max(rectStart.y, end.y));

            if (shouldSkewToMask()) {
                var maskPts = getSceneMaskPoints();
                if (maskPts && maskPts.length) {
                    var quadPoints = mapRectToQuad(
                        { x: v1.x, y: v1.y },
                        { x: v3.x, y: v3.y },
                        maskPts
                    );
                    activeShape = quadPoints.map(function(p) { return [p.x, p.y]; });
                } else {
                    activeShape = [
                        [v1.x, v1.y],
                        [v2.x, v1.y],
                        [v3.x, v3.y],
                        [v4.x, v4.y]
                    ];
                }
            } else {
                activeShape = [
                    [v1.x, v1.y],
                    [v2.x, v1.y],
                    [v3.x, v3.y],
                    [v4.x, v4.y]
                ];
            }

            window.__highlightActive = false;
            window.__highlightPending = true;
            window.__highlightShape = cloneObj(activeShape);
            window.__highlightLastShape = cloneObj(activeShape);
            window.__highlightPendingIndex = (window.__highlightSelections ? window.__highlightSelections.length : 0);
            $overlay.off(".highlightRect");
            $(window).off(".highlightRect");
            // Keep the white box visible, but allow clicking the tile menu.
            drawRect(rectStart, end);
            $overlay.css({ pointerEvents: "none" });

            // Open the tile menu so user can pick a tile immediately.
            try {
                var panel = 1;
                var target = Number(window.__targetTileType || window.__wallTargetTileType || 1);
                if (target === 2) panel = 2;
                if (typeof showLeftMenu === "function") {
                    showLeftMenu(panel);
                }
                if (typeof classie !== "undefined") {
                    classie.add(menuLeft, "cbp-spmenu-open");
                }
            } catch (err) {}
            if (e && e.preventDefault) e.preventDefault();
        };
        $overlay.on("mouseup.highlightRect mouseleave.highlightRect", finishRect);
        $(window).on("mouseup.highlightRect", finishRect);
    };

    window.hideHighlightOverlay = function() {
        var $overlay = $("#highlight-overlay");
        if ($overlay.length) {
            $overlay.hide();
            $overlay.css({ pointerEvents: "auto" });
        }
        window.__highlightPending = false;
        window.__highlightActive = false;
        window.__highlightShape = null;
    };

    function resolveMailEndpoint() {
        if (typeof getSharedVisualizerMailEndpoint === "function") {
            var sharedEndpoint = getSharedVisualizerMailEndpoint(send_mail_addr);
            if (sharedEndpoint) return sharedEndpoint;
        }

        var endpoint = (typeof send_mail_addr === "string" && send_mail_addr) ? send_mail_addr : "";
        endpoint = endpoint.trim();

        if (!endpoint) {
            var apiBase = typeof readApiBase === "function" ? readApiBase() : "";
            return apiBase ? apiBase.replace(/\/+$/, "") + "/visualizermail" : "";
        }

        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }

        if (endpoint.indexOf("/api/visualizer/mail") !== -1) {
            var normalizedApiBase = typeof readApiBase === "function" ? readApiBase() : "";
            return normalizedApiBase
                ? normalizedApiBase.replace(/\/+$/, "") + "/visualizermail"
                : "";
        }
        return endpoint;
    }


    function fallbackToMailClient(fullname, to, subject, message, roomname, designUrl) {
        var recipient = (to || "").trim();
        if (!recipient) {
            alert("Please provide recipient email.");
            return;
        }
        var body = [
            "Name: " + (fullname || ""),
            "Room: " + (roomname || ""),
            "",
            message || "",
            "",
            "Design URL: " + (designUrl || window.location.href)
        ].join("\n");

        var mailtoHref = "mailto:" + encodeURIComponent(recipient) +
            "?subject=" + encodeURIComponent(subject || "Tile Visualizer Design") +
            "&body=" + encodeURIComponent(body);
        window.location.href = mailtoHref;
    }

    function dataUrlToBlob(dataUrl) {
        var value = String(dataUrl || "");
        var match = value.match(/^data:([^;]+);base64,(.*)$/);
        if (!match) return null;
        try {
            var mime = match[1] || "image/jpeg";
            var base64 = match[2] || "";
            var binary = atob(base64);
            var len = binary.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            return new Blob([bytes], { type: mime });
        } catch (e) {
            return null;
        }
    }

    function getSelectedGroutId(tileKey) {
        var selected = $('.grout-type-input[name="tile_grout_' + tileKey + '"]:checked');
        if (!selected.length) return 1;
        var rawId = String(selected.attr("id") || "");
        var match = rawId.match(/tile_grout_\d+_(-?\d+)$/);
        if (!match) return 1;
        var parsed = Number(match[1]);
        return isFinite(parsed) ? parsed : 1;
    }

    function buildDesignPayload() {
        var payload = { tiles: {}, indexeds: indexeds };
        for (var tk in tile_datas) {
            if (!isFinite(tk)) continue;

            var layout = $('.layout-type-input[data-tile-id=' + tk + ']:checked').val() || "grid";
            var groutId = getSelectedGroutId(tk);
            var clickedTiles = [];

            if (free_tiles[tk] && free_tiles[tk].length > 0) {
                for (var i = 0; i < free_tiles[tk].length; i++) {
                    clickedTiles.push(free_tiles[tk][i].id);
                }
            } else if (tile_datas[tk] && tile_datas[tk].length > 0) {
                for (var j = 0; j < tile_datas[tk].length; j++) {
                    clickedTiles.push(tile_datas[tk][j].id);
                }
            }

            payload.tiles[tk] = [groutId, layout, clickedTiles];
        }
        return payload;
    }

    function getDesignPayloadBundle() {
        var dataString = JSON.stringify(buildDesignPayload());
        var encoded = btoa(unescape(encodeURIComponent(dataString)));
        var designId = encoded.replace(/[^a-zA-Z0-9]/g, "").slice(0, 50);
        return { dataString: dataString, encoded: encoded, designId: designId };
    }

    function getCurrentRoomId() {
        var match = window.location.pathname.match(/\/(\d+)(?:\.html)?$/);
        return match ? match[1] : "";
    }

    function createDesignShareLink() {
        try {
            var bundle = getDesignPayloadBundle();
            var roomId = getCurrentRoomId();
            var origin = (window.parent && window.parent.location && window.parent.location.origin)
                ? window.parent.location.origin
                : window.location.origin;
            return origin + "/visualizer?d=" + bundle.designId + (roomId ? "&room=" + encodeURIComponent(roomId) : "");
        } catch (e) {
            return window.location.href.split("#")[0];
        }
    }

    function slugifyFilenamePart(value, fallback) {
        var text = String(value || fallback || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return text || String(fallback || "design");
    }

    function getCurrentRoomId() {
        var match = String(window.location.pathname || "").match(/\/(\d+)(?:\.html)?$/);
        return match ? match[1] : "";
    }

    function getCurrentRoomName() {
        var roomLabel = $.trim($(".rooms-tabs li.active a").text() || "");
        if (roomLabel) {
            return slugifyFilenamePart(roomLabel, "room");
        }

        return "room";
    }

    function getSaveDateStamp() {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, "0");
        var day = String(now.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    }

    function getPdfFilename() {
        return getCurrentRoomName() + "-" + getSaveDateStamp() + ".pdf";
    }

    function getSaveFilename(extension) {
        return getCurrentRoomName() + "-" + getSaveDateStamp() + "." + extension;
    }

    function setSaveOptionsOpen(isOpen) {
        var panel = document.getElementById("saveOptionsPanel");
        var toggle = document.querySelector(".save-options-toggle");
        if (!panel) return;

        panel.classList.toggle("active", !!isOpen);
        panel.setAttribute("aria-hidden", isOpen ? "false" : "true");

        if (toggle) {
            toggle.classList.toggle("is-active", !!isOpen);
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
    }

    function setShareOptionsOpen(isOpen) {
        var panel = document.getElementById("shareOptionsPanel");
        var toggle = document.querySelector(".share-options-toggle");
        if (!panel) return;

        panel.classList.toggle("active", !!isOpen);
        panel.setAttribute("aria-hidden", isOpen ? "false" : "true");

        if (toggle) {
            toggle.classList.toggle("is-active", !!isOpen);
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
    }

    function shareDesignImageInternal() {
        function buildWatermarkedShareFile(done) {
            var sourceDataUrl = vis_cvs.toDataURL_('image/png');
            var img = new Image();
            img.onload = function() {
                try {
                    var footerHeight = 54;
                    var exportCanvas = document.createElement("canvas");
                    exportCanvas.width = img.width;
                    exportCanvas.height = img.height + footerHeight;
                    var ctx = exportCanvas.getContext("2d");
                    if (!ctx) {
                        done(null);
                        return;
                    }
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, img.height, exportCanvas.width, footerHeight);
                    ctx.fillStyle = "#0f172a";
                    ctx.font = "700 " + Math.max(18, Math.round(exportCanvas.width * 0.028)) + "px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("SvikInfotech", exportCanvas.width / 2, img.height + footerHeight / 2);
                    exportCanvas.toBlob(function(blob) {
                        if (!blob) {
                            done(null);
                            return;
                        }
                        done(new File([blob], "svik-room-share.png", { type: "image/png" }));
                    }, "image/png");
                } catch (e) {
                    done(null);
                }
            };
            img.onerror = function() { done(null); };
            img.src = sourceDataUrl;
        }

        buildWatermarkedShareFile(function(file) {
            if (!file) {
                alert("Unable to prepare share image.");
                return;
            }

            function downloadFile(withMessage) {
                var fileUrl = URL.createObjectURL(file);
                var link = document.createElement("a");
                link.href = fileUrl;
                link.download = file.name;
                link.click();
                setTimeout(function() {
                    URL.revokeObjectURL(fileUrl);
                }, 1000);
                if (withMessage) alert(withMessage);
            }

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: "SvikInfotech Room Design",
                    text: "SvikInfotech room design"
                }).catch(function() {});
                return;
            }

            downloadFile("Direct image sharing is not supported in this browser, so the image was downloaded instead.");
        });
    }

    function saveDesignByType(as) {
        if (as == "link") {
            try {
                var bundle = getDesignPayloadBundle();
                var encoded = bundle.encoded;
                var designId = bundle.designId;
                var origin = (window.parent && window.parent.location && window.parent.location.origin)
                    ? window.parent.location.origin
                    : window.location.origin;
                var roomId = getCurrentRoomId();
                var link = origin + "/visualizer?d=" + designId;

                if (!link) {
                    throw new Error("Invalid design link generated");
                }

                var image = "";
                try {
                    image = vis_cvs.toDataURL_("image/jpeg", 0.7);
                } catch (imgErr) {
                    console.warn("Image capture failed", imgErr);
                }

                var payload = {
                    type: "SAVE_DESIGN",
                    payload: {
                        link: link,
                        designId: designId,
                        roomId: roomId || null,
                        designData: encoded,
                        image: image || null,
                        timestamp: Date.now()
                    }
                };

                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(payload, "*");
                } else {
                    navigator.clipboard.writeText(link);
                    alert("Design link copied!");
                }

                if (typeof setSaveOptionsOpen === "function") {
                    setSaveOptionsOpen(false);
                }
                return;
            } catch (err) {
                console.error(err);
                alert("Something went wrong while saving.");
                return;
            }
        }

        var infoHtml = '',
            dt = vis_cvs.toDataURL_('image/jpeg'),
            l = document.createElement("a");

        switch (as) {
        case "image":
            l.download = getSaveFilename("jpg");
            break;

        case "info-pdf":
            $('#preloader2').show();
            setSaveOptionsOpen(false);
            saveDesignInfoPdf(function() {
                $('#preloader2').hide();
            });
            return;

        case "info":
            $('#modal_info .tabs-content-wrapper').each(function(index, content) {
                var title = $('#modal_info [role=tab]').eq(index).text();
                content = $(content).clone();
                content.find('img').each(function() {
                    var cvs = document.createElement('canvas');
                    cvs.width = 100;
                    cvs.height = this.height / this.width * 100;
                    cvs.getContext('2d').drawImage(this, 0, 0, cvs.width, cvs.height);
                    this.src = cvs.toDataURL('image/png');
                });
                infoHtml += '<section><h2>' + title + '</h2><div class="info-content">' + content.html() + '</div></section>';
            });

            var htdata = ['<!DOCTYPE html><html><head><title>' + $.trim($(".resp-tab-active").text()) + ' Design</title></head>',
                '<style>' +
                '*,::after,::before{-moz-box-sizing:border-box;box-sizing:border-box}body{font-family:Helvetica neue,Helvetica,Arial,sans-serif}.room-image{border:4px solid #0f73ae}section{margin-top:2em}h2{background-color:#0f73ae;color:#fff;padding:15px;margin:0;border-top-left-radius:15px;border-top-right-radius:15px}.info-content{padding:1em;border-bottom-left-radius:15px;border-bottom-right-radius:15px;border:2px solid #0f73ae}.row::after,.row::before{display:table;content:" "}.row::after{clear:both}.product_wrapper{margin:15px 15px 0}.col-xs-3{float:left;width:25%;padding-right:15px;padding-left:15px}.img-responsive{display:block;max-width:100%;height:auto;vertical-align:middle}.col-xs-9{float:left;width:75%;padding-right:15px;padding-left:15px}.selected_product_name{color:#bc211e;font-weight:700;padding-bottom:5px;text-transform:uppercase}p{margin:0}label{display:inline-block;max-width:100%;margin-bottom:5px;font-weight:700}' +
                '</style>',
                '<body style="background-color:white;"><img class="room-image" src="' + dt + '" style="max-width: 100%;"><div id="infoTab">' + infoHtml + '</div><span style="display:none;">%addonjs%</span></body></html>'
            ].join("");

            dt = new Blob([htdata], {type: 'text/html'});
            dt = URL.createObjectURL(dt);
            l.download = getSaveFilename("html");
            break;
        }

        l.href = dt;
        l.style.display = 'none';
        document.body.appendChild(l);
        l.click();
        document.body.removeChild(l);
        setSaveOptionsOpen(false);
    }

    window.toggleSaveOptions = function(evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        var panel = document.getElementById("saveOptionsPanel");
        if (!panel) return false;

        setSaveOptionsOpen(!panel.classList.contains("active"));
        return false;
    };

    window.closeSaveOptions = function() {
        setSaveOptionsOpen(false);
    };

    window.toggleShareOptions = function(evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        shareDesignImageInternal();
        return false;
    };

    window.closeShareOptions = function() {
        setShareOptionsOpen(false);
    };

    window.saveDesignAsImage = function() {
        saveDesignByType("image");
    };

    window.saveWithInfoPDF = function() {
        saveDesignByType("info-pdf");
    };

    window.saveDesignForLater = function() {
        saveDesignByType("link");
    };

    window.shareDesignImage = function(evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        shareDesignImageInternal();
        return false;
    };

    window.shareDesignOnFacebook = function() {
        shareDesignImageInternal();
    };

    window.shareDesignOnTwitter = function() {
        shareDesignImageInternal();
    };

    window.shareDesignOnGoogle = function() {
        shareDesignImageInternal();
    };

    $(document).on("click", function(e) {
        var $target = $(e.target);
        if (!$target.closest("#saveOptionsPanel, .save-options-toggle").length) {
            setSaveOptionsOpen(false);
        }
        if (!$target.closest(".share-options-toggle").length) {
            setShareOptionsOpen(false);
        }
    });

    $("#modal_mail").on("show.bs.modal", function() {
        $(this).find(".mail-success-message").hide();
        $(this).find(".mail-form-fields").show();
        $("#sendMail").show().removeAttr("disabled").text("Send");
    });


    $("#mailform").validate({
        rules: {
            full_name: {
                required:true
            },
            to : {
                required:true,
                email : true
            },
            subject: {
                required:true
            },
            message: {
                required:true
            }
        },
        messages:{
            full_name:{
                required:"Please Enter your Full Name"
            },
            to:{
                required:"Please Fill to field"
            },
            subject:{
                required:"Please Fill the subject"
            },
            message:{
                required:"Please  Fill the message"
            }
        },
        submitHandler : function() {
            var endpoint = resolveMailEndpoint();
            var fullname    = $(".full_name").val();
            var to      = $(".to").val();
            var subject = $(".subject").val();
            var message = $(".message").val();
            var imgUrl  = vis_cvs.toDataURL_('image/jpeg');
            var roomname = $.trim($(".rooms-tabs li.active a").text());
            var designLink = createDesignShareLink();
            var imageBlob = dataUrlToBlob(imgUrl);
            if (!imageBlob) {
                alert("Unable to prepare preview image.");
                return;
            }

            var formData = new FormData();
            formData.append("FullName", fullname || "");
            formData.append("To", to || "");
            formData.append("Subject", subject || "");
            formData.append("Message", message || "");
            formData.append("RoomName", roomname || "");
            formData.append("DesignLink", designLink || "");
            formData.append("Image", imageBlob, "visualizer-2d.jpg");

            $("#sendMail").attr("disabled","disabled").text("SENDING...");
            $.ajax({
                url: endpoint,
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                timeout: 30000,
                success : function(data){
                    console.log("Email is sent");
                    $("#mailform")[0].reset();
                    $("#modal_mail").find(".mail-form-fields").hide();
                    $("#modal_mail").find(".mail-success-message").show();
                    $("#sendMail").hide();
                    setTimeout(function() {
                        $("#modal_mail").modal('hide');
                    }, 2000);
                },
                error: function(xhr) {
                    var serverError = "";
                    try {
                        var payload = xhr && xhr.responseJSON ? xhr.responseJSON : null;
                        if (payload && payload.error) {
                            serverError = payload.error;
                            if (payload.details) {
                                serverError += " (" + payload.details + ")";
                            }
                        } else if (xhr && xhr.responseText) {
                            serverError = String(xhr.responseText);
                        }
                    } catch (e) {}
                    if (serverError) {
                        alert("Email send failed: " + serverError);
                    }
                    $("#modal_mail").modal('hide');
                    fallbackToMailClient(fullname, to, subject, message, roomname, designLink);
                },
                complete: function() {
                    $("#sendMail").removeAttr("disabled").text("Send");
                }
            });
        }
    });

    $(".ic-download").click(function(e){
        e.preventDefault();
        $(this).prev(".download_opt").slideToggle();
    });

    (function() {
        $(".share-link").click(function(e) {
            e.preventDefault();
            shareDesignImageInternal();
        });

        $(".share-toggle").click(function(e) {
            e.preventDefault();
            shareDesignImageInternal();
        });
    }());

    // Refresh Product Info every time modal opens so multi-wall selections are reflected.
    $(document).on("show.bs.modal", "#modal_info", function() {
        if (typeof updateInfo === "function") {
            updateInfo([], false);
        }
    });

    // Fallback only for legacy `.modal_info` triggers to avoid double-toggle on `#modal_info`.
    $(document).on("click", "a.pre_btn[data-target='.modal_info']", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $("#modal_info").modal("show");
    });

    $(".download_opt li").click(function(e){
        e.preventDefault();

        /*if(roomthumb === ''){
            alert("Please select Room First");
            return false;
        }*/

        if($(this).hasClass("without")){
            if($(".view").attr("src").indexOf(hostname) != -1)
            {
                var imgSrc = $(".view").attr("src").split(hostname)[1];
            }
            else{
                var imgSrc = $(".view").attr("src");
            }

            $(".download").attr("href",imgSrc);
            $(".download img").trigger("click");
        }

        /*if($(this).hasClass("with")){
            patternwithInfo("withproduct");
        }*/
        $(".download_opt").slideUp();
    });

    setImageContainer();

    /* Up & Down Setting Panel */
    $(".downarrow").click(function(){

        $(this).hide();
        $(".popup").hide();

        $(".wrapper").slideDown("slow",function(){
            $(".uparrow").slideDown();
        });

    });

    $(".uparrow").click(function(){
        $(".wrapper").slideUp("slow",function(){
            $(".downarrow").slideDown();
        });

    });


    $('.enter-full-screen').click(function(e) {
        e.preventDefault();

        var isFullscreen = document.fullscreenElement ||
            document.msFullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement;

        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            return;
        }

        var elem = document.body;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    });

    /* clear individual section filter */
    $(".discount-section a").click(function(e){
        e.preventDefault();
        $(this).closest(".discount-section").next(".discount-row").find("input[type='checkbox']").prop("checked",false);
    });

    $(".btn").click(function(){
        $(this).toggleClass("active");
    });


    $(document).on('click', '.colorblock', function (e) {
        $(this).toggleClass("active");
    });

    // | Print Functioanlity
    $('.print-btn').on('click', function (e) {
        e.preventDefault();
        var pwidth = vis_cvs.width;
        var pheight = vis_cvs.height;
        var content = '<body style="margin:0;"><img src="' + vis_cvs.toDataURL_() + '" style="position:absolute;left:0;top:0;"><img src="' + line_cvs.toDataURL() + '" style="position:absolute;left:0;top:0;"></body>';
        var WinPrint = window.open('', '', 'width='+pwidth+',height='+pheight+',toolbar=0,scrollbars=0,status=0');
        WinPrint.document.write(content);
        WinPrint.document.close();
        WinPrint.focus();
        setTimeout(function(){  WinPrint.print(); }, 1000);
        setTimeout(function(){  WinPrint.close(); }, 1000);

    });




    $(window).resize(function(){
        setImageContainer();
    });


    $(".fb").click(function(){
        var cvs=document.createElement("canvas");
        cvs.width=vis_cvs.width;
        cvs.height=vis_cvs.height;
        cvs.getContext("2d").drawImage(vis_cvs,0,0,cvs.width,cvs.height);

        var imageData=cvs.toDataURL('image/png');

        /*try {
            blob = dataURItoBlob(imageData);
        } catch (e) {
            console.log(e);
        }*/

        shareOnFB(imageData);
    });

    // Convert a data URI to blob
    function dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {
            type: 'image/png'
        });
    }

    $(".btnClose").click(function(){
        $(".mpopup").fadeOut();
        $(".user-action ul li").removeClass("active");
    });

    window.clearAllTiles = function() {
        if (window.tile_datas) {
            Object.keys(tile_datas).forEach(function(key) {
                delete tile_datas[key];
            });
        }
        if (window.free_tiles) {
            if (Array.isArray(free_tiles)) {
                free_tiles.length = 0;
            } else {
                free_tiles = [];
            }
        }
        if (window.free_tiles_cur) {
            if (Array.isArray(free_tiles_cur)) {
                free_tiles_cur.length = 0;
            } else {
                free_tiles_cur = [];
            }
        }
        if (window.indexeds) {
            if (Array.isArray(indexeds)) {
                indexeds.length = 0;
            } else {
                indexeds = [];
            }
        }
        if (typeof $ === "function") {
            $(".tile-type-input").prop("checked", false).closest(".tile-wrap").removeClass("no-match");
        }
        if (window.__highlightSelections) {
            window.__highlightSelections.length = 0;
        }
        if (window.__highlightSelectionVersion) {
            window.__highlightSelectionVersion.length = 0;
        }
        if (window.__highlightShapes) {
            window.__highlightShapes.length = 0;
        }
        window.__highlightLastShape = null;
        window.__highlightShape = null;
        window.__highlightPending = false;
        window.__highlightModeActive = false;
        window.__highlightAllowRetile = false;
        window.__highlightActiveSelectionIndex = null;
        window.__highlightUseShapes = false;
        if (window.shapes && shapes.length) {
            shapes = shapes.filter(function(s) { return !s || !s.__highlight; });
        }
        if (window.__highlightBrushEls && window.__highlightBrushEls.length) {
            window.__highlightBrushEls.forEach(function(el) {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
            window.__highlightBrushEls.length = 0;
        }
        var overlayCanvas = document.getElementById("highlight-tile-overlay");
        if (overlayCanvas) {
            var octx = overlayCanvas.getContext("2d");
            octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        if (typeof window.scheduleRender === "function") {
            scheduleRender();
        } else if (typeof render === "function" && window.vis_cvs) {
            render(vis_cvs);
        }
    };



    $(document).on("change", ".layout-type-input", function(e) {
        var layout = this.value,
            checked = $('#menuPanel' + this.dataset.room).find(".tile-type-input").filter(":checked").first();

        var tile_id=Number(this.getAttribute("data-tile-id"));

        window.__layoutByTileType = window.__layoutByTileType || {};
        if (isFinite(tile_id)) {
            window.__layoutByTileType[tile_id] = layout;
        }

        if (layout === "dragdrop") {
            if (!free_tiles[tile_id] || !free_tiles[tile_id].length) {
                if (tile_datas && tile_datas[tile_id] && tile_datas[tile_id].length) {
                    free_tiles[tile_id] = tile_datas[tile_id].slice();
                } else {
                    free_tiles[tile_id] = [];
                }
            }
            if (free_tiles[tile_id] && free_tiles[tile_id].length && free_tiles_cur) {
                free_tiles_cur[tile_id] = free_tiles[tile_id][free_tiles[tile_id].length - 1];
            }
        }
        if (typeof dont_click !== "undefined") {
            // Enable canvas clicks only for free layout so users can place tiles manually.
            dont_click = layout !== "dragdrop";
        }
        window.__freeLayoutActive = layout === "dragdrop";

        $('#menuPanel' + this.dataset.room)
            .find(".tile-type-input").each(function() {
                this.type = layout === "checkered" ? "checkbox" : "radio";
                // var thisCheckbox = this;

                // if(layout === "checkered") {
                //     this.type = "checkbox";
                //     if(this.checked) {
                //         $(this).closest(".tiles-list").find(".tile-type-input").not(this).each(function() {
                //             $(this).closest('.tile-wrap').toggleClass('no-match', this.dataset.tileWidth !== thisCheckbox.dataset.tileWidth || this.dataset.tileHeight !== thisCheckbox.dataset.tileHeight);
                //         });
                //     }
                // } else {
                //     this.type = "radio";
                //     $(this).closest(".tiles-list").find(".tile-type-input").not(this).prop("checked", false);
                // }
            });
        if (layout !== "checkered") {
            var $checked = $('#menuPanel' + this.dataset.room).find(".tile-type-input").filter(":checked");
            if ($checked.length > 1) {
                $checked.not($checked.first()).prop("checked", false);
            }
        }
        if (typeof window.scheduleRender === "function") {
            scheduleRender();
        } else if (typeof render === "function" && window.vis_cvs) {
            render(vis_cvs);
        }
    });

    function resolveSceneTargetByPanel(panelId) {
        var target = null;
        if (panelId === "menuPanel2") {
            if (window.scene_data && scene_data.length) {
                for (var i = 0; i < scene_data.length; i++) {
                    var scene = scene_data[i];
                    if (!scene) continue;
                    var sceneType = Number(scene[0]);
                    var sceneName = String(scene[176] || "").toLowerCase();
                    if (Number(scene[177]) === 1 || sceneName.indexOf("floor") !== -1) {
                        target = sceneType;
                        break;
                    }
                }
            }
        } else if (panelId === "menuPanel1") {
            if (window.__wallTileTypes && window.__wallTileTypes.length) {
                target = Number(window.__wallTargetTileType || window.__wallTileTypes[0] || 1);
            } else if (window.scene_data && scene_data.length) {
                for (var j = 0; j < scene_data.length; j++) {
                    var wallScene = scene_data[j];
                    if (!wallScene) continue;
                    var wallType = Number(wallScene[0]);
                    var wallName = String(wallScene[176] || "").toLowerCase();
                    if (Number(wallScene[177]) !== 1 && wallName.indexOf("floor") === -1) {
                        target = wallType;
                        break;
                    }
                }
            }
        }
        return isFinite(target) && target > 0 ? target : null;
    }

    $(document).on("change", ".tile-type-input", function(e) {
        if(!dont_hide_leftmenu_on_tile_click_for_one_time)
            classie.remove(menuLeft, 'cbp-spmenu-open');
        else
            console.log_("asd");
        dont_hide_leftmenu_on_tile_click_for_one_time=false;

        try {
            var panelId = $(this).closest(".tab-pane").attr("id");
            var resolvedTarget = resolveSceneTargetByPanel(panelId);
            if (resolvedTarget !== null) {
                window.__targetTileType = resolvedTarget;
                if (window.__wallTileTypes && window.__wallTileTypes.indexOf(resolvedTarget) !== -1) {
                    window.__wallTargetTileType = resolvedTarget;
                }
            }
        } catch (err) {}

        var $allCheckboxes = $(this).closest(".tiles-list").find(".tile-type-input"),
            $checkedCheckboxes = $allCheckboxes.filter(":checked"),
            thisCheckbox = this,
            tiles = [this.value];
        var layoutMode = "grid";
        try {
            var tileMeta = (window.avail_tiles && avail_tiles[Number(this.value)]) ? avail_tiles[Number(this.value)] : null;
            var tid = tileMeta && isFinite(tileMeta.tile_type) ? Number(tileMeta.tile_type) : null;
            if (tid === null) {
                var fallbackTid = Number(window.__targetTileType || window.__wallTargetTileType || 0);
                if (isFinite(fallbackTid) && fallbackTid > 0) {
                    tid = fallbackTid;
                }
            }
            if (tid !== null && typeof $ === "function") {
                layoutMode = $('.layout-type-input[data-tile-id=' + tid + ']:checked').val()
                    || (window.__layoutByTileType && window.__layoutByTileType[tid])
                    || "grid";
            } else if (window.__layoutByTileType) {
                var fb = Number(window.__targetTileType || window.__wallTargetTileType || 0);
                if (isFinite(fb) && window.__layoutByTileType[fb]) {
                    layoutMode = window.__layoutByTileType[fb];
                }
            }
        } catch (e) {}

        if(!this.checked) {
            this.checked = true;
            return false;
        }

        if(layoutMode !== "checkered") {
            $allCheckboxes.closest('.tile-wrap').removeClass('no-match');
        } else {
            if($(this).closest('.tile-wrap').hasClass('no-match')) {
                $checkedCheckboxes.not(this).prop('checked', false);
            }
            if($checkedCheckboxes.length === 2 && !$(this).closest('.tile-wrap').hasClass('no-match')) {
                tiles.push($checkedCheckboxes.not(this).val());
            } else {
                if($checkedCheckboxes.length > 2) $checkedCheckboxes.not(this).attr("checked", false);
                $allCheckboxes.each(function() {
                    $(this).closest('.tile-wrap').toggleClass('no-match', this.dataset.tileWidth !== thisCheckbox.dataset.tileWidth || this.dataset.tileHeight !== thisCheckbox.dataset.tileHeight);
                });
            }
        }
        console.log_(tiles);
        tiles = tiles.map(function(id) {
            id=Number(id);
            console.log_("#"+id);
            return avail_tiles[id];
        });
        console.log_(tiles);

        if (tiles && tiles.length) {
            window.__lastSelectedTile = tiles[0];
        }

        selectTile(tiles);
    });

    $(document).on("change", ".rotate-degree", function() {
        if (typeof window.scheduleRender === "function") {
            scheduleRender();
        } else if (typeof render === "function" && window.vis_cvs) {
            render(vis_cvs);
        }
    });

    $('.close-popup-btn').click(function() {
        $(this).closest('.popup').fadeOut();
    });

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    $(".save-design").click(function() {
        saveDesignByType(this.dataset.as);
    });

    setClickTimeout=function(es,to)
    {
        setTimeout(function(){$(es).click()},to);
    }

    loadDesign=function(dd)
    {
        var old_blend_mode=blend_mode;
        blend_mode=-1;

        var to=100;
        var tos=100;

        var tiles=dd.tiles;

        for(var tk in tiles)
        {
            var t=tiles[tk];
            setClickTimeout("#tile_grout_"+tk+"_"+t[0], to+=tos);
            setClickTimeout("#layout-"+t[1]+"-"+tk, to+=tos);

            var ts=t[2];
            for(var i=0;i<ts.length;i++)
            {
                setClickTimeout("#tile_radio_"+ts[i], to+=tos);
            }
        }

        indexeds=dd.indexeds;


      setTimeout(function()
      {
          blend_mode=old_blend_mode;

          if (typeof window.scheduleRender === "function") {
              scheduleRender();
          } else if (typeof render === "function" && window.vis_cvs) {
              render(vis_cvs);
          }
      }, to+=tos);
  }

  function normalizeProductLink(url) {
        var raw = (url || "").toString().trim();
        if (!raw || raw === "-" || raw === "null" || raw === "undefined") return "";
        if (/^https?:\/\//i.test(raw)) return raw;
        if (/^www\./i.test(raw)) return "https://" + raw;
        if (raw.charAt(0) === "/") return window.location.origin + raw;
        return raw;
    }

    function getVisualizerAssetBase() {
        var base = "";
        var remoteBase = "";
        var isLocalDevHost = false;
        try {
            var host = (window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
            isLocalDevHost = host === "localhost" || host === "127.0.0.1";
        } catch (e) {}
        if (typeof window.VISUALIZER_ASSET_BASE === "string" && window.VISUALIZER_ASSET_BASE.trim()) {
            base = window.VISUALIZER_ASSET_BASE.trim();
        } else {
            try {
                var stored = localStorage.getItem("visualizer_asset_base");
                if (stored && stored.trim()) base = stored.trim();
            } catch (e) {}
        }
        if (!base && typeof window.NEXT_PUBLIC_ASSET_BASE === "string" && window.NEXT_PUBLIC_ASSET_BASE.trim()) {
            base = window.NEXT_PUBLIC_ASSET_BASE.trim();
        }
        if (typeof window.NEXT_PUBLIC_REMOTE_ASSET_BASE === "string" && window.NEXT_PUBLIC_REMOTE_ASSET_BASE.trim()) {
            remoteBase = window.NEXT_PUBLIC_REMOTE_ASSET_BASE.trim();
        }
        if (!isLocalDevHost && base.indexOf("/__asset_proxy__/") === 0 && remoteBase) {
            base = remoteBase;
        }
        if (!base) base = (window.location.origin || "") + "/assets/";
        return base.replace(/\/+$/, "") + "/";
    }

    function getTileImageSrc(tile) {
        function readSku(obj) {
            if (!obj) return "";
            var candidates = [obj.sku_code, obj.skuCode, obj.sku, obj.code, obj.product_sku];
            for (var i = 0; i < candidates.length; i++) {
                var v = String(candidates[i] || "").trim();
                if (v) return v;
            }
            return "";
        }
        function resolveTileSource(obj) {
            if (!obj) return null;
            if (readSku(obj)) return obj;
            var refId = obj.source_tile_id || obj.id;
            if (typeof avail_tiles !== "undefined" && avail_tiles) {
                if (refId && avail_tiles[refId]) return avail_tiles[refId];
                if (Array.isArray(avail_tiles) && refId) {
                    for (var i = 0; i < avail_tiles.length; i++) {
                        if (avail_tiles[i] && String(avail_tiles[i].id) === String(refId)) return avail_tiles[i];
                    }
                }
            }
            return obj;
        }
        function asProxyUrl(rawUrl) {
            var u = String(rawUrl || "").trim();
            if (!u) return "";
            if (u.indexOf("/__asset_proxy__/") === 0) {
                return getVisualizerAssetBase() + u.replace(/^\/__asset_proxy__\//, "");
            }
            return u;
        }

        if (!tile) return "";
        var src = resolveTileSource(tile);
        var skuCode = readSku(src);
        if (skuCode) {
            var assetBase = getVisualizerAssetBase();
            var preferredThumb = assetBase + "media/thumb/" + encodeURIComponent(skuCode) + ".jpg";
            return asProxyUrl(preferredThumb);
        }
        var img = "";
        if (tile.thumb_image) {
            img = String(tile.thumb_image);
        } else {
            img = typeof tile.image === "string" ? tile.image : (tile.image && tile.image.src ? tile.image.src : "");
        }
        if (!img) return "";
        if (/^data:/i.test(img)) return img;
        if (/^https?:\/\//i.test(img) || img.charAt(0) === "/") return asProxyUrl(img);
        return "/" + img.replace(/^\.?\//, "");
    }

    function eachAvailTile(fn) {
        if (typeof avail_tiles === "undefined" || !avail_tiles) return;
        if (Array.isArray(avail_tiles)) {
            for (var i = 0; i < avail_tiles.length; i++) {
                if (avail_tiles[i]) fn(avail_tiles[i]);
            }
            return;
        }
        for (var k in avail_tiles) {
            if (!avail_tiles.hasOwnProperty(k) || !avail_tiles[k]) continue;
            fn(avail_tiles[k]);
        }
    }

    function slugifyName(raw) {
        return String(raw || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    function readTileName(tile) {
        if (!tile) return "";
        var n = String(tile.name || tile.sku_name || tile.title || "").trim();
        if (n) return n;
        var refId = tile.source_tile_id || tile.id;
        if (typeof avail_tiles !== "undefined" && avail_tiles && refId && avail_tiles[refId]) {
            return String(avail_tiles[refId].name || avail_tiles[refId].sku_name || "").trim();
        }
        return "";
    }

    function readTileSku(tile, depth) {
        if (!tile) return "";
        if ((depth || 0) > 2) return "";
        var candidates = [tile.sku_code, tile.skuCode, tile.sku, tile.code, tile.product_sku];
        for (var i = 0; i < candidates.length; i++) {
            var v = String(candidates[i] || "").trim();
            if (v) return v;
        }
        var refId = tile.source_tile_id || tile.id;
        if (typeof avail_tiles !== "undefined" && avail_tiles) {
            var src = avail_tiles[refId];
            if (src && src !== tile) return readTileSku(src, (depth || 0) + 1);
            if (Array.isArray(avail_tiles) && refId) {
                for (var j = 0; j < avail_tiles.length; j++) {
                    if (avail_tiles[j] && String(avail_tiles[j].id) === String(refId)) {
                        return readTileSku(avail_tiles[j], (depth || 0) + 1);
                    }
                }
            }
        }
        // Fallback: attempt name-based lookup in avail_tiles list.
        var tileNameSlug = slugifyName(readTileName(tile));
        if (tileNameSlug) {
            var matchedSku = "";
            eachAvailTile(function(at) {
                if (matchedSku) return;
                var atNameSlug = slugifyName(at && (at.name || at.sku_name || at.title));
                if (atNameSlug !== tileNameSlug) return;
                var fromMatch = String((at && (at.sku_code || at.skuCode || at.sku || at.code || at.product_sku)) || "").trim();
                if (fromMatch) matchedSku = fromMatch;
            });
            if (matchedSku) return matchedSku;
        }
        return "";
    }

    function readTileLink(tile) {
        if (!tile) return "";
        var direct = normalizeProductLink(tile.link || tile.product_url || tile.productUrl || "");
        if (direct) return direct;
        var refId = tile.source_tile_id || tile.id;
        if (typeof avail_tiles !== "undefined" && avail_tiles && refId && avail_tiles[refId]) {
            return normalizeProductLink(avail_tiles[refId].link || avail_tiles[refId].product_url || avail_tiles[refId].productUrl || "");
        }
        return "";
    }

    function getTileProductLink(tile) {
        var skuCode = readTileSku(tile);
        if (skuCode) {
            return (window.location.origin || "") + "/product-details?sku=" + encodeURIComponent(skuCode);
        }
        return readTileLink(tile);
    }

    function getTileSizeText(tile) {
        if (!tile) return "-";
        if (typeof tile.size === "string" && tile.size.trim()) return tile.size.trim();
        if (tile.size && tile.size.length >= 2) {
            return String(tile.size[0] || "-") + "x" + String(tile.size[1] || "-") + " mm";
        }
        var width = tile.width || tile.tile_width || tile.w;
        var height = tile.height || tile.tile_height || tile.h;
        if (width || height) {
            return String(width || "-") + "x" + String(height || "-") + " mm";
        }
        return "-";
    }

    function readApiBase() {
        var base = "";
        if (typeof window.NEXT_PUBLIC_API_BASE === "string" && window.NEXT_PUBLIC_API_BASE.trim()) {
            base = window.NEXT_PUBLIC_API_BASE.trim();
        }
        if (!base) {
            try {
                if (window.parent && window.parent !== window) {
                    var parentBase = window.parent.NEXT_PUBLIC_API_BASE || window.parent.VISUALIZER_API_BASE || "";
                    if (typeof parentBase === "string" && parentBase.trim()) base = parentBase.trim();
                }
            } catch (e) {}
        }
        if (!base && typeof window.VISUALIZER_API_BASE === "string" && window.VISUALIZER_API_BASE.trim()) {
            base = window.VISUALIZER_API_BASE.trim();
        }
        if (!base && typeof window.API_BASE === "string" && window.API_BASE.trim()) {
            base = window.API_BASE.trim();
        }
        if (!base) {
            try {
                var stored = localStorage.getItem("visualizer_api_base");
                if (stored && stored.trim()) base = stored.trim();
            } catch (e) {}
        }
        if (!base) {
            var metaBase = $('meta[name="api-base"]').attr("content");
            if (metaBase && String(metaBase).trim()) base = String(metaBase).trim();
        }
        return base ? base.replace(/\/+$/, "") : "";
    }

    function getQrGenerateBase() {
        return readApiBase();
    }

    function fetchGeneratedProductUrl(tile, done) {
        var skuCode = readTileSku(tile);
        if (!skuCode) {
            done("");
            return;
        }

        var query = "skuCode=" + encodeURIComponent(skuCode);
        var base = getQrGenerateBase();
        if (!base) {
            done("");
            return;
        }
        var candidates = [
            base + "/Generate?" + query,
            base + "/api/ProductQr/Generate?" + query
        ];

        function tryFetch(index) {
            if (index >= candidates.length) {
                done("");
                return;
            }
            fetch(candidates[index], { method: "GET", credentials: "include" })
                .then(function(res) {
                    if (!res.ok) throw new Error("generate failed");
                    return res.json();
                })
                .then(function(payload) {
                    var productUrl = payload && payload.productUrl ? String(payload.productUrl).trim() : "";
                    if (productUrl) {
                        done(productUrl);
                    } else {
                        tryFetch(index + 1);
                    }
                })
                .catch(function() {
                    tryFetch(index + 1);
                });
        }

        tryFetch(0);
    }

    function uniqTiles(list) {
        var out = [];
        var seen = {};
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (!t) continue;
            var key = String(t.id || t.source_tile_id || t.name || i);
            if (seen[key]) continue;
            seen[key] = true;
            out.push(t);
        }
        return out;
    }

    function isFloorTileType(tileType) {
        var targetType = Number(tileType);
        if (!isFinite(targetType)) return false;

        if (typeof scene_data !== "undefined" && scene_data && scene_data.length) {
            for (var i = 0; i < scene_data.length; i++) {
                var s = scene_data[i];
                if (!s) continue;

                var sType = Number(s.tile_type);
                if (!isFinite(sType) && typeof s[0] !== "undefined") {
                    sType = Number(s[0]);
                }
                if (!isFinite(sType) || sType !== targetType) continue;

                var marker = s.is_floor;
                if (typeof marker === "undefined") marker = s["is_floor"];
                if (typeof marker === "undefined") marker = s[177];
                if (typeof marker === "undefined") marker = s["177"];

                return Number(marker) === 1 || marker === true;
            }
        }

        // Legacy fallback for old 2-surface rooms when scene metadata is missing.
        return targetType === 2;
    }

    function getAppliedTilesForType(id) {
        var current = [];
        if (free_tiles[id] && free_tiles[id].length) {
            for (var i = 0; i < free_tiles[id].length; i++) {
                if (free_tiles[id][i]) current.push(free_tiles[id][i]);
            }
        } else if (tile_datas[id] && tile_datas[id].length) {
            for (var j = 0; j < tile_datas[id].length; j++) {
                if (tile_datas[id][j]) current.push(tile_datas[id][j]);
            }
        }
        return uniqTiles(current);
    }

    function getAppliedTilesByPanel() {
        var wallTiles = [];
        var floorTiles = [];

        for (var k in tile_datas) {
            if (!tile_datas.hasOwnProperty(k) || !isFinite(k)) continue;
            var id = Number(k);
            if (id <= 0) continue;
            var current = getAppliedTilesForType(id);
            if (!current.length) continue;

            if (isFloorTileType(id)) {
                floorTiles = floorTiles.concat(current);
            } else {
                wallTiles = wallTiles.concat(current);
            }
        }

        wallTiles = uniqTiles(wallTiles);
        floorTiles = uniqTiles(floorTiles);

        var sections = [];
        if (wallTiles.length) {
            sections.push({ id: 1, title: "Wall Tile", tiles: wallTiles });
        }
        if (floorTiles.length) {
            sections.push({ id: 2, title: "Floor Tile", tiles: floorTiles });
        }
        return sections;
    }

    function loadImageForPdf(url, done) {
        if (!url) {
            done(null);
            return;
        }

        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            try {
                var c = document.createElement("canvas");
                c.width = img.naturalWidth || img.width;
                c.height = img.naturalHeight || img.height;
                var ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0, c.width, c.height);
                done({
                    dataUrl: c.toDataURL("image/jpeg", 0.95),
                    width: c.width,
                    height: c.height
                });
            } catch (e) {
                done(null);
            }
        };
        img.onerror = function() { done(null); };
        img.src = url;
    }

    function fetchQrDataUrl(link, done) {
        if (!link) {
            done(null);
            return;
        }

        var providers = [
            "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=" + encodeURIComponent(link),
            "https://quickchart.io/qr?size=220&margin=0&text=" + encodeURIComponent(link),
            "https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=" + encodeURIComponent(link)
        ];

        function tryProvider(index) {
            if (index >= providers.length) {
                done(null);
                return;
            }
            loadImageForPdf(providers[index], function(qrImgData) {
                if (qrImgData && qrImgData.dataUrl) {
                    done(qrImgData.dataUrl);
                } else {
                    tryProvider(index + 1);
                }
            });
        }

        tryProvider(0);
    }

    function fitRect(srcW, srcH, boxW, boxH) {
        if (!srcW || !srcH) return { w: boxW, h: boxH, x: 0, y: 0 };
        var r = Math.min(boxW / srcW, boxH / srcH);
        var w = srcW * r;
        var h = srcH * r;
        return {
            w: w,
            h: h,
            x: (boxW - w) / 2,
            y: (boxH - h) / 2
        };
    }

    function buildPdfCardsFromSections(sections) {
        var cards = [];
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            if (!section || !section.tiles || !section.tiles.length) continue;
            var tiles = uniqTiles(section.tiles);
            for (var j = 0; j < tiles.length; j++) {
                cards.push({
                    title: section.title,
                    tile: tiles[j],
                    sectionTileCount: section.tiles.length
                });
            }
        }
        return cards;
    }

    function drawProductCard(pdf, card, y, done) {
        var tile = card && card.tile ? card.tile : null;
        if (!tile) {
            done(y + 62);
            return;
        }
        var tileImage = getTileImageSrc(tile);
        var tileSku = readTileSku(tile);
        var productLink = normalizeProductLink(getTileProductLink(tile));
        var pageW = 210;
        var margin = 12;
        var cardW = pageW - margin * 2;
        var cardH = 56;
        var leftX = margin + 6;
        var qrBox = { x: margin + cardW - 44, y: y + 10, w: 36, h: 36 };
        var imgBox = { x: qrBox.x - 48, y: y + 10, w: 40, h: 36 };
        var imgPadding = 2;

        pdf.setFillColor(248, 251, 252);
        pdf.roundedRect(margin, y, cardW, cardH, 3, 3, "F");
        pdf.setDrawColor(218, 228, 231);
        pdf.roundedRect(margin, y, cardW, cardH, 3, 3, "S");

        pdf.setTextColor(18, 48, 47);
        pdf.setFontSize(13);
        pdf.setFontStyle("bold");
        pdf.text((card && card.title) || "Tile", leftX, y + 10);

        pdf.setTextColor(34, 51, 59);
        pdf.setFontStyle("normal");
        pdf.setFontSize(10);
        pdf.text("Name: " + (tile.name || "Tile"), leftX, y + 20);
        pdf.text("Size: " + getTileSizeText(tile), leftX, y + 26);
        if (tileSku) pdf.text("SKU: " + tileSku, leftX, y + 32);
        pdf.setDrawColor(214, 223, 228);
        pdf.rect(imgBox.x, imgBox.y, imgBox.w, imgBox.h);
        pdf.rect(qrBox.x, qrBox.y, qrBox.w, qrBox.h);

        loadImageForPdf(tileImage, function(tileImgData) {
            if (tileImgData && tileImgData.dataUrl) {
                var fit = fitRect(tileImgData.width, tileImgData.height, imgBox.w - imgPadding * 2, imgBox.h - imgPadding * 2);
                pdf.addImage(tileImgData.dataUrl, "JPEG", imgBox.x + imgPadding + fit.x, imgBox.y + imgPadding + fit.y, fit.w, fit.h);
            } else {
                pdf.setFontSize(8);
                pdf.text("Image unavailable", imgBox.x + 3, imgBox.y + 18);
            }

            fetchGeneratedProductUrl(tile, function(generatedLink) {
                var qrLink = productLink || normalizeProductLink(generatedLink);
                var linkText = "Open product page";
                if (qrLink) {
                    try {
                        pdf.setTextColor(14, 88, 86);
                        pdf.setFontSize(10);
                        pdf.textWithLink(linkText, leftX, y + 44, { url: qrLink });
                    } catch (e) {
                        pdf.text(linkText + ": " + qrLink, leftX, y + 44);
                    }
                } else {
                    pdf.setTextColor(120, 120, 120);
                    pdf.setFontSize(9);
                    pdf.text("Product URL unavailable", leftX, y + 44);
                }

                fetchQrDataUrl(qrLink, function(qrDataUrl) {
                if (qrDataUrl) {
                    var qrFmt = /^data:image\/png/i.test(qrDataUrl) ? "PNG" : "JPEG";
                    pdf.addImage(qrDataUrl, qrFmt, qrBox.x + 1, qrBox.y + 1, qrBox.w - 2, qrBox.h - 2);
                } else {
                    pdf.setFontSize(8);
                    pdf.text("QR", qrBox.x + 14, qrBox.y + 20);
                }

                done(y + cardH + 6);
            });
            });
        });
    }

    saveDesignInfoPdf = function(onDone) {
        var pdf = new jsPDF("p", "mm", "a4");
        var pageW = 210;
        var margin = 12;

        pdf.setFillColor(14, 70, 69);
        pdf.rect(0, 0, pageW, 24, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(17);
        pdf.setFontStyle("bold");
        pdf.text("SVIK infotech", margin, 15);
        pdf.setFontSize(9);
        pdf.setFontStyle("normal");
        pdf.text("Generated on " + new Date().toLocaleString(), margin, 20);

        var roomDataUrl = vis_cvs.toDataURL_("image/jpeg");
        pdf.setFillColor(245, 248, 250);
        pdf.rect(margin, 28, pageW - margin * 2, 92, "F");
        pdf.addImage(roomDataUrl, "JPEG", margin + 1.5, 29.5, pageW - margin * 2 - 3, 89);
        pdf.setDrawColor(214, 223, 228);
        pdf.rect(margin, 28, pageW - margin * 2, 92);

        pdf.setTextColor(32, 44, 49);
        pdf.setFontSize(12);
        pdf.setFontStyle("bold");
        pdf.text("Applied Product Details", margin, 128);

        var sections = getAppliedTilesByPanel();
        var cards = buildPdfCardsFromSections(sections);
        if (!cards.length) {
            pdf.setFontSize(10);
            pdf.setFontStyle("normal");
            pdf.text("No applied tiles found for wall/floor.", margin, 136);
            pdf.save(getPdfFilename());
            if (typeof onDone === "function") onDone();
            return;
        }

        var idx = 0;
        var y = 132;
        var pageH = 297;
        var bottomMargin = 12;
        // Keep in sync with drawProductCard() height + spacing.
        var cardTotalHeight = 64;

        function nextCard() {
            if (idx >= cards.length) {
                pdf.save(getPdfFilename());
                if (typeof onDone === "function") onDone();
                return;
            }

            // Start a new page when the full next card cannot fit.
            if (y + cardTotalHeight > pageH - bottomMargin) {
                pdf.addPage();
                y = 16;
            }

            drawProductCard(pdf, cards[idx], y, function(nextY) {
                y = nextY;
                idx += 1;
                nextCard();
            });
        }

        nextCard();
    };

    saveAsPdf=function(dom)
    {

        var printDoc = new jsPDF();


        printDoc.addHTML(dom,function() {
                printDoc.save(getPdfFilename());

                $(".temporary").remove();
        });

    }

    vis_cvs.toDataURL_=function(t) {
        var c = document.createElement("canvas");
        c.width=vis_cvs.width;
        c.height=vis_cvs.height;
        c.getContext("2d").fillStyle="white";
        c.getContext("2d").fillRect(0,0, c.width, c.height);
        c.getContext("2d").drawImage(vis_cvs,0,0,c.width,c.height);
        return c.toDataURL(t);
    };

    $('.filter-category-a').change(function(e) {
        fillCatSelB(+this.dataset.id);
    });

    $('.filter-category-b').change(function(e) {
        fillCatSelSize(+this.dataset.id);
    });

    $('.filter-size').change(function(e) {
        setTileFilter(+this.dataset.id, {q: this.value, catB: $('#filter-category-b-' + this.dataset.id).val()});
    });

    $('.room-link').click(function() {
    	$('#preloader2').show();
    });
});

$(window).load(function() {
    $('.filter_thumbs').slimScroll({
        width: '100%',
		height: '370px'
    });
    $('.room_thumb_wrap').slimScroll({
        width: '100%',
        height: '270px'
    });
    $('.tabs-content-wrapper').slimScroll({
        width: '100%',
        height: '350px'
    });
    var homeContainer = document.querySelector('#home');
    var msnry = new Masonry(homeContainer, {
        columnWidth: 1,
        itemSelector: '.item'
    });

});
// $('.custom_nav_tabs li a').click(function(event) {
//   if(this.id == "second"){
//      var container = document.querySelector('#profile');
//     var msnry = new Masonry( container, {
//       // options
//       columnWidth: 1,
//       itemSelector: '.item'
//     });
//   }
// });

$('a[data-toggle=tab]').on('shown.bs.tab', function(e) {
    $(window).trigger("resize");
});
$(window).resize(function() {
    orient();
    setRightMenu();
    sidemenu();
    $this = $('#home');
    $this.masonry({
        columnWidth: 1,
        gutter: 0,
        itemSelector: '.item'
    });
    $this = $('#profile');
    $this.masonry({
        columnWidth: 1,
        gutter: 0,
        itemSelector: '.item'
    });
    $this = $('#settings');
    $this.masonry({
        columnWidth: 1,
        gutter: 0,
        itemSelector: '.item'
    });
    $this = $('#messages');
    $this.masonry({
        columnWidth: 1,
        gutter: 0,
        itemSelector: '.item'
    });

    // $('.filter_thumbs').slimScroll({
    //     width: '100%'
    // });
    // $('.room_thumb_wrap').slimScroll({
    //     width: '100%'
    // });
});

// Shared helpers used outside the document-ready closure.
function uniqTiles(list) {
    var out = [];
    var seen = {};
    for (var i = 0; i < list.length; i++) {
        var t = list[i];
        if (!t) continue;
        var key = String(t.id || t.source_tile_id || t.name || i);
        if (seen[key]) continue;
        seen[key] = true;
        out.push(t);
    }
    return out;
}

function isFloorTileType(tileType) {
    var targetType = Number(tileType);
    if (!isFinite(targetType)) return false;

    if (typeof scene_data !== "undefined" && scene_data && scene_data.length) {
        for (var i = 0; i < scene_data.length; i++) {
            var s = scene_data[i];
            if (!s) continue;

            var sType = Number(s.tile_type);
            if (!isFinite(sType) && typeof s[0] !== "undefined") {
                sType = Number(s[0]);
            }
            if (!isFinite(sType) || sType !== targetType) continue;

            var marker = s.is_floor;
            if (typeof marker === "undefined") marker = s["is_floor"];
            if (typeof marker === "undefined") marker = s[177];
            if (typeof marker === "undefined") marker = s["177"];

            return Number(marker) === 1 || marker === true;
        }
    }

    // Legacy fallback for old 2-surface rooms when scene metadata is missing.
    return targetType === 2;
}

function getAppliedTilesForType(id) {
    var current = [];
    if (free_tiles[id] && free_tiles[id].length) {
        for (var i = 0; i < free_tiles[id].length; i++) {
            if (free_tiles[id][i]) current.push(free_tiles[id][i]);
        }
    } else if (tile_datas[id] && tile_datas[id].length) {
        for (var j = 0; j < tile_datas[id].length; j++) {
            if (tile_datas[id][j]) current.push(tile_datas[id][j]);
        }
    }
    return uniqTiles(current);
}

function fillCatSelB(key) {
    var a=document.getElementById("filter-category-a-"+key);
    var b=document.getElementById("filter-category-b-"+key);

    var cat=cats[key];

    var val=Number(a.value);
    if(val === -1) $('.tile-item-' + key).show();

    b.innerHTML="";
    var bs=cat[val];
    var sel="selected";
    var fv=null;


    var e=document.createElement("option");
    e.value=-1;
    e.innerHTML="-All-";
    e.setAttribute("selected","selected");
    b.add(e);


    for(var i in bs)
    {
        var e=document.createElement("option");
        e.value=i;
        if(fv==null)fv=e.value;
        e.innerHTML=tits["b"+i];
        //e.setAttribute("selected",sel);
        b.add(e);
        sel="no";
    }
    b.value=-1;
    /*$(b).selectmenu();
    $(b).selectmenu("refresh");*/
    // b.onchange();

    fillCatSelSize(key);
}

function fillCatSelSize(key) {
    var a=document.getElementById("filter-category-a-"+key);
    var b=document.getElementById("filter-category-b-"+key);
    var s=document.getElementById("filter-size-"+key);

    var cat=cats[key];

    var val=Number(b.value);
    if(val==-1 && Number(a.value)!=-1)
        setTileFilter(key, {catA: a.value});

    s.innerHTML="";

    var e=document.createElement("option");
    e.value=-1;
    e.innerHTML="-All-";
    e.setAttribute("selected","selected");
    s.add(e);


    if(val!=-1){var ss=cat[Number(a.value)][Number(b.value)];
    var sel="selected";
    var fv=null;
    for(var i in ss)
    {
        e=document.createElement("option");
        e.value=ss[i];
        if(fv==null)fv=e.value;
        e.innerHTML=i;
        e.setAttribute("selected",sel);
        s.add(e);
        sel="no";
    }}
    s.value=-1;
    /*$(s).selectmenu();
    $(s).selectmenu("refresh");*/
    // if(val!=-1)s.onchange();
    if(val!=-1) setTileFilter(key, {catB: val});
}

function setTileFilter(key, filters) {
    $(".tile-item-" + key).each(function() {
        var el = this;
        $(this).toggle(Object.keys(filters).every(function(prop) {
            return +el.dataset[prop] === +filters[prop];
        }));
    });
}



// ======
// SHAPES
// ======
var tile_datas = {};
var shape_datas = [];var shapes = [];
var activeShape;

var w_ratio = 1;
var h_ratio = 1;
var eph = 11;
var pointer_img = 'visualizer/pointer.png';

/*addArea.onclick = function(e){
    var newShape = [];
    editPoints(newShape);
};*/

line_cvs.width = 1600;
line_cvs.height = 900;

/*apply.onclick = function(e){
    shapes = list;
    selectShape(10);
};*/

clearMask = function(){
    activeShape = null;
    /*var ctx=line_cvs.getContext("2d");
    ctx.clearRect ( 0 , 0 , line_cvs.width, line_cvs.height );
    $(".pointer-drag").remove();*/
    cancel();
};

editPoints=function(shape) {
    var list =[];
    var lest =[];

    $("body").bind("keyup",function(e){
        if(e.which==27) {
            if(confirm("Are you sure to cancel ?"))
                cancel();
        }
        else if(e.which==13) {
            if(confirm("Are you sure to save changes?"))
                save();
        }
    });

    cancel = function(){
        list =[];
        lest =[];
        activeShape = null;
        $(".pointer-drag").remove();
        $("body").unbind("keyup");
        $("#mask").unbind("click");
        draw();
    }


    draw=function()    {
        var ctx=line_cvs.getContext("2d");
        ctx.clearRect ( 0 , 0 , line_cvs.width, line_cvs.height );

        ctx.fillStyle="rgba(255,255,255,0.75)";
        ctx.strokeStyle="black";
        ctx.beginPath();
        for(var i=0;i<list.length;i++){
            ctx.lineTo(list[i][0] / w_ratio ,list[i][1] / h_ratio);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    $("#mask").bind("click",function(e){
        var parentOffset = $(this).parent().offset();
        var x = e.pageX - parentOffset.left;
        var y = e.pageY - parentOffset.top;
        add(x,y);
        draw();
    });


    mask.oncontextmenu=function(){
        rem();
        draw();
        return false;
    }


    var rem=function()
    {
        list.pop();
        lest.pop().remove();
    }

    var add=function(x,y)
    {
        var e=$( "<div class='pointer-drag' style='cursor:cross-hair;width:"+eph+"px;height:"+eph+"px;background-image:url("+pointer_img+");background-size:cover;'></div>" );

        e.attr("data-ind",list.length);

        list.push([x,y]);
        lest.push(e);

        var f=function(event)  {
            var parentOffset = $(this).parent().offset();
            var xPos = event.pageX - parentOffset.left;
            var yPos = event.pageY - parentOffset.top;
            var ind=Number($(this).attr("data-ind"));

            list[ind]=[xPos,yPos];
            draw();
        };

        e.appendTo($("#mask")).css({'top': y- Math.floor(eph/2), 'left' : x-Math.floor(eph/2), 'position':'absolute'}).draggable().bind("drag",f);


        draw();
    }

    var save= function(){
        activeShape = list;
        $(".downarrow").click();
    }
    return false;
}

var shape_datas;

var cvs_w=screen.width;
var cvs_h=screen.height;


function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

function selectShape(id) {
    var avai = cloneObj(avail_tiles);
    var d = avai[id];
    setShape(d.tile_type,d,function(data1){
        data1.shape = cloneObj(activeShape);
        shapes.push(data1);
        if (typeof window.scheduleRender === "function") {
            scheduleRender();
        } else if (typeof render === "function" && window.vis_cvs) {
            render(vis_cvs);
        }
        clearMask();
        if (window.__highlightPending && typeof window.hideHighlightOverlay === "function") {
            hideHighlightOverlay();
        }
    });

    updateInfo([d], true);
}



function setShape(tid, data, ondone) {
        data.image=lmage(typeof data.image=="string"?data.image:data.image.src,
        function() {
            ondone(data);
        }
    );
}

// =======
// /SHAPES
// =======


function selectTile(tiles) {
    if (window.__highlightPending && window.__highlightShape) {
        var lastShape = cloneObj(window.__highlightShape);
        applyHighlightShapeTile(tiles[0], lastShape, window.__highlightPendingIndex);
        if (typeof window.hideHighlightOverlay === "function") {
            window.hideHighlightOverlay();
        }
        window.__highlightPending = false;
        window.__highlightShape = null;
        window.__highlightLastShape = lastShape;
        window.__highlightActiveSelectionIndex = (typeof window.__highlightPendingIndex === "number")
            ? window.__highlightPendingIndex
            : window.__highlightSelections.length - 1;
        window.__highlightAllowRetile = true;
        window.__highlightPendingIndex = null;
        return;
    }
    if (window.__highlightModeActive && window.__highlightAllowRetile && window.__highlightLastShape && window.__highlightLastShape.length) {
        var idx = (typeof window.__highlightActiveSelectionIndex === "number")
            ? window.__highlightActiveSelectionIndex
            : window.__highlightSelections.length - 1;
        applyHighlightShapeTile(tiles[0], window.__highlightLastShape, idx);
        return;
    }
    if(activeShape != null){
        selectShape(tiles[0].id);
    } else {
        setTile(tiles[0].tile_type,tiles,function(tid,tile_data)
        {
            var layoutType = $('.layout-type-input[data-tile-id=' + tid + ']:checked').val() || "grid";

            if(layoutType=="dragdrop")
            {
                var td=tile_data[0];
                var i=free_tiles[tid].indexOf(td);
                if(i==-1)
                    free_tiles[tid].push(td);
                free_tiles_cur[tid]=td;
            }

            if (typeof window.scheduleRender === "function") {
                scheduleRender();
            } else if (typeof render === "function" && window.vis_cvs) {
                render(vis_cvs);
            }
        });
        // d = tiles[0];

        // $('input[name="tile_grout_'+d.tile_type+'"]').prop('checked', false);//.checkboxradio( "refresh" );;
        // $('#tile_grout_'+d.tile_type+'_'+d.grout_id).prop('checked', true);//.checkboxradio( "refresh" );;

        updateInfo(tiles);
        logUserActivity(tiles[0]);
    }
}

function getDirectUserActivityUrl() {
    var base = "";
    if (typeof window.NEXT_PUBLIC_API_BASE === "string" && window.NEXT_PUBLIC_API_BASE.trim()) {
        base = window.NEXT_PUBLIC_API_BASE.trim();
    }
    if (!base) {
        try {
            if (window.parent && window.parent !== window) {
                var parentBase = window.parent.NEXT_PUBLIC_API_BASE || window.parent.VISUALIZER_API_BASE || "";
                if (typeof parentBase === "string" && parentBase.trim()) base = parentBase.trim();
            }
        } catch (e) {}
    }
    if (!base && typeof window.VISUALIZER_API_BASE === "string" && window.VISUALIZER_API_BASE.trim()) {
        base = window.VISUALIZER_API_BASE.trim();
    }
    if (!base && typeof window.API_BASE === "string" && window.API_BASE.trim()) {
        base = window.API_BASE.trim();
    }
    if (!base) return "";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + "AddUserActivity";
}

function resolveActivityTileId(tile) {
    if (!tile) return 0;
    var raw = tile.source_tile_id || tile.fixedId || tile.id || 0;
    var parsed = Number(raw);
    return isFinite(parsed) ? parsed : 0;
}

function logUserActivity(tile) {
    if (typeof fetch !== "function") return;

    var resolvedIp = "127.0.0.1";
    try {
        if (window && window.location && window.location.hostname && window.location.hostname !== "localhost") {
            resolvedIp = window.location.hostname;
        }
    } catch (e) {}

    var resolvedUrl = "";
    try {
        resolvedUrl = (window && window.location && window.location.href) ? window.location.href : "";
    } catch (e) {}

    var resolvedTileId = resolveActivityTileId(tile);
    var payload = {
        source: "visualizer_web",
        Source: "visualizer_web",
        ipAddress: resolvedIp,
        IpAddress: resolvedIp,
        ip_address: resolvedIp,
        url: resolvedUrl,
        Url: resolvedUrl,
        tileId: resolvedTileId,
        TileId: resolvedTileId,
        tile_id: resolvedTileId,
        block: false,
        Block: false
    };

    var activityUrl = getDirectUserActivityUrl();
    if (!activityUrl) return;

    fetch(activityUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
    }).catch(function(err) {
        console.warn("[user-activity] log failed:", err && err.message ? err.message : err);
    });
}


function selectGrout(key,id,dont_render) {
    if(!tile_datas[key]) return;
    tile_datas[key].forEach(function(tile) {
        tile.grout_color=id==-1?"rgba(0,0,0,0)":colors[id];

    });
    if(free_tiles && free_tiles[key])
        free_tiles[key].forEach(function(tile) {
            if(tile)
                tile.grout_color=colors[id];
        });
    if(!dont_render)
        render(vis_cvs);
}


function updateInfo(tiles, isShape) {
    function renderProductRows(list) {
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (!t) continue;
            var imageSrc = typeof t.image == "string" ? t.image : (t.image && t.image.src ? t.image.src : "");
            var sizeText = (t.size && t.size.length >= 2) ? (t.size[0] + "x" + t.size[1]) : "-";
            html += '<div class="row product_wrapper">' +
                        '<div class="col-xs-3">' +
                            '<img src="' + imageSrc + '" class="img-responsive">' +
                        '</div>' +
                        '<div class="col-xs-9">' +
                            '<p class="selected_product_name">' + (t.name || "Tile") + '</p>' +
                            '<p class="product_type">' +
                                '<label>Size: </label> ' + sizeText + 'mm' + '</p>' +
                                '<label>Price: </label> ' + 'Rs.' + (t.price || 0) + '</p>' +
                        '</div>' +
                    '</div>';
        }
        return html;
    }

    if (isShape) {
        var shapeTiles = [];
        (tiles || []).map(function(tile){ shapeTiles.push(tile); });
        var shapeType = shapeTiles[0] && shapeTiles[0].tile_type;
        if (!shapeType) return;
        var fts = free_tiles[shapeType];
        if (fts instanceof Array) {
            fts.map(function(tile) {
                if (shapeTiles.indexOf(tile) == -1) shapeTiles.push(tile);
            });
        }
        $("#tile_info_list_shapes_" + shapeType).html(renderProductRows(shapeTiles));
        return;
    }

    var wallTiles = [];
    var floorTiles = [];
    for (var k in tile_datas) {
        if (!tile_datas.hasOwnProperty(k) || !isFinite(k)) continue;
        var typeId = Number(k);
        if (typeId <= 0) continue;
        var applied = getAppliedTilesForType(typeId);
        if (!applied.length) continue;
        if (isFloorTileType(typeId)) floorTiles = floorTiles.concat(applied);
        else wallTiles = wallTiles.concat(applied);
    }

    wallTiles = uniqTiles(wallTiles);
    floorTiles = uniqTiles(floorTiles);
    $("#tile_info_list_1").html(renderProductRows(wallTiles));
    $("#tile_info_list_2").html(renderProductRows(floorTiles));
}

function drawFilters(fd)
{
    if(fd instanceof Object)
    {
        var ret="";
        for(var fid in fd)
        {
            var d=fd[fid];
            //var fn=$("label[for='filter-"+fid+"']").html();
			var fn=$("label[for='filter-"+fid+"']");
            if(fn.length>0 && d.replace(/\s/g, '') != '') //Remove all white space before checking if d is empty
                ret+='<p class="product_type">' +
                            '<label>'+fn.html()+': </label> ' + d + '</p>';
        }
        return ret;
    }
    return "";
}


// getATitle=function(i){return tits["a"+i];}
// getBTitle=function(i){return tits["b"+i];}








function disableOther(button) {
    if (button !== 'showLeft') {
        classie.toggle(showLeft, 'disabled');
    }
}
// set the right side buttons
function setRightMenu() {
    var winWdth = $(window).width();
    if (winWdth < 768) {
        $(".right_side_btns").css({
            width: '90%',
            right: '0px'
        });
        $(".right_side_btns").hide();
        $(".header_nav_xs").hide();
        $(".right_toggle_btn").show();
        $("#show_btn").show();
        $(".show_img").show();
        $(".hide_img").hide();
        $('.right_toggle_btn').css('left', '90%');
    }
    else{
        $(".right_toggle_btn").hide();
        $("#show_btn").hide();
        $(".right_side_btns").css({
            width: '50px'
        });
        $(".right_side_btns").show();
        $(".header_nav_xs").hide();

    }
}


function sidemenu()
{
    window_width=$(window).width();
    window_height=$(window).height();
    cust_position = window_height / 2 ;
    if( window_width > 767 )
    {
    $(".right_side_btns").css("top",cust_position+"px");
    }


}

function btn_click()
{
    $(".pre_btn").on("click",function(){

           $('#preloader2').show().delay(1000).fadeOut();

    });
}
function img_click()
{

    $(".tab_click img").on("click",function(){

           $('#preloader2').show().delay(1000).fadeOut();
    });
}
function orient()
{

    if (window.matchMedia("(orientation: portrait)").matches)
    {
        if( ($(window).width()) < 479)
        {
            $('#preloader').show();
        }
    }
    else
    {
        $('#preloader').hide();
    }
    // if (window.matchMedia("(orientation: landscape)").matches)
    // {
    // $('#preloader').hide();
    // }
}
function confirm_Refresh()
{

        setTimeout("location.reload();",1000);

}

