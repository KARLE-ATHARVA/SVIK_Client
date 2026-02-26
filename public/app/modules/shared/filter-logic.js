var dont_hide_leftmenu_on_tile_click_for_one_time = false;

/* -----------------------------
   VISUAL STATE HELPERS
------------------------------*/

function refreshFilterVisualState(key) {
    var scope = $("#filter-section-" + key);
    if (!scope.length) return;

    $('input[data-for="filter"][data-filter-type="option"]', scope)
        .each(function () {
            $(this)
                .closest("span")
                .toggleClass("is-checked", this.checked);
        });
}

function cleanupFilterActionSeparators(key) {
    var scope = $("#filter-section-" + key);
    if (!scope.length || scope.attr("data-filter-cleaned") === "1") return;

    $(".filter_form .col-sm-9", scope).each(function () {
        $(this).contents().filter(function () {
            return this.nodeType === 3 && /^(\s|,)+$/.test(this.nodeValue || "");
        }).remove();
    });

    scope.attr("data-filter-cleaned", "1");
}

function normalizeFilterFields(key) {
    var scope = $("#filter-section-" + key);
    if (!scope.length) return;

    var legacy = $(".filter_form > div[style*='display:none']", scope).first();
    if (legacy.length) {
        legacy.css("display", "block");
        $("label[for^='filter-size-']", legacy).closest(".form-group").hide();
        // Hide legacy color dropdown to avoid conflict with API-driven Color chips (data-filter-id=33).
        $("label[for^='filter-category-b-']", legacy).closest(".form-group").hide();
    }

    var spaceFilterId = key === "1" ? "27" : "28";
    $("label[for='filter-" + spaceFilterId + "']", scope).text("Space");

    $("label[for='filter-29'], label[for='filter-30'], label[for='filter-32']", scope)
        .closest(".form-group")
        .hide();

    // Defensive hide if any Sanita-labeled group still exists.
    $(".form-group .col-sm-3.control-label", scope).filter(function () {
        return /sanita/i.test($(this).text());
    }).closest(".form-group").hide();

    ensureApplicationSelectionForKey(key, "wall");
    ensureAtLeastOneSelectionPerGroup(key);
}

/* -----------------------------
   ALL / NONE / INVERT FIX
------------------------------*/

$(document).on("click", ".filter-action-all", function () {
    var scope = $(this).closest(".modal");
    var key = scope.attr("id").replace("filter-section-", "");

    $('input[data-filter-type="option"]:visible', scope)
        .prop("checked", true)
        .trigger("change");

    refreshFilterVisualState(key);
    applyFilter(key);
});

$(document).on("click", ".filter-action-none", function () {
    var scope = $(this).closest(".modal");
    var key = scope.attr("id").replace("filter-section-", "");

    $('input[data-filter-type="option"]:visible', scope)
        .prop("checked", false)
        .trigger("change");

    refreshFilterVisualState(key);
    applyFilter(key);
});

$(document).on("click", ".filter-action-invert", function () {
    var scope = $(this).closest(".modal");
    var key = scope.attr("id").replace("filter-section-", "");

    $('input[data-filter-type="option"]:visible', scope).each(function () {
        $(this).prop("checked", !this.checked);
    }).trigger("change");

    refreshFilterVisualState(key);
    applyFilter(key);
});

/* -----------------------------
   FILTER CORE
------------------------------*/

function collectVisibleOptionGroups(key) {
    var scope = $("#filter-section-" + key);
    var groups = {};

    $('input[data-for="filter"][data-filter-type="option"]', scope)
        .each(function () {
            var $input = $(this);
            if (!$input.closest(".form-group").is(":visible")) return;

            var fid = String($input.attr("data-filter-id") || "");
            if (!fid) return;

            if (!groups[fid]) {
                groups[fid] = { checked: [], total: 0 };
            }

            groups[fid].total++;

            if (this.checked) {
                groups[fid].checked.push(
                    String($input.val() || "").trim().toLowerCase()
                );
            }
        });

    return groups;
}

function parseItemFilterValues(raw) {
    if (!raw) return [];
    return String(raw)
        .split(",")
        .map(function (v) { return String(v).trim().toLowerCase(); })
        .filter(Boolean);
}

function matchesAnyCheckedValue(itemValues, checkedValues) {
    var set = {};
    itemValues.forEach(function(v) {
        var n = String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
        if (n) set[n] = true;
    });
    return checkedValues.some(function(checked) {
        var c = String(checked || "").trim().toLowerCase().replace(/\s+/g, " ");
        return !!c && !!set[c];
    });
}

function applyFilter(key) {
    ensureApplicationSelectionForKey(key, "wall");
    ensureAtLeastOneSelectionPerGroup(key);

    var scope = $("#filter-section-" + key);
    var optionGroups = collectVisibleOptionGroups(key);
    var items = $(".tile-item-" + key);

    items.each(function () {
        var el = $(this);
        var show = true;

        Object.keys(optionGroups).forEach(function (fid) {
            if (!show) return;

            var group = optionGroups[fid];
            var checked = group.checked;
            var total = group.total;

            if (total <= 0 || checked.length === total) return;
            if (!checked.length) { show = false; return; }

            var itemValues = parseItemFilterValues(el.attr("data-filter-" + fid));
            if (!matchesAnyCheckedValue(itemValues, checked)) {
                show = false;
            }
        });

        el.toggle(show);
    });
}

/* -----------------------------
   EVENTS
------------------------------*/

$("button.apply-filter").click(function () {
    var key = $(this).attr("data-key");
    applyFilter(key);
    refreshFilterVisualState(key);
    $("#filter-section-" + key).modal("hide");
});

$(document).on("change", 'input[data-for="filter"][data-filter-type="option"]', function () {
    var section = $(this).closest('.modal[id^="filter-section-"]');
    if (!section.length) return;

    // Application (id=34) must be single-select only.
    if (String($(this).attr("data-filter-id") || "") === "34") {
        if (this.checked) {
            $('input[data-for="filter"][data-filter-type="option"][data-filter-id="34"]', section)
                .not(this)
                .prop("checked", false);
        } else {
            // Prevent invalid empty state for Application on load/edge toggles.
            var $apps = $('input[data-for="filter"][data-filter-type="option"][data-filter-id="34"]', section);
            if (!$apps.filter(":checked").length) {
                $(this).prop("checked", true);
            }
        }
    }

    var key = section.attr("id").replace("filter-section-", "");
    refreshFilterVisualState(key);
});

function autoApplyApplicationForPanel(key) {
    var scope = $("#filter-section-" + key);
    if (!scope.length) return;

    var target = key === "1" ? "wall" : "floor";
    var $apps = $('input[data-for="filter"][data-filter-type="option"][data-filter-id="34"]', scope);
    if (!$apps.length) return;

    var $match = $apps.filter(function() {
        return String($(this).val() || "").trim().toLowerCase() === target;
    }).first();
    if (!$match.length) return;

    $apps.prop("checked", false);
    $match.prop("checked", true).trigger("change");
    refreshFilterVisualState(key);
    applyFilter(key);
}

function ensureAtLeastOneSelectionPerGroup(key) {
    var scope = $("#filter-section-" + key);
    if (!scope.length) return;

    var byGroup = {};
    $('input[data-for="filter"][data-filter-type="option"]', scope).each(function () {
        var $input = $(this);
        if (!$input.closest(".form-group").is(":visible")) return;
        var fid = String($input.attr("data-filter-id") || "");
        if (!fid) return;
        if (!byGroup[fid]) byGroup[fid] = [];
        byGroup[fid].push($input);
    });

    Object.keys(byGroup).forEach(function (fid) {
        var arr = byGroup[fid];
        var checkedCount = arr.filter(function ($i) { return $i.is(":checked"); }).length;
        if (checkedCount > 0) return;

        if (fid === "34") {
            // Application fallback: WALL by default
            var wall = arr.filter(function ($i) {
                return String($i.val() || "").trim().toLowerCase() === "wall";
            })[0];
            if (wall) {
                wall.prop("checked", true);
            } else if (arr[0]) {
                arr[0].prop("checked", true);
            }
            return;
        }

        // For non-application groups, fallback to "All selected" state.
        arr.forEach(function ($i) { $i.prop("checked", true); });
    });
}

function ensureApplicationSelectionForKey(key, preferred) {
    var scope = $("#filter-section-" + key);
    if (!scope.length) return;

    var pref = String(preferred || "wall").trim().toLowerCase();
    var $apps = $('input[data-for="filter"][data-filter-type="option"][data-filter-id="34"]', scope);
    if (!$apps.length) return;

    // Always keep Application single-select.
    var $checked = $apps.filter(":checked");
    if ($checked.length > 1) {
        var $preferredChecked = $checked.filter(function () {
            return String($(this).val() || "").trim().toLowerCase() === pref;
        }).first();
        var $keep = $preferredChecked.length ? $preferredChecked : $checked.first();
        $apps.prop("checked", false);
        $keep.prop("checked", true);
        return;
    }

    // Never allow empty selection at startup.
    if (!$checked.length) {
        var $preferred = $apps.filter(function () {
            return String($(this).val() || "").trim().toLowerCase() === pref;
        }).first();
        ($preferred.length ? $preferred : $apps.first()).prop("checked", true);
    }
}

$(document).on("shown.bs.modal", '.modal[id^="filter-section-"]', function() {
    var key = this.id.replace("filter-section-", "");
    normalizeFilterFields(key);
    cleanupFilterActionSeparators(key);
    autoApplyApplicationForPanel(key);
    refreshFilterVisualState(key);
});

$(document).on("shown.bs.tab", "a[href='#menuPanel1'], a[href='#menuPanel2']", function() {
    var href = String($(this).attr("href") || "");
    var key = href === "#menuPanel1" ? "1" : (href === "#menuPanel2" ? "2" : "");
    if (!key) return;
    autoApplyApplicationForPanel(key);
});

$(document).on("click", ".brush_icon[href='#menuPanel1'], .brush_icon[href='#menuPanel2']", function() {
    var href = String($(this).attr("href") || "");
    var key = href === "#menuPanel1" ? "1" : (href === "#menuPanel2" ? "2" : "");
    if (!key) return;
    setTimeout(function() { autoApplyApplicationForPanel(key); }, 0);
});

// Default on landing: Application = WALL.
$(function () {
    // Retry briefly to handle async filter option rendering without flicker.
    var attempts = 0;
    var timer = setInterval(function () {
        attempts += 1;
        var ready = true;
        ["1", "2"].forEach(function (key) {
            var scope = $("#filter-section-" + key);
            if (!scope.length) return;
            var hasApps = $('input[data-for="filter"][data-filter-type="option"][data-filter-id="34"]', scope).length > 0;
            if (!hasApps) {
                ready = false;
                return;
            }
            ensureApplicationSelectionForKey(key, "wall");
            ensureAtLeastOneSelectionPerGroup(key);
            refreshFilterVisualState(key);
            applyFilter(key);
        });

        if (ready || attempts >= 20) {
            clearInterval(timer);
        }
    }, 100);
});
