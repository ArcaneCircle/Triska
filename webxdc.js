window.webxdc = (() => {
    var updateListener = () => {};
    var updatesKey = "__xdcUpdatesKey__";
    window.addEventListener('storage', (event) => {
        if (event.key == null) {
            window.location.reload();
        } else if (event.key == updatesKey) {
            const updates = JSON.parse(event.newValue);
            const update = updates[updates.length-1];
            console.log("[WEBXDC] " + JSON.stringify(update));
            updateListener(update);
        }
    });

    return {
        selfAddr: () => {
            var params = new URLSearchParams(window.location.hash.substr(1));
            return params.get("addr") || "device0@local.host";
        },
        selfName: () => {
            var params = new URLSearchParams(window.location.hash.substr(1));
            return params.get("name") || "device0";
        },
        setUpdateListener: (cb) => (updateListener = cb),
        getAllUpdates: () => {
            var updatesJSON = window.localStorage.getItem(updatesKey);
            return updatesJSON ? JSON.parse(updatesJSON) : [];
        },
        sendUpdate: (description, payload) => {
            // alert(description+"\n\n"+JSON.stringify(payload));
            var update = {payload: payload};
            console.log('[WEBXDC] description="' + description + '" ' + JSON.stringify(update));
            updateListener(update);
            var updatesJSON = window.localStorage.getItem(updatesKey);
            var updates = updatesJSON ? JSON.parse(updatesJSON) : [];
            updates.push(update);
            window.localStorage.setItem(updatesKey, JSON.stringify(updates));
        },
    };
})();

window.addXdcPeer = () => {
    var loc = window.location;
    // get peer count
    var params = new URLSearchParams(loc.hash.substr(1));
    var peerId = (Number(params.get("peer_count")) || 0) + 1;

    // open a new window
    var peerName = "device" + peerId;
    var url = loc.protocol + "//" + loc.host + loc.pathname + "#name=" + peerName + "&addr=" + peerName + "@local.host";
    window.open(url);

    // update peer count
    params.set("peer_count", peerId);
    window.location.hash = "#" + params.toString();
}

window.clearXdcStorage = () => {
    window.localStorage.clear();
    window.location.reload();
}

window.alterXdcApp = () => {
    var styleControlPanel = 'position: fixed; bottom:1em; left:1em; background-color: #000; opacity:0.8; padding:.5em; font-family: sans-serif;color:#fff;';
    var styleMenuLink = 'color:#fff; text-decoration: none;';
    var title = document.getElementsByTagName('title')[0];
    if (typeof title == 'undefined') {
        title = document.createElement('title');
        document.getElementsByTagName('head')[0].append(title);
    }
    title.innerText = window.webxdc.selfAddr();

    if (window.webxdc.selfName() == "device0") {
        var div = document.createElement('div');
        div.innerHTML =
            '<div style="' + styleControlPanel + '">' +
            '<a href="javascript:window.addXdcPeer();" style="' + styleMenuLink + '">Add Peer</a> | ' +
            '<a href="javascript:window.clearXdcStorage();" style="' + styleMenuLink + '">Clear Storage</a>' +
            '<div>';
        document.getElementsByTagName('body')[0].append(div.firstChild);
    }
}

window.addEventListener("load", window.alterXdcApp);