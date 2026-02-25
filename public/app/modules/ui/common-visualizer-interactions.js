searchKeyPress = function(key, inp) {
    var text = inp.value;
    console.log_(text);
    $(".tile-item-" + key).each(function() {
        var title = $("label", this).attr("aria-label");
        $(this).css({
            display: title.toLowerCase().indexOf(text.toLowerCase()) > -1 ? "inline-block" : "none"
        });
    });
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

        var drag_down_ox = -1;
        var drag_down_oy = -1;
        $("#vis_cvs", cont_for_vis_cvs).draggable({
            revert: true,
            helper: "none",
            start: function(e) {

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

    var last_dragdraw_epoch = 0;

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
