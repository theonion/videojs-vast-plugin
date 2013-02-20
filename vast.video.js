function firePixel(url, parentElement){
    var pixel = document.createElement('img');
    pixel.setAttribute('src', url);
    
    if( parentElement !== undefined ){
        parentElement.appendChild( pixel );
    } else {
        document.getElementsByTagName('body')[0].appendChild( pixel );
    }
}

function timeupdate() {
    // start
    // midpoint
    // firstQuartile
    // thirdQuartile
    // complete
}


function skipAd() {

    var blocker = this.el().getElementsByClassName('vjs-vast-blocker');
    for(var i=0;i<blocker.length;i++) {
        this.el().removeChild(blocker[i]);
    }
    
    this.controlBar.progressControl.show();
    
    if(vast.cachedSrc !== undefined) {
        this.src(vast.cachedSrc);
        vast.cachedSrc = undefined;
    }
    
    this.load();
    this.one('loadedmetadata', this.play);
}

function startAd() {
    var player = this;

    var blocker = document.createElement('a');
    blocker.className = 'vjs-vast-blocker';
    blocker.onclick = function() {
        player.pause();
        if(blocker.getAttribute("href") !== null) {
            for(var i=0;i<vast.ad.linear().clickTracking.length;i++) {
                var url = vast.ad.linear().clickTracking[i];
                firePixel(url, blocker);
            }
        }
    };

    var skipButton = document.createElement('div');
    skipButton.className = 'vjs-skip-button';
    skipButton.onclick = function() {
        player.trigger('skip');
        return false;
    };
    this.on('skip', skipAd);

    this.controlBar.progressControl.hide();
    
    this.el().appendChild(blocker);
    
    this.controlBar.el().style.setProperty('z-index', '2');

    if (vast.ad !== undefined) {
        var linear = vast.ad.linear();
        if(linear === undefined) {
            player.trigger('skip');
            return;
        }

        vast.cachedSrc = this.currentSrc();
        blocker.appendChild(skipButton);

        if (linear.clickThrough) {
            blocker.setAttribute("href", linear.clickThrough);
            blocker.setAttribute("target", "_blank");
        }

        // Setup events
        this.on('timeupdate', timeupdate);

        this.src(linear.sources());
        this.load();
        this.play();

        this.one('ended', skipAd);
    } else {
        // For some reason, we can't pause now. We have to wait for a time update.
        this.one('timeupdate', function() {
            this.pause();
            this.loadingSpinner.show();
        });

        setTimeout(function(){
            player.trigger('skip');
        }, 2000);
    }
}

function onVastload(event) {
    this.vast.ad = this.vast.ads[0][0];
    console.log(this.vast.ad);
}


function vast(options) {
    var player = this;

    this.one('play', startAd);
    this.on('vastload', onVastload);

    options = options || {};
    options.VASTServers = options.VASTServers || [];
    vast.ads = [];
    for(var i=0;i<options.VASTServers.length;i++) {
        fetchVAST(options.VASTServers[i], function(ads){
            vast.ads.push(ads);
            player.trigger('vastload');
        });
    }
}