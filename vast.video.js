_V_.Vast = _V_.Component.extend({

    options: {
        VASTServers: []
    },
    ads: [],
    ad: undefined,
    cachedSrc: undefined,

    init: function(player, options){
        this._super(player, options);
        this.hide();
        
        player.one('play', function(){
            this.vast.startAd();
        });

        this.player.addEvent('skip', this.proxy(this.skipAd));

        // player.addEvent('vastload', this.proxy(this.onVastLoad));
        player.addEvent('vastload', this.proxy(this.onVastLoad));
        var vastComponent = this;

        for(var i=0;i<this.options.VASTServers.length;i++) {
            fetchVAST(this.options.VASTServers[i], function(ads){
                vastComponent.ads.push(ads);
                player.triggerEvent("vastload");
            });
        }
    },

    createElement: function(){
        var player = this.player;
        var el = _V_.createElement("a", {
            className: ("vjs-vast-blocker")
        });
        var skipButton = _V_.createElement("div", {
            className: ("vjs-skip-button")
        });
        skipButton.onclick = function() {
            player.triggerEvent('skip');
            return false;
        };
        el.appendChild(skipButton);
        return el;
    },

    firePixel: function(url) {
        console.log(url);
    },

    startAd: function() {
        var self = this;
        var player = self.player;

        player.controlBar.progressControl.hide();
        self.show();

        // Don't have an ad yet? Let's wait for one...
        if(this.ad === undefined) {
            // For some reason, we can't pause now. We have to wait for a time update.
            player.one('timeupdate', function() {
                this.pause();
                this.loadingSpinner.show();
            });

            setTimeout(function(){
                player.triggerEvent('skip');
            }, 2000);
            console.log("no ad yet...");
            return;
        }

        // Yay, we have an ad. Let's play it!
        var linear = self.ad.linear();
        if(linear === undefined) {
            // No linear ad, and that's all the player will handle right now.
            player.triggerEvent('skip');
            return;
        }

        var blocker = self.el;
        blocker.onclick = function() {
            player.pause();
            if(blocker.getAttribute("href") !== null) {
                for(var i=0;i<linear.clickTracking.length;i++) {
                    var url = linear.clickTracking[i];
                    self.firePixel(url);
                }
            }
        };

        player.controlBar.el.style.setProperty('z-index', '2');



        this.cachedSrc = player.currentSrc();

        // Setup events
        // this.on('timeupdate', timeupdate);

        player.src(linear.sources());
        player.load();
        player.play();

        player.one('ended', function() {
            this.triggerEvent("skip");
        });
    },

    skipAd: function() {
        this.hide();
        this.player.controlBar.progressControl.show();
        if(this.cachedSrc !== undefined) {
            this.src(this.cachedSrc);
            this.cachedSrc = undefined;
        }

        this.player.play();
    },

    onVastLoad: function() {
        if(this.ads.length > 0) {
            this.ad = this.ads[0][0];
        }
        var linear = this.ad.linear();
        if (linear && linear.clickThrough) {
            this.el.setAttribute("href", linear.clickThrough);
            this.el.setAttribute("target", "_blank");
        }
    }
});




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