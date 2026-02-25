(function(global) {
    function normalizePath(path) {
        return path || "";
    }

    global.getCommonPreloadersHtml = function() {
        return '' +
            '<div class="js">' +
            '  <div><div id="preloader">Go to landscape mode</div></div>' +
            '</div>' +
            '<div class="js">' +
            '  <div><div id="preloader2"></div></div>' +
            '</div>';
    };

    global.getCommonTopHeaderHtml = function(toggleImagePath) {
        var toggleSrc = normalizePath(toggleImagePath);
        return '' +
            '<div style="top:15px;left:15px;position:fixed;">' +
            '  <a href="#" class="menu_toggle" id="showLeft">' +
            '    <img src="' + toggleSrc + '" alt="">' +
            '  </a>' +
            '</div>' +
            '<div style="top:15px;right:15px;position:fixed;" class="header_nav hidden-xs">' +
            '  <a data-toggle="modal" class="btn pre_btn" data-target="#roomsModal">Select Room</a>' +
            '  <a href="#" data-toggle="modal" class="btn pre_btn" data-target=".modal_info">Product Info</a>' +
            '</div>';
    };

    global.getCommonBrushIconsHtml = function(config) {
        var imageSrc = normalizePath(config && config.imageSrc);
        var panel1Left = config && config.panel1Left != null ? config.panel1Left : 640;
        var panel1Top = config && config.panel1Top != null ? config.panel1Top : 275;
        var panel2Left = config && config.panel2Left != null ? config.panel2Left : 804.5;
        var panel2Top = config && config.panel2Top != null ? config.panel2Top : 803;

        return '' +
            '<a data-isdragging="no" data-left="' + panel1Left + '" data-top="' + panel1Top + '" onclick="showLeftMenu(1);" class="brush_icon" href="#menuPanel1" aria-controls="1" role="tab" data-toggle="tab">' +
            '  <img src="' + imageSrc + '"></img>' +
            '</a>' +
            '<a data-isdragging="no" data-left="' + panel2Left + '" data-top="' + panel2Top + '" onclick="showLeftMenu(2);" class="brush_icon" href="#menuPanel2" aria-controls="2" role="tab" data-toggle="tab">' +
            '  <img src="' + imageSrc + '"></img>' +
            '</a>';
    };
})(window);
