(function(global) {
    global.getCommonGroutModalsHtml = function() {
        return `
<!-- Grout Modal -->
<div class="modal fade" id="grouts-section-1" tabindex="-1" role="dialog" aria-labelledby="grouts-section-1-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="grouts-section-1-label">Select Grout</h4>
            </div>
            <div class="modal-body">
                <form action="" onsubmit="return false;" autocomplete="off">
                    <div class="row" align="center">
                        <div class="grout_color_box">
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,-1);" name="tile_grout_1" id="tile_grout_1_null">
                                <label class="grout-type-label" data-hint="No Grouth" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_null">
                                    <div style='display:inline-block;width:50px;height:50px;margin:3px;padding:3px;border-radius:3px 3px 3px 3px;border:1px solid gray;'>No Grout</div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,1);" data-color="#aeaeae" name="tile_grout_1" id="tile_grout_1_1" checked>
                                <label class="grout-type-label" data-hint="Gray" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_1">
                                    <div alt="Gray" title="Gray" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#aeaeae;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,2);" data-color="#000000" name="tile_grout_1" id="tile_grout_1_2">
                                <label class="grout-type-label" data-hint="Black" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_2">
                                    <div alt="Black" title="Black" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#000000;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,3);" data-color="#ffffff" name="tile_grout_1" id="tile_grout_1_3">
                                <label class="grout-type-label" data-hint="White" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_3">
                                    <div alt="White" title="White" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#ffffff;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,4);" data-color="#894545" name="tile_grout_1" id="tile_grout_1_4">
                                <label class="grout-type-label" data-hint="Brown" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_4">
                                    <div alt="Brown" title="Brown" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#894545;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,5);" data-color="#ffffd2" name="tile_grout_1" id="tile_grout_1_5">
                                <label class="grout-type-label" data-hint="Cream" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_5">
                                    <div alt="Cream" title="Cream" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#ffffd2;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,6);" data-color="#2f3e17" name="tile_grout_1" id="tile_grout_1_6">
                                <label class="grout-type-label" data-hint="Wood" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_6">
                                    <div alt="Wood" title="Wood" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#2f3e17;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(1,7);" data-color="#575757" name="tile_grout_1" id="tile_grout_1_7">
                                <label class="grout-type-label" data-hint="Dark Gray" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_1_7">
                                    <div alt="Dark Gray" title="Dark Gray" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#575757;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
                <button class="btn btn-default btn-sm custom_primery_btn" type="button">Select</button>
            </div>
        </div>
    </div>
</div>
<!-- Grout Modal -->
<div class="modal fade" id="grouts-section-2" tabindex="-1" role="dialog" aria-labelledby="grouts-section-2-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="grouts-section-2-label">Select Grout</h4>
            </div>
            <div class="modal-body">
                <form action="" onsubmit="return false;" autocomplete="off">
                    <div class="row" align="center">
                        <div class="grout_color_box">
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,-1);" name="tile_grout_2" id="tile_grout_2_null">
                                <label class="grout-type-label" data-hint="No Grouth" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_null">
                                    <div style='display:inline-block;width:50px;height:50px;margin:3px;padding:3px;border-radius:3px 3px 3px 3px;border:1px solid gray;'>No Grout</div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,1);" data-color="#aeaeae" name="tile_grout_2" id="tile_grout_2_1" checked>
                                <label class="grout-type-label" data-hint="Gray" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_1">
                                    <div alt="Gray" title="Gray" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#aeaeae;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,2);" data-color="#000000" name="tile_grout_2" id="tile_grout_2_2">
                                <label class="grout-type-label" data-hint="Black" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_2">
                                    <div alt="Black" title="Black" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#000000;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,3);" data-color="#ffffff" name="tile_grout_2" id="tile_grout_2_3">
                                <label class="grout-type-label" data-hint="White" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_3">
                                    <div alt="White" title="White" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#ffffff;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,4);" data-color="#894545" name="tile_grout_2" id="tile_grout_2_4">
                                <label class="grout-type-label" data-hint="Brown" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_4">
                                    <div alt="Brown" title="Brown" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#894545;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,5);" data-color="#ffffd2" name="tile_grout_2" id="tile_grout_2_5">
                                <label class="grout-type-label" data-hint="Cream" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_5">
                                    <div alt="Cream" title="Cream" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#ffffd2;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,6);" data-color="#2f3e17" name="tile_grout_2" id="tile_grout_2_6">
                                <label class="grout-type-label" data-hint="Wood" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_6">
                                    <div alt="Wood" title="Wood" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#2f3e17;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                            <span>
                                <input type="radio" class="grout-type-input" onchange="if(this.checked)selectGrout(2,7);" data-color="#575757" name="tile_grout_2" id="tile_grout_2_7">
                                <label class="grout-type-label" data-hint="Dark Gray" style="display:inline-block;width:auto;cursor:pointer;" for="tile_grout_2_7">
                                    <div alt="Dark Gray" title="Dark Gray" style="display:inline-block;margin:3.7px;border-radius:3.7px;background-color:#575757;border:1.3px solid black;width:37px;height:37px;"></div>
                                </label>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
                <button class="btn btn-default btn-sm custom_primery_btn" type="button">Select</button>
            </div>
        </div>
    </div>
</div>`;
    };
})(window);

(function(global) {
    global.getCommonFilterModalsHtml = function() {
        return `
<!-- Filter Modal -->
<div class="modal fade" id="filter-section-1" tabindex="-1" role="dialog" aria-labelledby="filter-section-label-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="filter-section-label-1">Filter</h4>
            </div>
            <div class="modal-body">
                <form action="#" class="form-horizontal filter_form" autocomplete="off" onsubmit="return false;">
                    <div style="display:none;">
                        <div class="form-group">
                            <label for="filter-category-a-1" class="col-sm-3 control-label">Category</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-category-a" data-id="1" id="filter-category-a-1">
                                    <option selected="selected" value="-1">-All-</option>
                                    <option value='12'>Tiles</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group gray_bg">
                            <label for="filter-category-b-1" class="col-sm-3 control-label">Colour</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-category-b" data-id="1" id="filter-category-b-1"></select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="filter-size-1" class="col-sm-3 control-label">Size</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-size" data-id="1" id="filter-size-1"></select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-23" class="col-sm-3 control-label">Size</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=23]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=23]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=23]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="23" data-min=0 data-max=1 value='300x450mm'/>300x450mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="23" data-min=0 data-max=1 value='300x600mm'/>300x600mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="23" data-min=0 data-max=1 value='300x900mm'/>300x900mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="23" data-min=0 data-max=1 value='200x200mm'/>200x200mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="23" data-min=0 data-max=1 value='Others'/>Others
                            </span>
                        </div>
                    </div>
                    <div class="form-group gray_bg">
                        <label for="filter-25" class="col-sm-3 control-label">Finish</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=25]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=25]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=25]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="25" data-min=0 data-max=1 value='Glossy'/>Glossy
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="25" data-min=0 data-max=1 value='Matt'/>Matt
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="25" data-min=0 data-max=1 value='Elevation'/>Elevation
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="25" data-min=0 data-max=1 value='Random'/>Random
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="25" data-min=0 data-max=1 value='Others'/>Others
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-27" class="col-sm-3 control-label">Product Type</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=27]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=27]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=27]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="27" data-min=0 data-max=1 value='Tiles'/>Tiles
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="27" data-min=0 data-max=1 value='Wallpapers'/>Wallpapers
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="27" data-min=0 data-max=1 value='Paint Color'/>Paint Color
                            </span>
                        </div>
                    </div>
                    <div class="form-group gray_bg">
                        <label for="filter-31" class="col-sm-3 control-label">Sanita wall</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=31]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=31]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=31]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="31" data-min=0 data-max=1 value='wall'/>wall
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-29" class="col-sm-3 control-label">Price</label>
                        <div class="col-sm-9">
                            <input type="text" data-filter-input-id="29" readonly style="width:100%; border:0; color:#f6931f; font-weight:bold;">
                            <hr/>
                            <div data-for="filter" data-filter-type="number" data-filter-id="29"></div>
                            <script>
                                $(function() {
                                    $("[data-filter-id=29]", $("#filter-section-1")).slider({
                                        range: true,
                                        min: 0,
                                        max: 1,
                                        values: [0, 1],
                                        slide: function(event, ui) {
                                            update_filter_text_1_29(ui.values[0], ui.values[1]);
                                        }
                                    });
                                });

                                update_filter_1_29 = function(min, max, v_min, v_max) {
                                    $("[data-filter-id=29]", $("#filter-section-1")).slider("option", "min", min);
                                    $("[data-filter-id=29]", $("#filter-section-1")).slider("option", "max", max);
                                    $("[data-filter-id=29]", $("#filter-section-1")).slider("option", "values", [v_min, v_max]);
                                    update_filter_text_1_29(v_min, v_max);
                                }
                                update_filter_text_1_29 = function(v_min, v_max) {
                                    $('[data-filter-input-id=29]', $("#filter-section-1")).val('Minimum: ' + v_min + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + 'Maximum: ' + v_max);

                                    $('[data-filter-input-id=29]', $("#filter-section-1")).attr('data-min', v_min);
                                    $('[data-filter-input-id=29]', $("#filter-section-1")).attr('data-max', v_max);
                                }
                            </script>
                        </div>
                    </div>
                </form>
               
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
                <button data-key='1' class="apply-filter btn btn-default btn-sm custom_primery_btn" type="button">Apply Filter</button>
            </div>
        </div>
    </div>
</div>
<script>

    $(function() {
        init_number_filters('1');
        applyFilter('1');
    });
</script>
<!-- Filter Modal -->
<div class="modal fade" id="filter-section-2" tabindex="-1" role="dialog" aria-labelledby="filter-section-label-2" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="filter-section-label-2">Filter</h4>
            </div>
            <div class="modal-body">
                <form action="#" class="form-horizontal filter_form" autocomplete="off" onsubmit="return false;">
                    <div style="display:none;">
                        <div class="form-group">
                            <label for="filter-category-a-2" class="col-sm-3 control-label">Category</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-category-a" data-id="2" id="filter-category-a-2">
                                    <option selected="selected" value="-1">-All-</option>
                                    <option value='20'>Random Tiles</option>
                                    <option value='12'>Tiles</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group gray_bg">
                            <label for="filter-category-b-2" class="col-sm-3 control-label">Colour</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-category-b" data-id="2" id="filter-category-b-2"></select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="filter-size-2" class="col-sm-3 control-label">Size</label>
                            <div class="col-sm-9">
                                <select class="form-control filter-size" data-id="2" id="filter-size-2"></select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-24" class="col-sm-3 control-label">Size</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=24]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=24]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=24]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="24" data-min=0 data-max=1 value='300x300mm'/>300x300mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="24" data-min=0 data-max=1 value='400x400mm'/>400x400mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="24" data-min=0 data-max=1 value='600x600mm'/>600x600mm
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="24" data-min=0 data-max=1 value='Others'/>Others
                            </span>
                        </div>
                    </div>
                    <div class="form-group gray_bg">
                        <label for="filter-26" class="col-sm-3 control-label">Finish</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=26]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=26]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=26]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Glossy'/>Glossy
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Matt'/>Matt
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Rustic'/>Rustic
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Wooden'/>Wooden
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Marble'/>Marble
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Random'/>Random
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="26" data-min=0 data-max=1 value='Others'/>Others
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-28" class="col-sm-3 control-label">Product Type</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=28]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=28]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=28]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="28" data-min=0 data-max=1 value='Tiles'/>Tiles
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="28" data-min=0 data-max=1 value='Carpets'/>Carpets
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="28" data-min=0 data-max=1 value='Wooden Flooring'/>Wooden Flooring
                            </span>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="28" data-min=0 data-max=1 value='Marbles'/>Marbles
                            </span>
                        </div>
                    </div>
                    <div class="form-group gray_bg">
                        <label for="filter-32" class="col-sm-3 control-label">Sanita Floor</label>
                        <div class="col-sm-9">
                            <a href='javascript:filter_select($("input[data-filter-id=32]"),"true")'>All</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=32]"),"false")'>None</a>
                            ,
                                            <a href='javascript:filter_select($("input[data-filter-id=32]"),"!$")'>Invert</a>
                            <hr/>
                            <span style='display:inline-block; padding:8px 15px; width: 45%;'>
                                <input style='display:inline-block;width:auto;margin-right: 7px;' type='checkbox' checked data-for="filter" data-filter-type="option" data-filter-id="32" data-min=0 data-max=1 value='Floor'/>Floor
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="filter-30" class="col-sm-3 control-label">Price</label>
                        <div class="col-sm-9">
                            <input type="text" data-filter-input-id="30" readonly style="width:100%; border:0; color:#f6931f; font-weight:bold;">
                            <hr/>
                            <div data-for="filter" data-filter-type="number" data-filter-id="30"></div>
                            <script>
                                $(function() {
                                    $("[data-filter-id=30]", $("#filter-section-2")).slider({
                                        range: true,
                                        min: 0,
                                        max: 1,
                                        values: [0, 1],
                                        slide: function(event, ui) {
                                            update_filter_text_2_30(ui.values[0], ui.values[1]);
                                        }
                                    });
                                });

                                update_filter_2_30 = function(min, max, v_min, v_max) {
                                    $("[data-filter-id=30]", $("#filter-section-2")).slider("option", "min", min);
                                    $("[data-filter-id=30]", $("#filter-section-2")).slider("option", "max", max);
                                    $("[data-filter-id=30]", $("#filter-section-2")).slider("option", "values", [v_min, v_max]);
                                    update_filter_text_2_30(v_min, v_max);
                                }
                                update_filter_text_2_30 = function(v_min, v_max) {
                                    $('[data-filter-input-id=30]', $("#filter-section-2")).val('Minimum: ' + v_min + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + 'Maximum: ' + v_max);

                                    $('[data-filter-input-id=30]', $("#filter-section-2")).attr('data-min', v_min);
                                    $('[data-filter-input-id=30]', $("#filter-section-2")).attr('data-max', v_max);
                                }
                            </script>
                        </div>
                    </div>
                </form>
        
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
                <button data-key='2' class="apply-filter btn btn-default btn-sm custom_primery_btn" type="button">Apply Filter</button>
            </div>
        </div>
    </div>
</div>
<script>

    $(function() {
        init_number_filters('2');
        applyFilter('2');
    });
</script>
</div>
`;
    };
})(window);

(function(global) {
    global.getCommonSaveShareModalsHtml = function() {
        return `
<div class="modal_save modal fade" id="modal_save" tabindex="-1" role="dialog" aria-labelledby="save-design-dialog-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="save-design-dialog-label">Save Design</h4>
            </div>
            <div class="modal-body">
                <div class="row" align="center">
                    <a class="btn btn-default btn-sm custom_primery_btn save-design stack-item" data-as="image">Save Design as image</a>
                    <a class="btn btn-default btn-sm custom_primery_btn save-design stack-item" data-as="info-pdf">Save with info as PDF</a>
                    <a class="btn btn-default btn-sm custom_primery_btn save-design stack-item" data-as="link">Save Design for later</a>
                </div>
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
<div class="modal_share modal fade" id="modal_share" tabindex="-1" role="dialog" aria-labelledby="share-dialog-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom_modal_header">
                <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title custom_modal_title" id="share-dialog-label">Share</h4>
            </div>
            <div class="modal-body">
                <div class="row share-actions" align="center">
                    <a href="#" class="fa fa-facebook share-link" title="Share on Facebook" aria-label="Share on Facebook" data-service="facebook" data-dismiss="modal">
                        <span class="share-label">Facebook</span>
                    </a>
                    <a href="#" class="fa fa-twitter share-link" title="Share on Twitter" aria-label="Share on Twitter" data-service="twitter" data-dismiss="modal">
                        <span class="share-label">Twitter</span>
                    </a>
                    <a href="#" class="fa fa-google-plus share-link" title="Share on Google Plus" aria-label="Share on Google Plus" data-service="google" data-dismiss="modal">
                        <span class="share-label">Google+</span>
                    </a>
                </div>
            </div>
            <div class="modal-footer custome_modal_footer">
                <button class="btn btn-default btn-sm custom_default_btn" type="button" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>`;
    };
})(window);

(function(global) {
    global.getCommonMailModalHtml = function(formAction) {
        var action = typeof formAction === "string" ? formAction : "";
        return `
<div class="modal fade" id="modal_mail" tabindex="-1" role="dialog" aria-labelledby="mail-dialog-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <form name="mailform" id="mailform" method="post" action="${action}">
                <div class="modal-header custom_modal_header">
                    <button type="button" class="close custom_modal_btn" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title custom_modal_title" id="mail-dialog-label">Email</h4>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <input type="text" placeholder="Your Full Name" name="full_name" class="full_name form-control"/>
                    </div>
                    <div class="form-group">
                        <input type="text" placeholder="Recipient's Email Address" name="to" class="to form-control"/>
                    </div>
                    <div class="form-group">
                        <input type="text" placeholder="Subject" name="subject" class="subject form-control"/>
                    </div>
                    <div class="form-group">
                        <textarea name="message" placeholder="Write your message here" class="message form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer custome_modal_footer">
                    <input type="submit" id="sendMail" value="Send" name="submit" class="btn btn-default btn-sm custom_default_btn">
                </div>
            </form>
        </div>
    </div>
</div>`;
    };
})(window);


/* ======================================================
   GLOBAL FILTER SELECT (SAFE VERSION)
====================================================== */

window.filter_select = function (inputs, mode) {
    if (!inputs || !inputs.length) return;

    var modal = inputs.first().closest(".modal");
    if (!modal.length) return;

    var key = modal.attr("id").replace("filter-section-", "");

    inputs.each(function () {
        if (mode === "true") {
            this.checked = true;
        } else if (mode === "false") {
            this.checked = false;
        } else if (mode === "!$") {
            this.checked = !this.checked;
        }
    });

    inputs.trigger("change");

    if (typeof refreshFilterVisualState === "function") {
        refreshFilterVisualState(key);
    }

    if (typeof applyFilter === "function") {
        applyFilter(key);
    }
};
