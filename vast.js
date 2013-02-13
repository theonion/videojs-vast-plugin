/* Node helpers */
function getNodeAttr(node, nodeName, attrName) {
    var nodes = node.getElementsByTagName(nodeName);
    if(nodes) {
        return nodes[0].getAttribute(attrName);
    } else {
        return undefined;
    }
}

function getNodeText(node, nodeName) {
    var nodes = node.getElementsByTagName(nodeName);
    if(nodes) {
        return nodes[0].textContent;
    } else {
        return undefined;
    }
}

/**************************************/
/* Objects to hold the VAST node data */
/**************************************/

function compareMediaFiles(a, b) {
    var types = {
        'video/mp4': 3,
        'video/webm': 3,
        'video/ogv': 3,
        'video/flv': 2,
        'video/x-flv': 2
    };

    var atype = types[a.type] || 0;
    var btype = types[b.type] || 0;

    if (atype > btype)
        return -1;
    if (atype < btype)
        return 1;

    if(a.width > b.width)
        return -1;
    if(a.width < b.width)
        return 1;

    return 0;
}

function Linear(node) {
    this.sequence = node.parentNode.getAttribute('sequence');

    this.duration = getNodeText(node, 'Duration');

    this.trackingEvents = {};
    var nodes = node.getElementsByTagName('Tracking');
    for (var i=0;i<nodes.length;i++) {
        this.trackingEvents[nodes[i].getAttribute('event')] = nodes[i].textContent;
    }

    this.mediaFiles = [];
    nodes = node.getElementsByTagName('MediaFile');
    for (var j=0;j<nodes.length;j++) {
        var mediaFile = {
            id: nodes[j].getAttribute('id'),
            delivery: nodes[j].getAttribute('delivery'),
            src: nodes[j].textContent,
            type: nodes[j].getAttribute('type'),
            bitrate: nodes[j].getAttribute('bitrate'),
            width: parseInt(nodes[j].getAttribute('width')),
            height: parseInt(nodes[j].getAttribute('height'))
        };
        this.mediaFiles.push(mediaFile);
    }

    this.mediaFiles.sort(compareMediaFiles);

    this.sources = function(width, types) {
        types = types || ['video/webm', 'video/mp4', 'video/ogv'];
        
        var typeSources = {};
        for(var i=0;i<this.mediaFiles.length;i++) {
            var thisType = this.mediaFiles[i].type;
            var thisSrc = this.mediaFiles[i].src;

            if (types.indexOf(thisType) >= 0) {
                if(typeSources[thisType] === undefined) {
                    typeSources[thisType] = thisSrc;
                } else {
                    if (width && this.mediaFiles[i].width < width) {
                        typeSources[thisType] = thisSrc;
                    }
                }
            }
        }

        var sourcesArray = [];
        for(var j=0;j<types.length;j++) {
            if(typeSources[types[j]] !== undefined) {
                sourcesArray.push({
                    src: typeSources[types[j]],
                    type: types[j]
                });
            }
        }
        return sourcesArray;
    };
}

function Inline(node) {
    this.version = getNodeAttr(node, 'AdSystem', 'version');

    this.title =  getNodeText(node, 'AdTitle');
    this.description = getNodeText(node, 'Description');

    this.impressions = {};
    var nodes = node.getElementsByTagName('TrackingEvent');
    for (var i=0;i<nodes.length;i++) {
        this.impressions[nodes[i].getAttribute('id')] = nodes[i].textContent;
    }

    this.linear;
    this.nonLinearAds = [];
    this.companionAds = [];

    // Get the <Linear> creatives.
    nodes = node.getElementsByTagName('Linear');
    if (nodes.length > 0) {
        this.linear = new Linear(nodes[0]);
    }

}

function Ad(node) {
    this.id = node.getAttribute('id');
    this.inlines = [];
    var nodes = node.getElementsByTagName('InLine');
    for (var i=0;i<nodes.length;i++) {
        var inline = new Inline(nodes[i]);
        this.inlines.push(inline);
    }

    this.sources = function(width, types) {
        if(this.inlines.length > 0) {
            if(this.inlines[0].linear !== undefined) {
                return this.inlines[0].linear.sources(width, types);
            }
        }
        return [];
    };
}

function skipAd() {

}

function fetchVAST(url, cbk) {
    var httpRequest;
    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE
        try {
            httpRequest = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (e) {
            try {
                httpRequest = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (e) {}
        }
    }

    if (!httpRequest) {
      console.log('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }
    if(cbk !== undefined) {
        httpRequest.onreadystatechange = function() {
            if(this.readyState === 4) {
                var ads = [];

                var xml = this.responseXML;
                var adNodes = xml.getElementsByTagName('Ad');
                for (var i=0;i<adNodes.length;i++) {
                    var ad = new Ad(adNodes[i]);
                    ads.push(ad);
                }
                cbk && cbk(ads);
            }
        };
    }
    httpRequest.open('GET', url);
    httpRequest.send();
}
