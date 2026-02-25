dont_hide_leftmenu_on_tile_click_for_one_time = false;

function init_number_filters(key) {
    $('[data-for="filter"][data-filter-type="number"]', $("#filter-section-" + key)).each(function() {
        var elm = $(this);
        var filter_id = elm.attr('data-filter-id');
        var min = null;
        var max = null;
        $(".tile-item-" + key).each(function() {
            var fval = Number($(this).attr('data-filter-' + filter_id));

            if (fval * 0 != 0)
                return;

            if (min == null || fval < min)
                min = fval;
            if (max == null || fval > max)
                max = fval;
        });
        if (min == null)
            min = 0;
        if (max == null)
            max = min + 1;
        window["update_filter_" + key + "_" + filter_id](min, max, min, max);
    });
}

$("button.apply-filter").click(function() {
    var elm = $(this);
    var key = elm.attr("data-key");

    applyFilter(key);
    $("#filter-section-" + key).modal("hide");
});

applyFilter = function(key) {
    //$('.filter-category-a').click();
    var items = $(".tile-item-" + key);
    //items.show();

    items.each(function() {
        var el = $(this);
        var show = true;
        $('[data-for="filter"]', $("#filter-section-" + key)).each(function() {
            if (!show)
                return;

            var elm = $(this);

            var ft = elm.attr('data-filter-type');
            var fid = elm.attr('data-filter-id');

            if (ft == 'option') {
                var val = elm.val();
                if (!elm.is(':checked')) {
                    var data = ',' + el.attr('data-filter-' + fid) + ',';
                    if (data.indexOf(',' + val + ',') > -1)
                        show = false;
                } else if (elm.is(':checked')) {
                    var data = ',' + el.attr('data-filter-' + fid) + ',';
                    if (data.indexOf(',' + val + ',') > -1)
                        show = true;
                }
            } else if (ft == 'number') {
                var fvals = elm.slider("option", "values");
                var min = fvals[0];
                var max = fvals[1];
                var data = Number(el.attr('data-filter-' + fid));
                if (min > data || max < data)
                    show = false;
                else
                    show = true;
            }
        });

        el[show ? 'show' : 'hide']();

    });
}

function arraysInCommon(arrays) {
    var i, common, L = arrays.length, min = Infinity;
    while (L) {
        if (arrays[--L].length < min) {
            min = arrays[L].length;
            i = L;
        }
    }
    common = arrays.splice(i, 1)[0];
    return common.filter(function(itm, indx) {
        if (common.indexOf(itm) == indx) {
            return arrays.every(function(arr) {
                return arr.indexOf(itm) != -1;
            });
        }
    });
}
