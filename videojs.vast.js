(function(vjs) {
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
    skip: 5,
  },

  vastPlugin = function(options) {
    var player = this;
    var settings = extend({}, defaults, options || {});

    if (player.ads === undefined) {
        console.log("VAST requires videojs-contrib-ads");
        return;
    }

    // If we don't have a VAST url, just bail out.
    if(options.url === undefined) {
      player.trigger('adtimeout');
      return;
    }

    player.on('contentupdate', function(){
      // fetchVAST(options.url, function(ads){
      //   if(ads !== undefined && ads.length > 0) {
      //     console.log(player.vast)
      //     player.vast.ad = ads[0];
      //     player.trigger('adsready');
      //   } else {
      //     player.trigger('adtimeout');
      //     player.one('preroll?', function(){
      //       player.trigger('adtimeout');
      //     });
      //   }
      // });

      DMVAST.client.get(options.url, function(response) {
        if (response) {
          for (var adIdx = 0; adIdx < response.ads.length; adIdx++) {
            var ad = response.ads[adIdx];
            for (var creaIdx = 0; creaIdx < ad.creatives.length; creaIdx++) {
              var linearCreative = ad.creatives[creaIdx];
              if (linearCreative.type !== "linear") continue;
              
              if (linearCreative.mediaFiles.length) {
                player.vast.sources = player.vast.createSourceObjects(linearCreative.mediaFiles);
                player.vastTracker = new DMVAST.tracker(ad, linearCreative);
                player.on('canplay', function() {this.vastTracker.load();});
                player.on('timeupdate', function() {this.vastTracker.setProgress(this.currentTime());});
                player.on('play', function() {this.vastTracker.setPaused(false);});
                player.on('pause', function() {this.vastTracker.setPaused(true);});
                break;
              }
            }

            if (player.vastTracker) {
              player.trigger("adsready");
              break;
            } else {
              // Inform ad server we can't find suitable media file for this ad
              DMVAST.util.track(ad.errorURLTemplates, {ERRORCODE: 403});
            }
          }
        }

        if (!player.vastTracker) {
          // No pre-roll, start video
          player.trigger('adtimeout');
        }
      });


    });

    player.on('readyforpreroll', function() {
      player.ads.startLinearAdMode();

      player.autoplay(true);
      // play your linear ad content
      var adSources = player.vast.sources;
      player.src(adSources);

      var clickthrough = DMVAST.util.resolveURLTemplates(
        [player.vastTracker.clickThroughURLTemplate],
        {CONTENTPLAYHEAD: player.vastTracker.progressFormated()}
      )[0];
      var blocker = document.createElement("a");
      blocker.className = "vast-blocker";
      blocker.href = clickthrough;
      blocker.target = "_blank";
      blocker.onclick = function() {
        var clicktrackers = player.vastTracker.clickTrackingURLTemplate;
        if (clicktrackers) {
          player.vastTracker.trackURLs(clicktrackers);
        }
      };
      player.vast.blocker = blocker;
      player.el().insertBefore(blocker, player.controlBar.el());

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);

      player.on("timeupdate", player.vast.timeupdate);

      skipButton.onclick = function(e) {
        if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') >= 0) {
          player.vast.tearDown();
        }
        if(Event.prototype.stopPropagation !== undefined) {
          e.stopPropagation();
        } else {
          return false;
        }
      };
    });

    player.vast.tearDown = function() {
      player.vast.ad = undefined;
      player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
      player.vast.blocker.parentNode.removeChild(player.vast.blocker);
      player.off('timeupdate', player.vast.timeupdate);
      player.ads.endLinearAdMode();
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
    player.vast.createSourceObjects = function(media_files) {
      var fileURLs = {};
      var vidFormats = ['video/mp4', 'video/webm', 'video/ogv'];
      // get a list of files with unique formats
      for (var i = 0; i < media_files.length; i++) {
        var file_url = media_files[i].fileURL;
        var mime_type = media_files[i].mimeType;

        if (vidFormats.indexOf(mime_type) >= 0) {
          if(fileURLs[mime_type] === undefined) {
            fileURLs[mime_type] = file_url;
          } 
        }
      }

      var sources = [];
      for (var j=0; j < vidFormats.length; j++) {
        var format = vidFormats[j];
        if (fileURLs[format] !== undefined) {
          sources.push({
            type: format,
            src: fileURLs[format]
          });
        }
      }
      return sources;
    };

  };

  vjs.plugin('vast', vastPlugin);
}(window.videojs));