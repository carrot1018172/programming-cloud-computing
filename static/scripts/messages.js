const fps = 50;
const resistance = 0.002;
const showAlertPx = 50;
const dayOfWeekArray = ["日", "月", "火", "水", "木", "金", "土"];

var from = Date.now()/1000;
var until = Date.now()/1000;
var beforeTouch = undefined;
var velocity0 = 0;
var beforeTime = undefined;
var storedOldMessages = undefined;
var isWaitingForOldMessages = true;
var hasLoadedFirstMessage = false;
var fromLoadId = undefined;

window.addEventListener('DOMContentLoaded', (event) => {
    no_scroll();
    scrollToBottom();
});

function calculateYFromBottom() {
    return document.getElementsByTagName("body")[0].scrollHeight-(window.scrollY+window.innerHeight)
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
    window.addEventListener('scroll', function(event) {
        if (window.scrollY <= 0) {
            if (hasLoadedFirstMessage) { return }
            if (storedOldMessages == undefined) {
                isWaitingForOldMessages = true;
            } else {
                prependOldMessages(storedOldMessages);
            }
        } else if (calculateYFromBottom() <= 1) {
            document.getElementById("alert-newmes").style.display = "none";
        }
        const scrollBottomA = document.getElementById("scroll-bottom");
        if (calculateYFromBottom() <= 1 ) {
            scrollBottomA.style.display = "none";
        } else {
            scrollBottomA.style.display = "block";
        }
    });
}

function load(repeat=false, isFrom=true) {
    var url = "/messages/fragment?";
    url += isFrom ? "from="+until : "until="+from;
    $.ajax({
        url: url
    }).done(function(data, textStatus, jqXHR) {
        if (jqXHR.status == 200) {
            const [html, times] = makeHtmlFromJson(data);
            updateTime(times[0], times[1]);
            if (isFrom) {
                const shouldShowAlert = appendNewMessages(html);
                if (calculateYFromBottom() < showAlertPx) {
                    scrollToBottom();
                } else if (shouldShowAlert) {
                    document.getElementById("alert-newmes").style.display = "block";
                }
            } else {
                if (isWaitingForOldMessages) {
                    prependOldMessages(html);
                } else {
                    storedOldMessages = html;
                }
            }
        } else if (jqXHR.status == 204) {
            if (!isFrom) {
                hasLoadedFirstMessage = true;
            }
        }
        if (repeat) {
            fromLoadId = setTimeout(load, 2000, true);
        }
    }).fail(function() {
    }).always(function() {
        isWaitingForOldMessages = false;
    });
}

function appendNewMessages(html) {
    $("body").append(html);
    parent = document.getElementById("new-messages");
    deleteSenderIfNeeded();
    const shouldShowAlert = Array.prototype.filter.call(parent.childNodes, child => { return child.id == "" && child.className == "" }).length > 0
    $(parent.firstChild).unwrap();
    return shouldShowAlert;
}

function prependOldMessages(html) {
    $("body").prepend(html);
    parent = document.getElementById("new-messages");
    storedOldMessages = undefined;
    deleteSenderIfNeeded();
    window.scrollTo(0, window.scrollY+parent.offsetHeight);
    $(parent.firstChild).unwrap();
    load(false, false);
}

function makeHtmlFromJson(data) {
    data = JSON.parse(data);
    const messages = data["messages"];
    const members = data["members"];
    const loginaccount = data["loginaccount"];
    var newMessagesDiv = document.createElement("div");
    newMessagesDiv.id = "new-messages";
    messages.forEach(function(message) {
        const sender = message["sender"];
        const time = new Date(message["time"]*1000);
        const isSelf = sender == loginaccount;
        var div1 = document.createElement("div");
        if (isSelf) {
            div1.id = "frame-self";
        }
        var memberDiv = document.createElement("div");
        memberDiv.className = "member";
        memberDiv.dataset.identifier = sender;
        memberDiv.innerHTML = members[sender] ?? "Unknown";
        var div2 = document.createElement("div");
        var messageDiv = document.createElement("div");
        messageDiv.id = "message";
        messageDiv.innerHTML = message["message"];
        var dateFrameDiv = document.createElement("div");
        dateFrameDiv.className = "date-frame"
        var dateDiv = document.createElement("div");
        dateDiv.className = "date";
        const dayOfWeek = dayOfWeekArray[time.getDay()];
        dateDiv.innerHTML = (time.getMonth()+1)+"/"+time.getDate()+"("+dayOfWeek+")";
        var timeDiv = document.createElement("div");
        timeDiv.className = "time";
        const hours = ("00"+time.getHours()).slice(-2);
        const minutes = ("00"+time.getMinutes()).slice(-2);
        timeDiv.innerHTML = hours+":"+minutes;
        dateFrameDiv.appendChild(dateDiv);
        div1.appendChild(memberDiv);
        if (isSelf) {
            div2.appendChild(timeDiv);
            div2.appendChild(messageDiv);
        } else {
            div2.appendChild(messageDiv);
            div2.appendChild(timeDiv);
        }
        div1.appendChild(div2);
        newMessagesDiv.appendChild(dateFrameDiv);
        newMessagesDiv.appendChild(div1);
    });
    const times = [messages[0]["time"], messages.slice(-1)[0]["time"]];
    return [newMessagesDiv, times]
}

function updateTime(newFrom, newUntil) {
    from = Math.min(from, newFrom);
    until = Math.max(until, newUntil);
}

function deleteSenderIfNeeded() {
    const members = Array.prototype.filter.call(document.getElementsByClassName("member"), function(e) {
        return e.style.display != "none";
    });
    for (var i = 1; i < members.length; i++) {
        if (members[i-1].dataset.identifier == members[i].dataset.identifier) {
            members[i].style.display = "none";
        }
    }
    const dates = Array.prototype.filter.call(document.getElementsByClassName("date"), function(e) {
        return e.style.display != "none";
    });
    for (var i = 1; i < dates.length; i++) {
        if (dates[i-1].innerHTML == dates[i].innerHTML) {
            dates[i].parentNode.style.display = "none";
        }
    }
}

//https://programming.sincoston.com/no-scroll-pc-mobile/
//https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily

// var domMouseScroll = "DOMMouseScroll";
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
var touchStart = "touchstart";
var touchMove = "touchmove";
var touchEnd = "touchend";
var touchCancel = "touchcancel";
function no_scroll() {
    document.addEventListener(wheelEvent, scroll_control, { passive: false });
    document.addEventListener(touchStart, startScroll, { passive: false });
    document.addEventListener(touchMove, scroll_control, { passive: false });
    document.addEventListener(touchEnd, endScroll, { passive: false });
    document.addEventListener(touchCancel, endScroll, { passive: false });
}

function startScroll(event) {
    velocity0 = 0;
}

function scroll_control(event) {
    switch (event.type) {
        case wheelEvent:
            if (isWaitingForOldMessages) {
                event.preventDefault();
                window.scrollTo(0, 0);
            }
            break;
        case touchMove:
            event.preventDefault();
            const currentTouch = event.touches[0];
            if (beforeTouch !== undefined) {
                window.scrollTo(0, window.scrollY-currentTouch.clientY+beforeTouch.clientY);
                velocity0 = (currentTouch.clientY-beforeTouch.clientY)/(Date.now()-beforeTime);
            }
            beforeTouch = currentTouch;
            beforeTime = Date.now();
            break;
    }
}

function endScroll() {
    beforeTouch = undefined;
    setTimeout(setInertia, 1000/fps, [Date.now(), Date.now()]);
}

function setInertia(arguments) {
    let startT, beforeT;
    [startT, beforeT] = arguments;
    const currentT = Date.now();
    deltaY = velocity(currentT-startT)*(currentT-beforeT);
    if (Math.abs(deltaY) < 1) {
        velocity0 = 0;
    } else {
        window.scrollBy(0, -deltaY);
        if (calculateYFromBottom() <= 0) {
            velocity0 = 0;
        } else {
            setTimeout(setInertia, 1000/fps, [startT, currentT]);
        }
    }
}

function velocity(time) {
    return velocity0*Math.exp(-resistance*time);
}

// function startFromLoading() {
//     load(true);
// }

// function stopFromLoading() {
//     clearTimeout(fromLoadId);
// }

// load(false, false);

load(true, false);
