(function(global) {
    global.getCommonPageChromeHtml = function(imageBasePath) {
        var base = imageBasePath || "/app/visualizer/images";
        return `
<div id="roomsContainer"></div>
<script>document.write(getCommonTopHeaderHtml("${base}/toggle_btn.png"));</script>
<!-- Header -->
<nav class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left custom_nav" id="cbp-spmenu-s1">
    <div role="tabpanel">
        <ul style='display:none;' class="nav nav-tabs custom_sidebar_tabs_wrap" role="tablist">
            <li role="presentation" class="active">
                <a href="#menuPanel1" aria-controls="1" role="tab" data-toggle="tab">
                    <img src="${base}/1_icon.png" alt="">
                    <br>1
                </a>
            </li>
            <li role="presentation" class="">
                <a href="#menuPanel2" aria-controls="2" role="tab" data-toggle="tab">
                    <img src="${base}/2_icon.png" alt="">
                    <br>2
                </a>
            </li>
        </ul>
        <div class="tab-content tab_click">
            <div role="tabpanel" class="tab-pane active custom_sidebar_tab_content" id="menuPanel1"></div>
            <div role="tabpanel" class="tab-pane custom_sidebar_tab_content" id="menuPanel2"></div>
        </div>
    </div>
</nav>
<!-- Side controls -->
<div class="right_toggle_btn">
    <a id="show_btn" href="#">
        <img class="show_img" src="${base}/toolbar-open-lg.png">
        <img class="hide_img" src="${base}/toolbar-close-lg.png">
    </a>
</div>
<div class="btns_wrap">
    <div class="header_nav header_nav_xs">
        <!--<a class="btn pre_btn" id='addArea'>Add Area</a>-->
        <a data-toggle="modal" class="btn pre_btn" data-target="#roomsModal">Select Room</a>
        <a href="#" data-toggle="modal" class="btn pre_btn" data-target=".modal_info">Product Info</a>
    </div>
    <div class="right_side_btns">
        <a href="#" data-toggle="modal" data-target="#modal_save">
            <img src="${base}/save_icon.png" alt="">
        </a>
        <br class="mobile_br_hide">
        <a href="#" class="print-btn">
            <img src="${base}/print_icon.png" alt="">
        </a>
        <br class="mobile_br_hide">
        <a href="#modal_mail" data-toggle="modal" data-target="#modal_mail">
            <img src="${base}/mail_icon.png" alt="">
        </a>
        <br class="mobile_br_hide">
        <a href="#" class="share-toggle">
            <img src="${base}/share_icon.png" alt="">
        </a>
        <br class="mobile_br_hide">
        <a href="#" class="enter-full-screen">
            <img src="${base}/full_screen_icon.png" alt="">
        </a>
    </div>
</div>
<!-- Product Info Modal -->
<div id="productModalContainer"></div>`;
    };
})(window);
