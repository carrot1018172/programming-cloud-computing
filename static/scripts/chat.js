const duration = 200;
const showChat = "showChat"

window.addEventListener('DOMContentLoaded', (event) => {
    const cookies = document.cookie;
    const cookiesArray = cookies.split(';');
    for (var c of cookiesArray) {
        const cArray = c.split('=');
        if (cArray[0] == showChat) {
            if (cArray[1] == 1) {
                $("#chat-checkbox").get()[0].checked = true;
            }
        }
    }
    // document.getElementById("chat-messages").contentWindow.load(true, false);
    checkboxChanged(document.getElementById("chat-checkbox"));
    resized();
});

window.addEventListener("resize", function () {
    resized();
});

function resized() {
    //https://qiita.com/ota-meshi/items/0738f2089009b150134c
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    if ($("#chat-checkbox").get()[0] !== undefined && window.innerWidth <= 600) {
        $("#body").css("padding-bottom", "calc(min(25vmin, 125px) + 100px)");
        $("#footer").css("padding-bottom", "calc(min(25vmin, 125px) + 10px)");
    } else {
        $("#body").css("padding-bottom", "100px");
        $("#footer").css("padding-bottom", "10px");
    }
}

function checkboxChanged(object) {
    if (object.checked) {
        document.cookie = showChat+"="+1+"; SameSite=Lax";
        object.parentNode.id = "chat-opened";
        const iframe = document.getElementById("chat-messages").contentWindow;
        iframe.scrollTo(0, iframe.document.body.scrollHeight);
        // document.getElementById("chat-messages").contentWindow.startFromLoading();
    } else {
        document.cookie = showChat+"="+0+"; SameSite=Lax";
        object.parentNode.id = "chat-closed";
        // document.getElementById("chat-messages").contentWindow.stopFromLoading();
    }
}

function submitMessage(object) {
    const message = object.message.value;
    if (message == "") { return }
    const $form = $(object);
    $.ajax({
        url: $form.attr("action"),
        type: $form.attr('method'),
        data: $form.serialize(),
        beforeSend: function(xhr, settings) {
            object.message.value = "";
        },
        success: function(result, textStatus, xhr) {
            // document.getElementById("chat-messages").contentWindow.load(false, true);
        }
    });
}