(function(window, vjs, vast) {
  "use strict";

  var player, isHtmlSupported, oldClearImmediate;

  beforeEach(function() {
    var id = "vid";
    (function() {
      var video = document.createElement("video");
      video.id = id;
      video.src = "http://vjs.zencdn.net/v/oceans.mp4";
      video.setAttribute = "controls";
      document.body.appendChild(video);
      isHtmlSupported = vjs.Html5.isSupported;
      if (/phantomjs/gi.test(window.navigator.userAgent)) {
        // PhantomJS doesn't have a video element implementation
        // force support here so that the HTML5 tech is still used during
        // command-line test runs
        videojs.Html5.isSupported = function() {
          return true;
        };

        // provide implementations for any video element functions that are
        // used in the tests
        video.load = function() {};
        video.play = function() {};

        // see https://github.com/videojs/videojs-contrib-ads/blob/master/test/videojs.ads.test.js#L23
        window.setImmediate = function(callback) {
          callback.call(window);
        };
        oldClearImmediate = window.clearImmediate;
      }
    })();
    player = vjs(id);
    player.ads();
    player.vast({
      url: ""
    });
  });


  afterEach(function() {
    player.dispose();
    vjs.Html5.isSupported = isHtmlSupported;
    window.clearImmediate = oldClearImmediate;
  });


  describe("Requirements", function() {

    beforeEach(function() {
      var video = document.createElement("video");
      video.setAttribute = "controls";
      document.body.appendChild(video);
      this.p = vjs(video);
    });

    afterEach(function() {
      this.p.dispose();
    });

    it("should bail out if player.ads isn't defined", function() {
      spyOn(console, "log");
      spyOn(this.p.vast, "createSourceObjects");
      this.p.ads = undefined;
      this.p.vast({url:"i wanna go VAST!"});
      expect(console.log).toHaveBeenCalled();
      expect(this.p.vast.createSourceObjects).not.toHaveBeenCalled();
    });

    it("should bail out if no url is provided", function() {
      spyOn(this.p.vast, "createSourceObjects");
      spyOn(this.p, "trigger");
      this.p.ads();
      this.p.vast({});
      expect(this.p.trigger).toHaveBeenCalledWith("adtimeout");
      expect(this.p.vast.createSourceObjects).not.toHaveBeenCalled();
    });
  });


  describe("Public methods", function() {

    describe("createSourceObjects", function() {

      it("should return objects with 'src' and 'type' properties", function() {
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/webm"
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4"
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        for (var s in sources) {
          expect(sources[s].src).toBeDefined();
          expect(sources[s].type).toBeDefined();
        }
      });

      it("should not accept all video formats", function() {
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/flv"
          },
          {
            fileURL: "So Trill",
            mimeType: "video/x-flv"
          },
          {
            fileURL: "Skrill, WHERES MY SKRILL",
            mimeType: "video/mpeg"
          },
          {
            fileURL: "Jack and Jill",
            mimeType: "video/ogg"
          },
          {
            fileURL: "-- Code Raps -- ",
            mimeType: "hls/playlist.m3u8"
          },
          {
            fileURL: "I'm tapped",
            mimeType: "video/avi"
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4"
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        expect(sources.length).toBe(1);
      });

      it("returns sources with unique formats", function() {
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/mp4"
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4"
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        expect(sources.length).toBe(1);
      });

    });
  });

})(window, videojs, DMVAST);
