scene_room_img=null;
scene_shadow_img=null;
scene_foreground_mask_img=null;
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
buildForegroundMask=function(roomImg,overlayImg)
{
    scene_foreground_mask_img=null;
    if(!roomImg || !overlayImg) return;
    if(!roomImg.complete || !overlayImg.complete) return;
    var w=(roomImg.naturalWidth||roomImg.width||overlayImg.naturalWidth||overlayImg.width);
    var h=(roomImg.naturalHeight||roomImg.height||overlayImg.naturalHeight||overlayImg.height);
    if(!w || !h) return;
    var statsFor=function(img){
        var c=document.createElement("canvas");
        c.width=w;c.height=h;
        var t=c.getContext("2d");
        t.drawImage(img,0,0,w,h);
        var d=t.getImageData(0,0,w,h).data;
        var minA=255,maxA=0,sumA=0,count=0;
        for(var i=3;i<d.length;i+=16){
            var a=d[i];
            if(a<minA)minA=a;
            if(a>maxA)maxA=a;
            sumA+=a;
            count++;
        }
        return {min:minA,max:maxA,avg:(count?sumA/count:255)};
    };
    var makeMaskFromAlpha=function(img){
        var src=document.createElement("canvas");
        var out=document.createElement("canvas");
        src.width=out.width=w;
        src.height=out.height=h;
        var sctx=src.getContext("2d");
        var octx=out.getContext("2d");
        sctx.drawImage(img,0,0,w,h);
        var sd=sctx.getImageData(0,0,w,h);
        var od=octx.createImageData(w,h);
        var minAlpha=(typeof window!=="undefined" && typeof window.SCENE_MASK_ALPHA_MIN==="number")
            ? window.SCENE_MASK_ALPHA_MIN
            : 12;
        for(var i=0;i<sd.data.length;i+=4){
            var a=sd.data[i+3];
            if(a>minAlpha){
                od.data[i+3]=255;
            }
        }
        octx.putImageData(od,0,0);
        return out;
    };
    var rs=statsFor(roomImg);
    var os=statsFor(overlayImg);
    var roomHasCutout=(rs.min<250 && rs.avg<250);
    var overlayHasCutout=(os.min<250 && os.avg<250);
    if(roomHasCutout && overlayHasCutout){
        scene_foreground_mask_img=(rs.avg<=os.avg)?makeMaskFromAlpha(roomImg):makeMaskFromAlpha(overlayImg);
        return;
    }
    if(roomHasCutout){
        scene_foreground_mask_img=makeMaskFromAlpha(roomImg);
        return;
    }
    if(overlayHasCutout){
        scene_foreground_mask_img=makeMaskFromAlpha(overlayImg);
        return;
    }
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
    scene_foreground_mask_img=null;
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
            buildForegroundMask(scene_room_img,scene_shadow_img);
            done();
        },done);
    },function(){
        loadSceneImage(shadow_img_paths,function(simg){
            scene_shadow_img=simg;
            buildForegroundMask(scene_room_img,scene_shadow_img);
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
