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
                    <br>1
                </a>
            </li>
            <li role="presentation" class="">
                <a href="#menuPanel2" aria-controls="2" role="tab" data-toggle="tab">
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
        <a data-toggle="modal" class="btn pre_btn" data-target="#roomsModal">
            <span class="pre_btn_icon fa fa-th-large" aria-hidden="true"></span>
            <span class="pre_btn_label">Select Room</span>
        </a>
        <a href="#" class="btn pre_btn" onclick="return openProductInfoModal(event);">
            <span class="pre_btn_icon fa fa-info-circle" aria-hidden="true"></span>
            <span class="pre_btn_label">Product Info</span>
        </a>
    </div>
    <div class="right_side_btns">
        <a href="#" class="save-options-toggle" onclick="return toggleSaveOptions(event);">
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
        <a href="#" class="share-options-toggle" onclick="return toggleShareOptions(event);">
            <img src="${base}/share_icon.png" alt="">
        </a>
        <br class="mobile_br_hide">
        <a href="#" class="enter-full-screen">
            <img src="${base}/full_screen_icon.png" alt="">
        </a>
    </div>
    <div id="saveOptionsPanel" class="save-options-panel" aria-hidden="true">
        <button type="button" class="save-option" onclick="saveDesignAsImage()">
            <span class="save-icon fa fa-file-image-o" aria-hidden="true"></span>
            <span>Save Image</span>
        </button>
        <button type="button" class="save-option" onclick="saveWithInfoPDF()">
            <span class="save-icon fa fa-file-pdf-o" aria-hidden="true"></span>
            <span>Save PDF</span>
        </button>
        <button type="button" class="save-option" onclick="saveDesignForLater()">
            <span class="save-icon fa fa-bookmark-o" aria-hidden="true"></span>
            <span>Save For Later</span>
        </button>
    </div>
    <div id="shareOptionsPanel" class="share-options-panel" aria-hidden="true">
        <button type="button" class="share-option" onclick="shareDesignOnFacebook()">
            <img src="${base}/share_icon.png" class="share-icon" alt="">
            <span>Facebook</span>
        </button>
        <button type="button" class="share-option" onclick="shareDesignOnTwitter()">
            <img src="${base}/share_icon.png" class="share-icon" alt="">
            <span>Twitter</span>
        </button>
        <button type="button" class="share-option" onclick="shareDesignOnGoogle()">
            <img src="${base}/share_icon.png" class="share-icon" alt="">
            <span>Google+</span>
        </button>
    </div>
</div>
<!-- Product Info Modal -->
<div id="productModalContainer"></div>`;
    };
})(window);
