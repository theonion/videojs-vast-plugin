/* Node helpers */
function getNodeAttr(node, nodeName, attrName) {
    var nodes = node.getElementsByTagName(nodeName);
    if(nodes.length) {
        return nodes[0].getAttribute(attrName);
    } else {
        return undefined;
    }
}

function getNodeText(node, nodeName) {
    var nodes = node.getElementsByTagName(nodeName);
    if(nodes.length) {
        return nodes[0].textContent;
    } else {
        return undefined;
    }
}

/**************************************/
/* Objects to hold the VAST node data */
/**************************************/

// JS compare function to sort the medidafiles, so that we can seelct the "best" ones.
function compareMediaFiles(a, b) {
    // We prefer mp4, webm or ogv, obvs.
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
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /* The following attributes are available for the <Creative> (parent of <Linear>) element: */
    // id: an ad server-defined identifier for the creative
    this.id = node.parentNode.getAttribute('id');
    // sequence: the numerical order in which each sequenced creative should display
    this.sequence = node.parentNode.getAttribute('sequence');
    // adId: identifies the ad with which the creative is served
    this.adId = node.parentNode.getAttribute('adId');
    // apiFramework: the technology used for any included API
    this.apiFramework = node.parentNode.getAttribute('apiFramework');
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    /* The ad duration of a Linear creative is expressed in the <Duration> element. Duration
     * is expressed in the “HH:MM:SS.mmm” format (.mmm represents milliseconds and is optional). */
    this.duration = getNodeText(node, 'Duration');

    /* A <Linear> element may optionally contain a <VideoClicks> element, which is used to
     * specify what the video player should do if the user clicks directly within the video
     * player frame while the ad is being displayed. If a <VideoClicks> element is provided,
     * it must contain a single child <ClickThrough> element, and optionally contain one or
     * more child <ClickTracking> and <CustomClick> elements. */
    if(node.getElementsByTagName('VideoClicks').length > 0) {
        var clicksNode = node.getElementsByTagName('VideoClicks')[0];
        this.clickThrough = clicksNode.getElementsByTagName('ClickThrough')[0].textContent;

        this.clickTracking = [];
        nodes = clicksNode.getElementsByTagName('ClickTracking');
        for (var i=0;i<nodes.length;i++) {
            this.clickTracking.push(nodes[i].textContent);
        }
        // TODO: Implement CustomClick?
    }

    /* The <TrackingEvents> element may contain one or more <Tracking> elements. An event
     * attribute for the <Tracking> element enables ad servers to include individual tracking
     * URIs for events they want to track. */
    this.tracking = {};
    if(node.getElementsByTagName('TrackingEvents').length > 0) {
        var trackingEventsNode = node.getElementsByTagName('TrackingEvents')[0];
        nodes = trackingEventsNode.getElementsByTagName('Tracking');
        for (var j=0;j<nodes.length;j++) {
            var eventName = nodes[j].getAttribute('event');
            if (this.tracking[eventName] === undefined) {
                this.tracking[eventName] = [];
            }
            this.tracking[eventName].push(nodes[j].textContent);
        }
    }


    /* The <MediaFiles> element is a container for one or more <MediaFile> elements, each of
     * which contains a CDATA--wrapped URI to the media file to be downloaded or streamed for
     * the Linear creative. Linear creative are typically video files, but static images may
     * also be used.
     *
     * A <MediaFiles> element may contain multiple <MediaFile> elements, each one best suited to
     * a different technology or device. When an ad may be served to multiple video platforms,
     * one platform (i.e. device) may need the media file in a different format than what another
     * platform needs. More specifically, different devices are capable of displaying video files
     * with different encodings and containers, and at different bitrates.
     *
     * Thus, for ads delivered cross--platform, the VAST document usually contains multiple
     * alternative <MediaFile> elements, each with different container--codec versions and at a
     * few different bitrates. Only the media file best matched to the video player system should
     * be displayed. The creative content should be the same for each media file. */
    this.mediaFiles = [];
    nodes = node.getElementsByTagName('MediaFile');
    for (var k=0;k<nodes.length;k++) {
        var mediaFile = {
            id: nodes[k].getAttribute('id'),
            delivery: nodes[k].getAttribute('delivery'),
            src: nodes[k].textContent,
            type: nodes[k].getAttribute('type'),
            bitrate: nodes[k].getAttribute('bitrate'),
            width: parseInt(nodes[k].getAttribute('width'), 10),
            height: parseInt(nodes[k].getAttribute('height'), 10)
        };
        this.mediaFiles.push(mediaFile);
    }
    // We sort the video files by order of preference (HTML5-safe formats first)
    this.mediaFiles.sort(compareMediaFiles);

    // Given the media files we have, what souces should VideoJS try to use?
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


function InLine(node) {
    this.id = node.getAttribute('id');

    node = node.getElementsByTagName('InLine')[0];

    // Required elements
    this.adSystem = getNodeText(node, 'AdSystem');
    this.title =  getNodeText(node, 'AdTitle');
    
    this.creatives = [];
    nodes = node.getElementsByTagName('Creative');
    for (i=0;i<nodes.length;i++) {
        var childNode = nodes[i].firstElementChild;
        if(childNode.localName === "Linear") {
            this.creatives.push(new Linear(childNode));
        }
        // TODO: Implement NonLinear, CompanionAds
    }

    this.impressions = [];
    var nodes = node.getElementsByTagName('Impression');
    for (var i=0;i<nodes.length;i++) {
        this.impressions.push(nodes[i].textContent);
    }

    // Optional elements
    this.description = getNodeText(node, 'Description');
    this.advertiser = getNodeText(node, 'Advertiser');
    this.survey = getNodeText(node, 'Survey');
    this.error = getNodeText(node, 'Error');
    this.pricing = getNodeText(node, 'Pricing');

    this.linear = function() {
        for(var i=0;i<this.creatives.length;i++) {
            //TODO: choose the "best" Linear creative here.
            if(this.creatives[i] instanceof Linear) {
                return this.creatives[i];
            }
        }
        return undefined;
    };

    this.sources = function(width, types) {
        if(this.linear !== undefined) {
            return this.linear.sources(width, types);
        }
        return [];
    };

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
                var nodes = xml.getElementsByTagName('Ad');
                for (var i=0;i<nodes.length;i++) {
                    if(nodes[i].getElementsByTagName('InLine').length > 0) {
                        var inline = new InLine(nodes[0]);
                        ads.push(inline);
                    }
                    // TODO: <Wrapper>
                }
                cbk && cbk(ads);
            }
        };
    }
    httpRequest.open('GET', url);
    httpRequest.send();
}
