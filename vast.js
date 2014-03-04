if (!Array.prototype.indexOf){
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++) {
            if (from in this &&
                this[from] === elt)
            return from;
        }
        return -1;
    };
}

var get = function(url, onSuccess, onError){
  var local, request;

  if (window.XDomainRequest) {
    request = new XDomainRequest();
  } else {
    request = new XMLHttpRequest();
  }

  if(url.indexOf("%%CACHEBUSTER%%") !== -1 || url.indexOf("[TIMESTAMP]") !== -1) {
    var cachebust = Math.floor(Math.random() * 10e10);
    url = url.replace("%%CACHEBUSTER%%", cachebust);
    url = url.replace("[TIMESTAMP]", cachebust);
  }

  try {
    request.open('GET', url);
  } catch(e) {
    onError(e);
  }

  local = (url.indexOf('file:') === 0 || (window.location.href.indexOf('file:') === 0 && url.indexOf('http') === -1));

  if (window.XDomainRequest) {
    request.onerror = onError;
    request.onload = function() {
        onSuccess(request.responseText);
    };
  } else {
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          if (request.status === 200 || local && request.status === 0) {
            onSuccess(request.responseText);
          } else {
            if (onError) {
              onError();
            }
          }
        }
      };
  }

  try {
    request.send();
  } catch(e) {
    if (onError) {
      onError(e);
    }
  }
};


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
        return getTextContent(nodes[0]);
    } else {
        return undefined;
    }
}

function getTextContent(node){
    return node.textContent || node.text || node.innerText || node.innerHTML;
}

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

/**************************************/
/* Objects to hold the VAST node data */
/**************************************/
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
        this.clickThrough = getTextContent(clicksNode.getElementsByTagName('ClickThrough')[0]);

        this.clickTracking = [];
        var clickTrackingNodes = clicksNode.getElementsByTagName('ClickTracking');
        for (var i=0;i<clickTrackingNodes.length;i++) {
            this.clickTracking.push(getTextContent(clickTrackingNodes[i]));
        }
        // TODO: Implement CustomClick?
    }

    /* The <TrackingEvents> element may contain one or more <Tracking> elements. An event
     * attribute for the <Tracking> element enables ad servers to include individual tracking
     * URIs for events they want to track. */
    this.tracking = {};
    if(node.getElementsByTagName('TrackingEvents').length > 0) {
        var trackingEventsNode = node.getElementsByTagName('TrackingEvents')[0];
        var trackingNodes = trackingEventsNode.getElementsByTagName('Tracking');
        for (var j=0;j<trackingNodes.length;j++) {
            var eventName = trackingNodes[j].getAttribute('event');
            if (this.tracking[eventName] === undefined) {
                this.tracking[eventName] = [];
            }
            this.tracking[eventName].push(getTextContent(trackingNodes[j]));
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
    var nodes = node.getElementsByTagName('MediaFile');
    for (var k=0;k<nodes.length;k++) {
        var mediaFile = {
            id: nodes[k].getAttribute('id'),
            delivery: nodes[k].getAttribute('delivery'),
            src: getTextContent(nodes[k]),
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
        //Changed this to make mp4 first choice because Safari is now shipping with a finnicky webm implementation -SB
        types = types || ['video/mp4', 'video/webm', 'video/ogv'];

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
        var linearNodes = nodes[i].getElementsByTagName("Linear");
        for(var j=0; j<linearNodes.length; j++) {
            this.creatives.push(new Linear(linearNodes[j]));
        }
        // TODO: Implement NonLinear, CompanionAds
    }

    this.impressions = [];
    var nodes = node.getElementsByTagName('Impression');
    for (var i=0;i<nodes.length;i++) {
        this.impressions.push(getTextContent(nodes[i]));
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
            return this.linear().sources(width, types);
        }
        return [];
    };

}

/* A VAST Wrapper is used to redirect the video player to a secondary location for the Ad’s
 * resource files and can also redirect to yet another VAST response. Using tracking events
 * in the Wrapper, impressions and interactions can be tracked for the Ad that is eventually
 * displayed. */
function Wrapper(node) {
    // Required elements
    this.adSystem = getNodeText(node, 'AdSystem');
    this.impressions = [];
    var impression = getNodeText(node, 'Impression');
    if (impression !== undefined) {
        this.impressions.push(impression);
    }
    this.adTagURI = getNodeText(node, 'VASTAdTagURI');

    // Optional Elements
    this.error = getNodeText(node, 'Error');

    // TODO: Implement Creatives, Extensions
}

var parseXml;

if (typeof window.DOMParser != "undefined") {
    parseXml = function(xmlStr) {
        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
       new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function(xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
} else {
    throw new Error("No XML parser found");
}

function fetchVAST(url, cbk, wrapper, videoAdId, companionTargeting) {
    get(url, function(data) {
        var xml = parseXml(data);
        if (xml === null) {
            if (cbk !== undefined) {
                cbk();
            }
            return;
        }
        var ads = [];
        var nodes = xml.getElementsByTagName('Ad');
        for (var i=0;i<nodes.length;i++) {
            videoAdId = videoAdId || nodes[i].getAttribute('id');
            companionTargeting = companionTargeting || nodes[i].getAttribute('target');
            if(nodes[i].getElementsByTagName('InLine').length > 0) {
                var inline = new InLine(nodes[0]);

                if(wrapper !== undefined) {
                    for(var j=0;j<wrapper.impressions.length;j++) {
                        inline.impressions.push(wrapper.impressions[j]);
                    }
                }
                inline.video_ad_id = videoAdId;
                inline.companion_targeting = companionTargeting;
                ads.push(inline);
            }
            if(nodes[i].getElementsByTagName('Wrapper').length > 0) {
                var newWrapper = new Wrapper(nodes[0]);
                if(wrapper !== undefined) {
                    for(var k=0;k<wrapper.impressions.length;k++) {
                        newWrapper.impressions.push(wrapper.impressions[k]);
                    }
                }
                fetchVAST(newWrapper.adTagURI, cbk, newWrapper, videoAdId, companionTargeting);
                return;
            }
        }
        if (cbk !== undefined) {
            cbk(ads);
        }
    }, cbk);
}