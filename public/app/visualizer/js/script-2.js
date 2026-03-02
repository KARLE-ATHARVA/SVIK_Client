var actualWdth;
var menuLeft = document.getElementById('cbp-spmenu-s1'),
    showLeft = document.getElementById('showLeft'),
    body     = document.body;
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
    function resolveMailEndpoint() {
        if (typeof getSharedVisualizerMailEndpoint === "function") {
            return getSharedVisualizerMailEndpoint(send_mail_addr);
        }

        var endpoint = (typeof send_mail_addr === "string" && send_mail_addr) ? send_mail_addr : "";
        endpoint = endpoint.trim();

        if (!endpoint) {
            return "/api/visualizer/mail";
        }

        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }

        if (
            endpoint.indexOf("/visualizermail") !== -1 ||
            endpoint.indexOf("/app/admin/visualizer/mail") !== -1 ||
            endpoint.indexOf("/api/visualizer/mail") !== -1
        ) {
            return "/api/visualizer/mail";
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

    function createDesignShareLink() {
        try {
            var data = JSON.stringify(buildDesignPayload());
            var encoded = btoa(data);
            return window.location.href.split("#")[0] + "#design-data:" + encoded;
        } catch (e) {
            return window.location.href.split("#")[0];
        }
    }


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
            var tiles = {};
            for(var i in tile_datas) {
                if(isFinite(i)) {
                    tiles[i] = tile_datas[i].map(function(tile) {
                        var tileInfo = ['id', 'name', 'price', 'cat_a_title', 'cat_b_title', 'link', 'size'].reduce(function(t, prop) {
                            t[prop] = tile[prop];
                            return t;
                        }, {});
                        tileInfo.image = typeof tile.image === 'string' ? tile.image : tile.image.src;
                        return tileInfo;
                    });
                }
            }
            //var withinfo = $(".withinfo").is(":checked");

            /*if(withinfo)
            {
                patternwithInfo("email");
            }*/
            /*else{*/
                $("#sendMail").attr("disabled","disabled").val("sending...");
                $.ajax({
                    url: endpoint,
                    type: "POST",
                    data : {"full_name":fullname, "to" : to, "subject" : subject , "message" : message, "roomname" : roomname, tiles: JSON.stringify(tiles), "imgpath" : imgUrl, "design_link": designLink},
                    success : function(data){
                        console.log("Email is sent");
                        alert("Email is sent.");
                        $("#mailform")[0].reset();
                        $("#modal_mail").modal('hide');
                        $("#sendMail").removeAttr("disabled").val("Send");
                    },
                    error: function(xhr) {
                        $("#sendMail").removeAttr("disabled").val("Send");
                        var serverError = "";
                        try {
                            var payload = xhr && xhr.responseJSON ? xhr.responseJSON : null;
                            if (payload && payload.error) {
                                serverError = payload.error;
                                if (payload.details) {
                                    serverError += " (" + payload.details + ")";
                                }
                            }
                        } catch (e) {}
                        if (serverError) {
                            alert("Email send failed: " + serverError);
                        }
                        $("#modal_mail").modal('hide');
                        fallbackToMailClient(fullname, to, subject, message, roomname, designLink);
                    }
                });
            //}
        }
    });

    $(".ic-download").click(function(e){
        e.preventDefault();
        $(this).prev(".download_opt").slideToggle();
    });

    (function() {
        var imageUrl = createDesignShareLink();

        $(".share-link").click(function(e) {
            var url;

            e.preventDefault();
            if (!imageUrl) imageUrl = window.location.href;
            var encodedUrl = encodeURIComponent(imageUrl);
            switch($(this).data("service")) {
            case "facebook":
                url = "https://www.facebook.com/sharer/sharer.php?u=";
                break;

            case "twitter":
                url = "https://twitter.com/intent/tweet?url=";
                break;

            case "google":
                url = "https://plus.google.com/share?url=";
                break;
            }

            window.open(url + encodedUrl, "sharer", "width=626,height=436");
        });

        $(".share-toggle").click(function(e) {
            e.preventDefault();
            imageUrl = createDesignShareLink();
            $('#modal_share').modal('show');
        });
    }());

    // Refresh Product Info every time modal opens so multi-wall selections are reflected.
    $(document).on("show.bs.modal", "#modal_info", function() {
        if (typeof updateInfo === "function") {
            updateInfo([], false);
        }
    });

    // Fallback: ensure Product Info opens even when data-api click is blocked.
    $(document).on("click", "a.pre_btn[data-target='.modal_info']", function(e) {
        e.preventDefault();
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
        elem = document.querySelector('.canvas-wrap');
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



    $(document).on("change", ".layout-type-input", function(e) {
        var layout = this.value,
            checked = $('#menuPanel' + this.dataset.room).find(".tile-type-input").filter(":checked").first();

        var tile_id=Number(this.getAttribute("data-tile-id"));

        free_tiles[tile_id]=[];

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
            $('#menuPanel' + this.dataset.room).find(".tile-type-input").filter(":checked").prop("checked", false);
        dont_hide_leftmenu_on_tile_click_for_one_time=true;
        checked.click();
    });

    $(document).on("change", ".tile-type-input", function(e) {
        if(!dont_hide_leftmenu_on_tile_click_for_one_time)
            classie.remove(menuLeft, 'cbp-spmenu-open');
        else
            console.log_("asd");
        dont_hide_leftmenu_on_tile_click_for_one_time=false;

        var $allCheckboxes = $(this).closest(".tiles-list").find(".tile-type-input"),
            $checkedCheckboxes = $allCheckboxes.filter(":checked"),
            thisCheckbox = this,
            tiles = [this.value];

        if(!this.checked) {
            this.checked = true;
            return false;
        }

        if(this.type === "radio") {
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

        selectTile(tiles);
    });

    $(document).on("change", ".rotate-degree", function() {
        render(vis_cvs);
    });

    $('.close-popup-btn').click(function() {
        $(this).closest('.popup').fadeOut();
    });

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    $(".save-design").click(function() {

        if(this.dataset.as=="link")
        {
            var link=createDesignShareLink();

            $('button[data-dismiss="modal"]').click();
            $( "<div title='Design has been saved'><style>.no-close .ui-dialog-titlebar-close {display: none }</style>Copy & Save <a style='text-decoration:underline;' href='"+link+"' target='_blank'>this link</a>.</div>" ).appendTo(document.body).dialog({
                modal: true,
                dialogClass: 'no-close',
                buttons: {
                  Close: function() {
                    $( this ).dialog( "close" ).remove();
                  }
                }
              });

        }
        else
        {
            var infoHtml = '',
                dt = vis_cvs.toDataURL_('image/jpeg');
                l = document.createElement("a");

            switch(this.dataset.as) {
            case "image":
                l.download="Design.jpg";
                break;

            case "info-pdf":
                $('#preloader2').show();
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

                var htdata=['<!DOCTYPE html><html><head><title>' + $.trim($(".resp-tab-active").text()) + ' Design</title></head>',
                    '<style>' +
                    '*,::after,::before{-moz-box-sizing:border-box;box-sizing:border-box}body{font-family:Helvetica neue,Helvetica,Arial,sans-serif}.room-image{border:4px solid #0f73ae}section{margin-top:2em}h2{background-color:#0f73ae;color:#fff;padding:15px;margin:0;border-top-left-radius:15px;border-top-right-radius:15px}.info-content{padding:1em;border-bottom-left-radius:15px;border-bottom-right-radius:15px;border:2px solid #0f73ae}.row::after,.row::before{display:table;content:" "}.row::after{clear:both}.product_wrapper{margin:15px 15px 0}.col-xs-3{float:left;width:25%;padding-right:15px;padding-left:15px}.img-responsive{display:block;max-width:100%;height:auto;vertical-align:middle}.col-xs-9{float:left;width:75%;padding-right:15px;padding-left:15px}.selected_product_name{color:#bc211e;font-weight:700;padding-bottom:5px;text-transform:uppercase}p{margin:0}label{display:inline-block;max-width:100%;margin-bottom:5px;font-weight:700}' +
                    '</style>',
                    '<body style="background-color:white;"><img class="room-image" src="' + dt + '" style="max-width: 100%;"><div id="infoTab">' + infoHtml + '</div><span style="display:none;">%addonjs%</span></body></html>'
                ].join("");

                dt = new Blob([htdata], {type: 'text/html'});
                dt = URL.createObjectURL(dt);
                l.download="Design.html";

                break;
            }

            l.href=dt;
            l.style.display='none';
            document.body.appendChild(l);
            l.click();
            document.body.removeChild(l);

        }

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

            render(vis_cvs);
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
            if (/^https?:\/\//i.test(u)) {
                return "/api/tile-image?url=" + encodeURIComponent(u);
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
        if (/^data:/i.test(img) || img.indexOf("/api/tile-image?") === 0) return img;
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
            return (window.location.origin || "") + "/product-details/" + encodeURIComponent(skuCode);
        }
        return readTileLink(tile);
    }

    function getQrGenerateBase() {
        var base = "";
        if (typeof window.VISUALIZER_API_BASE === "string" && window.VISUALIZER_API_BASE.trim()) {
            base = window.VISUALIZER_API_BASE.trim();
        } else {
            try {
                var stored = localStorage.getItem("visualizer_api_base");
                if (stored && stored.trim()) base = stored.trim();
            } catch (e) {}
        }
        if (!base && typeof window.NEXT_PUBLIC_API_BASE === "string" && window.NEXT_PUBLIC_API_BASE.trim()) {
            base = window.NEXT_PUBLIC_API_BASE.trim();
        }
        if (!base && typeof window.API_BASE === "string" && window.API_BASE.trim()) {
            base = window.API_BASE.trim();
        }
        if (!base) {
            var metaBase = $('meta[name="api-base"]').attr("content");
            if (metaBase && String(metaBase).trim()) base = String(metaBase).trim();
        }
        if (!base) base = "https://localhost:44357";
        if (!base) base = window.location.origin || "";
        return base.replace(/\/+$/, "");
    }

    function fetchGeneratedProductUrl(tile, done) {
        var skuCode = readTileSku(tile);
        if (!skuCode) {
            done("");
            return;
        }

        var query = "skuCode=" + encodeURIComponent(skuCode);
        var base = getQrGenerateBase();
        var candidates = [
            base + "/Generate?" + query,
            base + "/api/ProductQr/Generate?" + query,
            "https://localhost:44357/Generate?" + query,
            "https://localhost:44357/api/ProductQr/Generate?" + query
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
            var proxied = "/api/tile-image?url=" + encodeURIComponent(providers[index]);
            loadImageForPdf(proxied, function(qrImgData) {
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
        var productLink = normalizeProductLink(getTileProductLink(tile));
        var pageW = 210;
        var margin = 12;
        var cardW = pageW - margin * 2;
        var cardH = 56;
        var leftX = margin + 6;
        var qrBox = { x: margin + cardW - 44, y: y + 10, w: 36, h: 36 };
        var productBox = { x: qrBox.x - 48, y: y + 10, w: 40, h: 36 };

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
        pdf.text("Size: " + ((tile.size && tile.size[0]) || "-") + "x" + ((tile.size && tile.size[1]) || "-") + " mm", leftX, y + 26);
        pdf.text("Finish: " + ((tile.filters && (tile.filters["25"] || tile.filters["26"])) || "-"), leftX, y + 32);
        if (card && card.sectionTileCount > 1) {
            pdf.text("Applied tiles in this section: " + card.sectionTileCount, leftX, y + 38);
        }
        pdf.setDrawColor(214, 223, 228);
        pdf.rect(productBox.x, productBox.y, productBox.w, productBox.h);
        pdf.rect(qrBox.x, qrBox.y, qrBox.w, qrBox.h);

        loadImageForPdf(tileImage, function(tileImgData) {
            if (tileImgData && tileImgData.dataUrl) {
                var fit = fitRect(tileImgData.width, tileImgData.height, productBox.w - 2, productBox.h - 2);
                pdf.addImage(tileImgData.dataUrl, "JPEG", productBox.x + 1 + fit.x, productBox.y + 1 + fit.y, fit.w, fit.h);
            } else {
                pdf.setFontSize(9);
                pdf.text("Image unavailable", productBox.x + 6, productBox.y + 16);
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
            pdf.save("Design-with-info.pdf");
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
                pdf.save("Design-with-info.pdf");
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
                printDoc.save("Design.pdf");

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
        render(vis_cvs);
        clearMask();
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

            render(vis_cvs);
        });
        // d = tiles[0];

        // $('input[name="tile_grout_'+d.tile_type+'"]').prop('checked', false);//.checkboxradio( "refresh" );;
        // $('#tile_grout_'+d.tile_type+'_'+d.grout_id).prop('checked', true);//.checkboxradio( "refresh" );;

        updateInfo(tiles);
    }
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

