"use strict";

describe('videojs.vast plugin', function() {

  var player, isHtmlSupported, oldClearImmediate;

  beforeEach(function() {
    var id = "vid";
    (function() {
      var video = document.createElement("video");
      video.id = id;
      video.src = "http://vjs.zencdn.net/v/oceans.mp4";
      video.setAttribute = "controls";
      document.body.appendChild(video);
      isHtmlSupported = videojs.Html5.isSupported;
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
    player = videojs(id);
    player.ads();
    player.vast({
      url: ""
    });
  });


  afterEach(function() {
    player.dispose();
    videojs.Html5.isSupported = isHtmlSupported;
    window.clearImmediate = oldClearImmediate;
  });


  describe("Requirements", function() {

    beforeEach(function() {
      var video = document.createElement("video");
      video.setAttribute = "controls";
      document.body.appendChild(video);
      this.p = videojs(video);
    });

    afterEach(function() {
      this.p.dispose();
    });

    it("should bail out if player.ads isn't defined", function() {
      spyOn(console, "error");
      this.p.ads = undefined;
      var result = this.p.vast({url:"i wanna go VAST!"});
      expect(result).toBe(null);
      expect(console.error).toHaveBeenCalledWith(jasmine.any(String));
    });

    it("should bail out if no url is provided", function() {
      spyOn(this.p, "trigger");
      this.p.ads();
      var result = this.p.vast({});
      expect(result).toBe(null);
      expect(this.p.trigger).toHaveBeenCalledWith("adtimeout");
    });

    it("should request an ad if a source is already loaded", function() {
      this.p.currentSrc = function() {
        return "video.mp4";
      };
      spyOn(DMVAST.client, "get");
      this.p.ads();
      this.p.vast({url:"i wanna go VAST!"});
      expect(DMVAST.client.get).toHaveBeenCalledWith("i wanna go VAST!", jasmine.any(Function));
    });
  });


  describe("Public methods", function() {

    describe("createSourceObjects", function() {

      it("should return objects with 'src', 'type', 'width', and 'height' properties", function() {
        player.vast({ url: 'balhbahblhab' });
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/webm",
            width: 640,
            height: 360
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 0,
            height: 0
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        for (var s in sources) {
          expect(sources[s].src).toBeDefined();
          expect(sources[s].type).toBeDefined();
          expect(sources[s].width).toBeDefined();
          expect(sources[s].height).toBeDefined();
        }
      });
    });

    describe("tearDown", function() {

      it("should end the linear ad", function() {
        player.vast({ url: 'balhbahblhab' });

        spyOn(player.ads, "endLinearAdMode");
        spyOn(player, "off");

        // TODO: fix this
        player.vast.skipButton = document.createElement("div");
        player.el().appendChild(player.vast.skipButton);
        player.vast.blocker = document.createElement("a");
        player.el().insertBefore(player.vast.blocker, player.controlBar.el());

        player.vast.tearDown();
        expect(player.off).toHaveBeenCalledWith("ended", jasmine.any(Function));
        expect(player.ads.endLinearAdMode).toHaveBeenCalled();
      });

    });

    describe("preroll", function() {

      beforeEach(function() {
        player.vast({ url: 'balhbahblhab' });
        player.vastTracker = {
          clickThroughURLTemplate: "a whole new page",
          clickTrackingURLTemplate: "a new fantastic advertisement",
          trackURLs: function(){},
          progressFormated: function(){}
        };
        player.vast.sources = [];
      });

      it("should start the ad", function() {
        spyOn(player.ads, "startLinearAdMode");
        spyOn(player, "src");
        player.vast.sources = [];
        player.vast.preroll();
        expect(player.ads.startLinearAdMode).toHaveBeenCalled();
        expect(player.src).toHaveBeenCalledWith(jasmine.any(Array));
      });

      it("should end the ad", function() {
        spyOn(player, "one");
        player.vast.preroll();
        expect(player.one).toHaveBeenCalledWith("ended", jasmine.any(Function));
      });

    });

    describe("getContent", function() {
      it("should bail out if there aren't playable media files", function() {
        player.vast({ url: 'balhbahblhab' });
        spyOn(DMVAST.client, "get").and.callFake(function(url, callback){
            var fake_response = {
              ads: [{
                creatives:[{
                  type: "linear",
                  mediaFiles: [{fileURL:"0", mimeType:"n0t-r34l"}]
                }]
              }]
            };
            callback(fake_response);
          });

        spyOn(player, "trigger");
        player.vast.getContent("some url");
        expect(player.trigger).toHaveBeenCalledWith("adtimeout");
      });

      describe("linear ads", function() {
        beforeEach(function() {
          spyOn(DMVAST.client, "get")
            .and.callFake(function(url, callback){
              var fake_response = {
                ads: [{
                  creatives:[{
                    type: "linear",
                    mediaFiles: [{fileURL:"hunt", mimeType:"video/webm"}]
                  }]
                }]
              };
              callback(fake_response);
            });
        });
      });

      describe("non-linear ads", function() {
        beforeEach(function() {
          spyOn(DMVAST.client, "get")
            .and.callFake(function(url, callback){
              var fake_response = {
                ads: [{
                  creatives:[{
                    type: "non-linear",
                    mediaFiles: [{}]
                  }],
                  errorURLTemplates: "error!"
                }]
              };
              callback(fake_response);
            });
        });
        it("should do nothing with non-linear ads, and report the error", function() {
          player.vast({ url: 'balhbahblhab' });
          spyOn(DMVAST.util, "track");
          spyOn(player, "trigger");
          player.vast.getContent("some url");
          expect(DMVAST.util.track).toHaveBeenCalledWith(
            jasmine.any(String), jasmine.any(Object)
          );
          expect(player.trigger).toHaveBeenCalledWith("adtimeout");
        });
      });

    });
  });
});