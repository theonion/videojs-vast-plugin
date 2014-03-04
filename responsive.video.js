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

  defaults = {},

  responsive = function(options) {
    var player = this;
    var el = this.el();
    var settings = extend({}, defaults, options || {});
    var responsiveEl = document.createElement('div');
    responsiveEl.className = 'vjs-responsive';
    el.appendChild(responsiveEl);

    player.on('loadedmetadata', function() {
      var height, width;
      var techEl = el.getElementsByClassName("vjs-tech")[0];
      var posterEl = el.getElementsByClassName("vjs-poster")[0];
      if(techEl.videoHeight && techEl.videoWidth) {
        width = techEl.videoWidth;
        height = techEl.videoHeight;
      }

      // If the aspectRatio is specified, trust that.
      if (settings.aspectRatio) {
        width = settings.aspectRatio[0];
        height = settings.aspectRatio[1];
      }

      // If we made a responsive div, and have a height and width, then let's do this thing.
      if(width && height) {

        el.style.display = 'inline-block';
        el.style.position = 'relative';
        el.style.height = '';
        el.style.width = '';

        posterEl.style.position = 'absolute';
        posterEl.style.top = 0;
        posterEl.style.bottom = 0;
        posterEl.style.left = 0;
        posterEl.style.right = 0;
        posterEl.style.height = '';
        posterEl.style.width = '';

        techEl.style.position = 'absolute';
        techEl.style.top = 0;
        techEl.style.bottom = 0;
        techEl.style.left = 0;
        techEl.style.right = 0;
        techEl.style.height = '';
        techEl.style.width = '';

        responsiveEl.style.paddingTop = ((height / width) * 100 ) + '%';
      }
    });

  };

  vjs.plugin("responsive", responsive);
})(window.videojs);
