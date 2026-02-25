scene_room_img=null;
scene_shadow_img=null;
scene_data=null;
scene_id=-1;
scene_data_path=null;
buildSceneImageCandidates=function(path)
{
    if(typeof path!="string") return [path];
    path=path.trim();
    if(path.charAt(0)=="#") path=path.substring(1);
    var out=[];
    var push=function(p){if(typeof p=="string" && p.length && out.indexOf(p)<0) out.push(p);};
    push(path);
    if(/^https?:\/\//i.test(path) || /^data:/i.test(path) || path.indexOf("//")==0) return out;
    if(path.charAt(0)=="/")
    {
        push(path.substring(1));
    }
    else
    {
        push("/"+path.replace(/^\.?\//,""));
    }
    return out;
}
normalizeSceneImagePath=function(path)
{
    if(typeof path!="string") return path;
    path=path.trim();
    if(path.charAt(0)=="#") path=path.substring(1);
    if(/^https?:\/\//i.test(path) || /^data:/i.test(path) || path.indexOf("//")==0) return path;
    if(path.charAt(0)=="/") return path;
    path=path.replace(/^\.?\//,"");
    return "/"+path;
}
loadSceneImage=function(paths,onload,onerror)
{
    if(!(paths instanceof Array)) paths=[paths];
    var i=0;
    var tryNext=function()
    {
        if(i>=paths.length)
        {
            if(typeof onerror=="function") onerror();
            return;
        }
        var src=paths[i++];
        var img=lmage(src,function(){if(typeof onload=="function") onload(img);});
        img.onerror=tryNext;
    };
    tryNext();
}
setScene=function(room,ondone)
{
		console.log(room);
        scene_data=room[2];
        console.log(scene_data);
        if(typeof scene_data!="string")scene_data=JSON.stringify(scene_data||[]);
        try{scene_data=JSON.parse(scene_data);}
        catch(e)
        {
            scene_data=[];
        }
        if(typeof devpan_add_tile_area=="function")
            for(var i in scene_data)
            {
                devpan_add_tile_area(scene_data[i]);
            }
    var room_img_paths=buildSceneImageCandidates(room[0]);
    var shadow_img_paths=buildSceneImageCandidates(room[1]);
    var done_called=false;
    var done=function()
    {
        if(done_called) return;
        done_called=true;
        if(typeof ondone=="function") ondone();
    };
    loadSceneImage(room_img_paths,function(img){
        scene_room_img=img;
        loadSceneImage(shadow_img_paths,function(simg){
            scene_shadow_img=simg;
            done();
        },done);
    },function(){
        loadSceneImage(shadow_img_paths,function(simg){
            scene_shadow_img=simg;
            done();
        },done);
    });
}


renderRoom=function(cvs)
{
	console.log('room');
	var ctx=cvs.getContext("2d");
    if(!scene_room_img || !scene_room_img.complete || !scene_room_img.naturalWidth)return;
	ctx.globalCompositeOperation = "source-over";
	ctx.drawImage(scene_room_img,0,0,cvs.width,cvs.height);
    ctx.globalCompositeOperation = "source-over";
}
renderShadow=function(cvs)
{
    
	console.log('shadow');
	var ctx=cvs.getContext("2d");
    if(!scene_shadow_img || !scene_shadow_img.complete || !scene_shadow_img.naturalWidth)return;
	ctx.save();
    ctx.globalAlpha = 0.99;
	ctx.globalCompositeOperation = "multiply";
	ctx.drawImage(scene_shadow_img,0,0,cvs.width,cvs.height);
    ctx.globalCompositeOperation = "source-over";
	ctx.restore();
}

stuffs={};
// Ensure blend_mode exists globally
if (typeof blend_mode === 'undefined') {
    var blend_mode = (typeof RENDER_BLEND_MODE !== 'undefined') ? RENDER_BLEND_MODE : 1;
}
        
renderStuffs=function(cvs)
{
	console.log('stuffs');
        blendStuffs(cvs,stuffs);
}

