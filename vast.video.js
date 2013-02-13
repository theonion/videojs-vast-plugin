function skipAd() {



    var blocker = this.getEl().getElementsByClassName('vjs-vast-blocker');
    for(var i=0;i<blocker.length;i++) {
        this.getEl().removeChild(blocker[i]);
    }
    
    this.controlBar.progressControl.show();
    
    if(vast.cachedSrc !== undefined) {
        this.src(vast.cachedSrc);
        vast.cachedSrc = undefined;
    }
    
    this.load();
    this.play();
}

function startAd() {
    var player = this;

    var blocker = document.createElement('div');
    blocker.className = 'vjs-vast-blocker';

    var skipButton = document.createElement('div');
    skipButton.className = 'vjs-skip-button';
    skipButton.onclick = function() {player.trigger('skip');};

    this.on('skip', skipAd);

    this.controlBar.progressControl.hide();
    
    blocker.appendChild(skipButton);

    this.getEl().appendChild(blocker);

    if (vast.ad !== undefined) {
        var adSrc = vast.ad.sources();
        if(adSrc.length === 0) {
            return;
        }

        vast.cachedSrc = this.currentSrc();
        
        this.controlBar.getEl().style.setProperty('z-index', '2');

        this.src(adSrc);
        this.load();
        this.play();

        this.one('ended', skipAd);
    } else {
        this.pause();
        console.log('need to pause and wait for an ad...');
    }
}


function vast(options) {
    this.one('play', startAd);

    options = options || {};
    if (options.VASTServers) {
        fetchVAST(options.VASTServers[0], function(ads){
            vast.ad = ads[0];
        });
        // makeRequest(options.VASTServers[0], processVAST);
    }
}