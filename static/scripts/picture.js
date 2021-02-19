var isExtended = true;

function changeImageFit(object) {
    const imgs = document.getElementsByClassName("picture");
    const buttonImg = object.firstChild;
    Array.from(imgs).forEach(img => {
        if (isExtended) {
            var width = img.naturalWidth;
            var height = img.naturalHeight;
            var vPadding = Math.max((width-height)/width/2*100, 0);
            var hPadding = Math.max((height-width)/height/2*100, 0);
            img.style.padding = vPadding+"% "+hPadding+"%";
            // buttonImg.src = "static/images/expand.png";
        } else {
            img.style.padding = 0;
            // buttonImg.src = "static/images/shrink.png";

        }
    });
    buttonImg.src = isExtended ? "static/images/expand.png" : "static/images/shrink.png"
    isExtended = !isExtended;
}