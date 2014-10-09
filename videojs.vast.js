(function(factory){
    if (typeof define === 'function' && define.amd) {
        define(['./videojs', './vast-client', './videojs.ads'], factory);
    } else if (typeof exports === 'object' && typeof module === 'object') {
        factory(require('videojs'), require('vast-client'));
    } else {
        factory(window.videojs, window.DMVAST);
    }
})(function(vjs, vast) {
"use strict";
  var
  extend = function(obj) {
    var arg, i, k;
    for (i = 1; i < arguments.length; i++) {
      arg = arguments[i];
      for (k in arg) {
        if (arg.hasOwnProperty(k)) {
          obj[k] = arg[k];
        }
      }
    }
    return obj;
  },

  defaults = {
    skip: 5 // negative disables
  },

  vastPlugin = function(options) {
    var player = this;
    var settings = extend({}, defaults, options || {});

    if (player.ads === undefined) {
        console.log("VAST requires videojs-contrib-ads");
        return;
    }

    // If we don't have a VAST url, just bail out.
    if(settings.url === undefined) {
      player.trigger('adtimeout');
      return;
    }

    // videojs-ads triggers this when src changes
    player.on('contentupdate', function(){
      player.vast.getContent(settings.url);
    });

    player.on('readyforpreroll', function() {
      player.vast.preroll();
    });

    player.vast.getContent = function(url) {
      vast.client.get(url, function(response) {
        if (response) {
          for (var adIdx = 0; adIdx < response.ads.length; adIdx++) {
            var ad = response.ads[adIdx];
            player.vast.companion = undefined;
            for (var creaIdx = 0; creaIdx < ad.creatives.length; creaIdx++) {
              var creative = ad.creatives[creaIdx], foundCreative = false, foundCompanion = false;
              if (creative.type === "linear" && !foundCreative) {

                if (creative.mediaFiles.length) {

                  player.vast.sources = player.vast.createSourceObjects(creative.mediaFiles);

                  if (!player.vast.sources.length) {
                    player.trigger('adtimeout');
                    return;
                  }

                  player.vastTracker = new vast.tracker(ad, creative);

                  var errorOccurred = false,
                      canplayFn = function() {
                        this.vastTracker.load();
                      },
                      timeupdateFn = function() {
                        if (isNaN(this.vastTracker.assetDuration)) {
                          this.vastTracker.assetDuration = this.duration();
                        }
                        this.vastTracker.setProgress(this.currentTime());
                      },
                      playFn = function() {
                        this.vastTracker.setPaused(false);
                      },
                      pauseFn = function() {
                        this.vastTracker.setPaused(true);
                      },
                      errorFn = function() {
                        // Inform ad server we couldn't play the media file for this ad
                        vast.util.track(ad.errorURLTemplates, {ERRORCODE: 405});
                        errorOccurred = true;
                        player.trigger('ended');
                      };

                  player.on('canplay', canplayFn);
                  player.on('timeupdate', timeupdateFn);
                  player.on('play', playFn);
                  player.on('pause', pauseFn);
                  player.on('error', errorFn);

                  player.one('ended', function() {
                    player.off('canplay', canplayFn);
                    player.off('timeupdate', timeupdateFn);
                    player.off('play', playFn);
                    player.off('pause', pauseFn);
                    player.off('error', errorFn);
                    if (!errorOccurred) {
                      this.vastTracker.complete();
                    }
                  });

                  foundCreative = true;
                }

              } else if (creative.type === "companion" && !foundCompanion) {

                player.vast.companion = creative;

                foundCompanion = true;

              }
            }

            if (player.vastTracker) {
              player.trigger("adsready");
              break;
            } else {
              // Inform ad server we can't find suitable media file for this ad
              vast.util.track(ad.errorURLTemplates, {ERRORCODE: 403});
            }
          }
        }

        if (!player.vastTracker) {
          // No pre-roll, start video
          player.trigger('adtimeout');
        }
      });
    };

    player.vast.preroll = function() {
      player.ads.startLinearAdMode();
      player.vast.showControls = player.controls();
      if (player.vast.showControls ) {
        player.controls(false);
      }
      player.autoplay(true);
      // play your linear ad content
      var adSources = player.vast.sources;
      player.src(adSources);

      var clickthrough;
      if (player.vastTracker.clickThroughURLTemplate) {
        clickthrough = vast.util.resolveURLTemplates(
          [player.vastTracker.clickThroughURLTemplate],
          {
            CACHEBUSTER: Math.round(Math.random() * 1.0e+10),
            CONTENTPLAYHEAD: player.vastTracker.progressFormated()
          }
        )[0];
      }
      var blocker = document.createElement("a");
      blocker.className = "vast-blocker";
      blocker.href = clickthrough || "#";
      blocker.target = "_blank";
      blocker.onclick = function() {
        if (player.paused()) {
          player.play();
          return false;
        }
        var clicktrackers = player.vastTracker.clickTrackingURLTemplate;
        if (clicktrackers) {
          player.vastTracker.trackURLs([clicktrackers]);
        }
        player.trigger("adclick");
      };
      player.vast.blocker = blocker;
      player.el().insertBefore(blocker, player.controlBar.el());

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      if (settings.skip < 0) {
        skipButton.style.display = "none";
      }
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);

      player.on("timeupdate", player.vast.timeupdate);

      skipButton.onclick = function(e) {
        if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') >= 0) {
          player.vastTracker.skip();
          player.vast.tearDown();
        }
        if(Event.prototype.stopPropagation !== undefined) {
          e.stopPropagation();
        } else {
          return false;
        }
      };

      player.one("ended", player.vast.tearDown);
    };

    player.vast.tearDown = function() {
      player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
      player.vast.blocker.parentNode.removeChild(player.vast.blocker);
      player.off('timeupdate', player.vast.timeupdate);
      player.off('ended', player.vast.tearDown);
      player.ads.endLinearAdMode();
      if (player.vast.showControls ) {
        player.controls(true);
      }
    };

    player.vast.timeupdate = function(e) {
      player.loadingSpinner.el().style.display = "none";
      var timeLeft = Math.ceil(settings.skip - player.currentTime());
      if(timeLeft > 0) {
        player.vast.skipButton.innerHTML = "Skip in " + timeLeft + "...";
      } else {
        if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') === -1){
          player.vast.skipButton.className += " enabled";
          player.vast.skipButton.innerHTML = "Skip";
        }
      }
    };
    player.vast.createSourceObjects = function (media_files) {
      var sourcesByFormat = {}, i, j, tech;
      var techOrder = player.options().techOrder;
      for (i = 0, j = techOrder.length; i < j; i++) {
        var techName = techOrder[i].charAt(0).toUpperCase() + techOrder[i].slice(1);
        tech = window.videojs[techName];

        // Check if the current tech is defined before continuing
        if (!tech) {
          continue;
        }

        // Check if the browser supports this technology
        if (tech.isSupported()) {
          // Loop through each source object
          for (var a = 0, b = media_files.length; a < b; a++) {
            var media_file = media_files[a];
            var source = {type:media_file.mimeType, src:media_file.fileURL};
            // Check if source can be played with this technology
            if (tech.canPlaySource(source)) {
              if (sourcesByFormat[techOrder[i]] === undefined) {
                sourcesByFormat[techOrder[i]] = [];
              }
              sourcesByFormat[techOrder[i]].push({
                type:media_file.mimeType,
                src: media_file.fileURL,
                width: media_file.width,
                height: media_file.height
              });
            }
          }
        }
      }
      // Create sources in preferred format order
      var sources = [];
      for (j = 0; j < techOrder.length; j++) {
        tech = techOrder[j];
        if (sourcesByFormat[tech] !== undefined) {
          for (i = 0; i < sourcesByFormat[tech].length; i++) {
            sources.push(sourcesByFormat[tech][i]);
          }
        }
      }
      return sources;
    };

    // make an ads request immediately so we're ready when the viewer
    // hits "play"
    if (player.currentSrc()) {
      player.vast.getContent(settings.url);
    }
  };

  vjs.plugin('vast', vastPlugin);
});
