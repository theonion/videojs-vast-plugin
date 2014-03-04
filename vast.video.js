(function(vjs) {
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
      fetchVAST(options.url, function(ads){
        if(ads !== undefined && ads.length > 0) {
          player.vast.ad = ads[0];
          player.trigger('adsready');
        } else {
          player.trigger('adtimeout');
          player.one('preroll?', function(){
            player.trigger('adtimeout');
          });
        }
      });
    });

    player.on('readyforpreroll', function() {
      player.ads.startLinearAdMode();

      player.autoplay(true);
      // play your linear ad content
      var adSources = player.vast.ad.sources();

      player.src(adSources);
      player.vast.linearEvent('creativeView');
      player.vast.firePixel(player.vast.ad.impressions);

      var blocker = document.createElement("a");
      blocker.className = "vast-blocker";
      blocker.href = player.vast.ad.linear().clickThrough;
      blocker.target = "_blank";
      blocker.onclick = function() {
        player.vast.firePixel(player.vast.ad.linear().clickTracking);
      };
      player.vast.blocker = blocker;
      player.el().insertBefore(blocker, player.controlBar.el());

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);

      player.vast.timeupdateEvents = {
        0   : 'start',
        0.25: 'firstQuartile',
        0.5 : 'midpoint',
        0.75: 'thirdQuartile'
      };

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

      player.one('ended', player.vast.ended);
    });

    player.vast.tearDown = function() {
      player.vast.ad = undefined;
      player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
      player.vast.blocker.parentNode.removeChild(player.vast.blocker);
      player.off('ended', player.vast.ended);
      player.off('timeupdate', player.vast.timeupdate);
      player.ads.endLinearAdMode();
    };

    player.vast.timeupdate = function(e) {
      player.loadingSpinner.el().style.display = "none";
      var timeLeft = Math.ceil(settings.skip - player.currentTime());
      var percentage = player.currentTime() / player.duration();
      for (var threshold in player.vast.timeupdateEvents) {
        if(threshold < percentage) {
          player.vast.linearEvent(player.vast.timeupdateEvents[threshold]);
          delete player.vast.timeupdateEvents[threshold];
        }
      }
      if(timeLeft > 0) {
        player.vast.skipButton.innerHTML = "Skip in " + timeLeft + "...";
      } else {
        if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') === -1){
          player.vast.skipButton.className += " enabled";
          player.vast.skipButton.innerHTML = "Skip";
        }
      }
    };

    player.vast.ended = function(e) {
      player.vast.linearEvent("complete");
      player.vast.tearDown();
    };

    player.vast.linearEvent = function(eventName) {
      if (player.vast.ad === undefined) {
        return;
      }
      var uri = player.vast.ad.linear().tracking[eventName];
      if (uri !== undefined) {
        player.vast.firePixel(uri);
      }
    };

    player.vast.firePixel = function(uri) {
      var type = Object.prototype.toString.call(uri);
      var milliseconds = (new Date).getTime();
      switch (type) {
        case '[object String]':
          var img = document.createElement('img');
          img.src = uri.replace('%%CACHEBUSTER%%', milliseconds);
          player.el().appendChild(img);
          break;
        case '[object Array]':
          for(var i in uri) {
            player.vast.firePixel(uri[i]);
          }
          break;
        default:
          throw new Error("Unrecognized uri type: " + type);
      }
    };
  };

  vjs.plugin('vast', vastPlugin);
}(window.videojs));