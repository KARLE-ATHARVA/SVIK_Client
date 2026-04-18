searchKeyPress = function(key, inp) {
    var text = inp.value;
    console.log_(text);
    $(".tile-item-" + key).each(function() {
        var title = $("label", this).attr("aria-label");
        $(this).css({
            display: title.toLowerCase().indexOf(text.toLowerCase()) > -1 ? "inline-block" : "none"
        });
    });
    if (typeof window.updateVisualizerTileResultsState === "function") {
        window.updateVisualizerTileResultsState(key, "No products found");
    }
}

function asc_sort(a, b) {
    var title_a = $("label", a).attr("aria-label");
    var title_b = $("label", b).attr("aria-label");
    return title_a > title_b ? 1 : -1;
}

$(function() {

    setInterval(function() {
        $("a", cont_for_vis_cvs).each(function() {
            var elm = $(this);
            //if(elm.attr("data-isdragging")=="no")
            elm.css({
                left: Number(elm.attr("data-left")) * (vis_cvs.offsetWidth / vis_cvs.width),
                top: Number(elm.attr("data-top")) * (vis_cvs.offsetHeight / vis_cvs.height)
            });
        });
    }, 100);

    var dragging_side = null;

    if (option_side_draggable) {
        $("a[data-type=move]", cont_for_vis_cvs).draggable({
            revert: true,
            helper: "<div>qua</div>",
            start: function() {
                if (typeof window.__freeLayoutActive !== "undefined" && window.__freeLayoutActive) {
                    if (typeof dont_click !== "undefined") {
                        dont_click = false;
                    }
                    return false;
                }

                dragging_side = null;

                $(this).attr("data-isdragging", "yes");
                $(body).css({
                    "cursor": "move"
                });
                $(this).hide();

                var sk = Number($(this).attr("data-side"));
                var s = null;
                for (var i = 0; i < scene_data.length; i++)
                    if (scene_data[i][0] == sk)
                        s = scene_data[i];

                s[10001] = s[1];
                s[10002] = s[2];

                dragging_side = s;
            },
            drag: function(e) {

                $(this).attr("data-isdragging", "no");
                $(body).css({
                    "cursor": "default"
                });
                $(this).show();

                var deltaX = obj.position.left - obj.originalPosition.left;
                var deltaY = obj.position.top - obj.originalPosition.top;
                var s = dragging_side;

                if (s == null)
                    return;

                s[1] = s[10001] + deltaX / 33;
                s[2] = s[10002] - deltaY / 33;

                if (Date.now() - last_dragdraw_epoch > 50) {
                    render(vis_cvs);
                    last_dragdraw_epoch = Date.now();
                }
            },
            stop: function(e, obj) {
                render(vis_cvs);
            }
            ,
            revertDuration: 100
        });

        if (typeof option_room_draggable === "undefined" || option_room_draggable) {
            var drag_down_ox = -1;
            var drag_down_oy = -1;
            $("#vis_cvs", cont_for_vis_cvs).draggable({
                revert: true,
                helper: "none",
                start: function(e) {
                    if (typeof window.__freeLayoutActive !== "undefined" && window.__freeLayoutActive) {
                        if (typeof dont_click !== "undefined") {
                            dont_click = false;
                        }
                        return false;
                    }

                    dragging_side = null;

                    dont_click = true;

                    $(body).css({
                        "cursor": "move"
                    });

                    drag_down_ox = e.offsetX;
                    drag_down_oy = e.offsetY;

                    var x = drag_down_ox;
                    var y = drag_down_oy;

                    var w = vis_cvs.width;
                    var h = vis_cvs.height;

                    var ow = vis_cvs.offsetWidth;
                    var oh = vis_cvs.offsetHeight;

                    x *= w / ow;
                    y *= h / oh;

                    x = Math.floor(x);
                    y = Math.floor(y);

                    if (indexer_data != null) {
                        var j = (y * w + x) * 4;
                        var clr = [indexer_data[j++], indexer_data[j++], indexer_data[j]];

                        if (clr[0] == 0 && clr[1] == 0 && clr[2] == 0)
                            return;

                        console.log_(clr);

                        var sk = clr[2];

                        if (sk >= scene_data.length) {
                            var k = Math.floor(128 / scene_data.length);
                            var sk_ = sk;

                            for (var i = 0; i < scene_data.length; i++) {
                                if (sk <= 255 - k * i)
                                    sk_ = i;
                                else
                                    break;
                            }
                            sk = sk_;
                        }

                        var s = scene_data[sk];

                        s[10001] = s[1];
                        s[10002] = s[2];

                        dragging_side = s;
                    }

                },
                drag: function(e, obj) {

                    var deltaX = obj.position.left - obj.originalPosition.left;
                    var deltaY = obj.position.top - obj.originalPosition.top;
                    var s = dragging_side;

                    if (s == null)
                        return;
                    s[1] = s[10001] + deltaX / 33;
                    s[2] = s[10002] - deltaY / 33;

                    if (Date.now() - last_dragdraw_epoch > 50) {
                        render(vis_cvs);
                        last_dragdraw_epoch = Date.now();
                    }

                },
                stop: function(e, obj) {

                    $(body).css({
                        "display": "block",
                        "cursor": "default"
                    });

                    render(vis_cvs);

                }
                ,
                revertDuration: 100
            });
        }

    }

    var last_dragdraw_epoch = 0;

    function pickSceneSideFromCanvasPoint(x, y) {
        if (indexer_data == null) return null;

        var w = vis_cvs.width;
        var h = vis_cvs.height;
        var j = (y * w + x) * 4;
        var clr = [indexer_data[j++], indexer_data[j++], indexer_data[j]];

        if (clr[0] === 0 && clr[1] === 0 && clr[2] === 0) return null;

        var sk = clr[2];
        if (sk >= scene_data.length) {
            var k = Math.floor(128 / scene_data.length);
            var sk_ = sk;
            for (var i = 0; i < scene_data.length; i++) {
                if (sk <= 255 - k * i) sk_ = i;
                else break;
            }
            sk = sk_;
        }

        return scene_data[sk] || null;
    }

    function getCanvasPointFromClient(evt) {
        var rect = vis_cvs.getBoundingClientRect();
        var ow = vis_cvs.offsetWidth || rect.width || 1;
        var oh = vis_cvs.offsetHeight || rect.height || 1;
        var x = (evt.clientX - rect.left) * (vis_cvs.width / ow);
        var y = (evt.clientY - rect.top) * (vis_cvs.height / oh);
        return {
            x: Math.floor(x),
            y: Math.floor(y)
        };
    }

    function attachPointerDragFallback() {
        if (!option_side_draggable) return;
        if (!vis_cvs) return;

        var pointerActive = false;
        var pointerId = null;
        var startClientX = 0;
        var startClientY = 0;
        var startX = 0;
        var startY = 0;

        vis_cvs.style.touchAction = "none";

        function isFreeLayoutActive() {
            return false;
        }

        var onPointerDown = function(e) {
            if (pointerActive) return;
            if (isFreeLayoutActive()) {
                if (typeof dont_click !== "undefined") {
                    dont_click = false;
                }
                return;
            }

            var pt = getCanvasPointFromClient(e);
            var s = pickSceneSideFromCanvasPoint(pt.x, pt.y);
            if (!s) return;

            dragging_side = s;
            s[10001] = s[1];
            s[10002] = s[2];

            pointerActive = true;
            pointerId = e.pointerId || "touch";
            startClientX = e.clientX;
            startClientY = e.clientY;
            startX = s[10001];
            startY = s[10002];

            dont_click = true;
            $(body).css({ "cursor": "move" });
            if (vis_cvs.setPointerCapture && e.pointerId != null) {
                try { vis_cvs.setPointerCapture(e.pointerId); } catch (err) {}
            }
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        };

        var onPointerMove = function(e) {
            if (!pointerActive) return;
            if (e.pointerId != null && pointerId != null && e.pointerId !== pointerId) return;
            if (!dragging_side) return;

            var deltaX = e.clientX - startClientX;
            var deltaY = e.clientY - startClientY;
            dragging_side[1] = startX + deltaX / 33;
            dragging_side[2] = startY - deltaY / 33;

            if (Date.now() - last_dragdraw_epoch > 50) {
                render(vis_cvs);
                last_dragdraw_epoch = Date.now();
            }
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        };

        var endPointerDrag = function(e) {
            if (!pointerActive) return;
            if (e.pointerId != null && pointerId != null && e.pointerId !== pointerId) return;

            pointerActive = false;
            pointerId = null;
            $(body).css({ "cursor": "default" });
            render(vis_cvs);
            dont_click = false;
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        };

        if (window.PointerEvent) {
            vis_cvs.addEventListener("pointerdown", onPointerDown, { passive: false });
            window.addEventListener("pointermove", onPointerMove, { passive: false });
            window.addEventListener("pointerup", endPointerDrag, { passive: false });
            window.addEventListener("pointercancel", endPointerDrag, { passive: false });
            return;
        }

        var touchStart = function(e) {
            if (!e.touches || !e.touches.length) return;
            onPointerDown(e.touches[0]);
        };
        var touchMove = function(e) {
            if (!e.touches || !e.touches.length) return;
            onPointerMove(e.touches[0]);
        };
        var touchEnd = function(e) {
            endPointerDrag(e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e);
        };
        var mouseDown = function(e) {
            onPointerDown(e);
        };
        var mouseMove = function(e) {
            onPointerMove(e);
        };
        var mouseUp = function(e) {
            endPointerDrag(e);
        };

        vis_cvs.addEventListener("touchstart", touchStart, { passive: false });
        window.addEventListener("touchmove", touchMove, { passive: false });
        window.addEventListener("touchend", touchEnd, { passive: false });
        window.addEventListener("touchcancel", touchEnd, { passive: false });
        vis_cvs.addEventListener("mousedown", mouseDown, { passive: false });
        window.addEventListener("mousemove", mouseMove, { passive: false });
        window.addEventListener("mouseup", mouseUp, { passive: false });
    }

    attachPointerDragFallback();

    $(".tiles-list").each(function() {
        $("li", this).sort(asc_sort).appendTo(this);
    });

    showLeftMenu = function(sk) {
        var mp = $("#menuPanel" + sk);
        if (mp.hasClass("active"))
            classie.toggle(menuLeft, 'cbp-spmenu-open');
        else {
            classie.remove(menuLeft, 'cbp-spmenu-open');
            classie.add(menuLeft, 'cbp-spmenu-open');
        }
    }

    $(document).on("click", ".js-wall-brush, .js-target-brush, .brush_icon[data-side-target]", function() {
        var side = Number($(this).attr("data-side-target"));
        if (!side) return;

        if (window && window.__highlightModeActive) {
            window.__highlightModeActive = false;
            window.__highlightActiveSelectionIndex = null;
            window.__highlightAllowRetile = false;
            if (typeof window.hideHighlightOverlay === "function") {
                window.hideHighlightOverlay();
            }
        }
        window.__targetTileType = side;
        if (window.__wallTileTypes && window.__wallTileTypes.indexOf(side) !== -1 && typeof switchActiveWall === "function") {
            switchActiveWall(side);
        }
    });

    // Any brush icon click should exit highlight mode to avoid overriding wall/floor painting.
    $(document).on("click", ".brush_icon", function() {
        if (window && window.__highlightModeActive) {
            window.__highlightModeActive = false;
            window.__highlightActiveSelectionIndex = null;
            window.__highlightAllowRetile = false;
            if (typeof window.hideHighlightOverlay === "function") {
                window.hideHighlightOverlay();
            }
        }
    });

});

function addStuff(tk, obj, x, y, z) {
    if (!(stuffs[tk]instanceof Array))
        stuffs[tk] = [];

    stuffs[tk].push([obj, x, y, z]);
}
function loadAndAddStuff(tk, name, x, y, z) {
    var data = null;
    for (var i = 0; i < scene_data.length; i++)
        if (scene_data[i][0] == tk)
            data = scene_data[i];

    var tn = data[176];

    THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

    console.log_('/app/visualizer/3DModels/Stuffs/' + tn + '/' + name + '/' + name + '.obj');

    var loader = new THREE.OBJMTLLoader();
    loader.load(
    '/app/visualizer/3DModels/Stuffs/' + tn + '/' + name + '/' + name + '.obj', '/app/visualizer/3DModels/Stuffs/' + tn + '/' + name + '/' + name + '.mtl',
    function(object) {

        addStuff(tk, object, x, y, z);

    });
}
