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

        video.buffered = 0;

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
      expect(console.log).toHaveBeenCalledWith(jasmine.any(String));
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

    it("should request an ad if a source is already loaded", function() {
      this.p.currentSrc = function() {
        return "video.mp4";
      };
      spyOn(vast.client, "get");
      this.p.ads();
      this.p.vast({url:"i wanna go VAST!"});
      expect(vast.client.get).toHaveBeenCalledWith("i wanna go VAST!", jasmine.any(Function));
    });
  });


  describe("Public methods", function() {

    describe("createSourceObjects", function() {

      it("should return objects with 'src', 'type', 'width', and 'height' properties", function() {
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

      //phantomjs does not support video
      xit("should not accept all video formats", function() {
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/flv",
            width: 640,
            height: 360
          },
          {
            fileURL: "So Trill",
            mimeType: "video/x-flv",
            width: 512,
            height: 288
          },
          {
            fileURL: "Skrill, WHERES MY SKRILL",
            mimeType: "video/mpeg",
            width: 0,
            height: 0
          },
          {
            fileURL: "Jack and Jill",
            mimeType: "video/ogg",
            width: 1280,
            height: 720
          },
          {
            fileURL: "-- Code Raps -- ",
            mimeType: "hls/playlist.m3u8",
            width: 640,
            height: 480
          },
          {
            fileURL: "I'm tapped",
            mimeType: "video/avi",
            width: 512,
            height: 384
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 1920,
            height: 1080
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        expect(sources.length).toBe(1);
      });

      //phantomjs does not support video
      xit("can return sources with duplicate formats", function() {
        var media_files = [
          {
            fileURL: "TRL",
            mimeType: "video/mp4",
            width: 640,
            height: 360
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 853,
            height: 480
          }
        ];
        var sources = player.vast.createSourceObjects(media_files);
        expect(sources.length).toBe(2);
      });

    });
    
    describe("tearDown", function() {

      it("should end the linear ad", function(done) {
        spyOn(player.ads, "endLinearAdMode").and.callFake(done);
        spyOn(player, "off");

        // TODO: fix this
        player.vast.skipButton = document.createElement("div");
        player.el().appendChild(player.vast.skipButton);
        player.vast.blocker = document.createElement("a");
        player.el().insertBefore(player.vast.blocker, player.controlBar.el());

        player.vast.tearDown();
        expect(player.off).toHaveBeenCalledWith("ended", jasmine.any(Function));
      });
    });

    describe("preroll", function() {

      beforeEach(function() {
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
        spyOn(vast.client, "get").and.callFake(function(url, callback){
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
          spyOn(vast.client, "get")
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

        //phantomjs does not support video
        xit("should create a vast tracker", function() {
          spyOn(vast, "tracker");
          player.vast.getContent("some url");
          expect(vast.tracker).toHaveBeenCalled();
          expect(player.vastTracker).toBeDefined();
        });

        //phantomjs does not support video
        xit("should guarantee that assetDuration is defined", function() {
          spyOn(vast, "tracker").and.returnValue({
            setProgress: function(){}
          });
          spyOn(player, "duration").and.returnValue(11);
          spyOn(player, "currentTime").and.returnValue(11);
          player.vast.getContent("some url");

          /* 
            Forcing some implementation here, but the
            duration fail-safe is a hack anyway.
          */
          player.trigger("timeupdate");
          expect(player.vastTracker.assetDuration).toBe(11);
        });

        //phantomjs does not support video
        xit("should trigger the 'adsready' event", function() {
          spyOn(player, "trigger");
          player.vast.getContent("some url");
          expect(player.trigger).toHaveBeenCalledWith("adsready");
        });
      });

      describe("non-linear ads", function() {
        beforeEach(function() {
          spyOn(vast.client, "get")
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
          spyOn(vast.util, "track");
          spyOn(player, "trigger");
          player.vast.getContent("some url");
          expect(vast.util.track).toHaveBeenCalledWith(
            jasmine.any(String), jasmine.any(Object)
          );
          expect(player.trigger).toHaveBeenCalledWith("adtimeout");
        });
      });

    });

    describe("findOptimalVPAIDTech", function() {
      it("should return javascript media", function() {
        var mediaFiles = [
          {
            fileURL: "TRL",
            mimeType: "video/mp4",
            width: 640,
            height: 360
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 853,
            height: 480
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "application/x-shockwave-flash",
            width: 853,
            height: 480,
            apiFramework: "VPAID"
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "application/javascript",
            width: 853,
            height: 480,
            apiFramework: "VPAID"
          }
        ];

        expect(player.vast.findOptimalVPAIDTech(mediaFiles).mimeType).toEqual('application/javascript');
      });


      it("should return flash file as the only present VPAID type in media files", function() {
        var mediaFiles = [
          {
            fileURL: "TRL",
            mimeType: "video/mp4",
            width: 640,
            height: 360
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "application/x-shockwave-flash",
            width: 853,
            height: 480,
            apiFramework: "VPAID"
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 853,
            height: 480
          }
        ];

        expect(player.vast.findOptimalVPAIDTech(mediaFiles).mimeType).toEqual('application/x-shockwave-flash');
      });

      it("should return null as VPAID tech is not found", function() {
        var mediaFiles = [
          {
            fileURL: "TRL",
            mimeType: "video/mp4",
            width: 640,
            height: 360
          },
          {
            fileURL: "BuddhaForRill",
            mimeType: "video/mp4",
            width: 853,
            height: 480
          }
        ];

        expect(player.vast.findOptimalVPAIDTech(mediaFiles)).toBeNull();
      });
    });

  });

  describe("VPAID", function() {
    var vpaidTech = {
      "apiFramework": "VPAID",
      "bitrate": 0,
      "codec": null,
      "deliveryType": "progressive",
      "fileURL": "http://cdn-static.liverail.com/js/LiveRail.AdManager-1.0.js?LR_PUBLISHER_ID=1331&LR_FORMAT=application/javascript&LR_AUTOPLAY=0&LR_DEBUG=4",
      "height": 480,
      "maxBitrate": 0,
      "mimeType": "application/javascript",
      "minBitrate": 0,
      "width": 640
    };

    beforeEach(function() {
      spyOn(vast.client, "get").and.callFake(function(url, callback){
        var response = {
          "ads": [
            {
              "creatives": [
                {
                  "duration": 15,
                  "mediaFiles": [vpaidTech],
                  "skipDelay": null,
                  "trackingEvents": {},
                  "type": "linear",
                  "videoClickThroughURLTemplate": null,
                  "videoClickTrackingURLTemplates": []
                },
                {
                  "type": "companion",
                  "variations": [
                    {
                      "height": "250",
                      "id": null,
                      "staticResource": null,
                      "trackingEvents": {},
                      "type": null,
                      "width": "300"
                    },
                    {
                      "height": "60",
                      "id": null,
                      "staticResource": null,
                      "trackingEvents": {},
                      "type": null,
                      "width": "300"
                    },
                    {
                      "height": "90",
                      "id": null,
                      "staticResource": null,
                      "trackingEvents": {},
                      "type": null,
                      "width": "728"
                    }
                  ],
                  "videoClickTrackingURLTemplates": []
                }
              ],
              "errorURLTemplates": [],
              "impressionURLTemplates": [
                null
              ]
            }
          ],
          "errorURLTemplates": []
        };
        callback(response);
      });

      function MockVPAIDAd() {
        var self = this;

        this.listeners = {};
        this.totalListeners = function() {
          var total = 0;
          for (var event in self.listeners) {
            if (!self.listeners.hasOwnProperty(event)) {
              continue;
            }

            total += self.listeners[event].length;
          }

          return total;
        };

        this.handshakeVersion = function(version) {
          return version;
        };

        this.initAd = function() {
          this.trigger('AdLoaded');
        };

        this.subscribe = function(func, event) {
          if (self.listeners[event] === undefined) {
            self.listeners[event] = [];
          }
          self.listeners[event].push(func);
        };

        this.unsubscribe = function(func, event) {
          if (self.listeners[event] === undefined) {
            return;
          }

          var index = self.listeners[event].indexOf(func);
          if (index >= 0) {
            self.listeners[event].splice(index, 1);
          }
        };

        this.trigger = function(event) {
          if (self.listeners[event]) {
            for (var i = 0; i < self.listeners[event].length; i++) {
              self.listeners[event][i]();
            }
          }
        };

        return this;
      }

      var ad = new MockVPAIDAd();
      this.mockAd = ad;
      spyOn(player.vast, 'loadVPAIDResource').and.callFake(function(mediaFile, callback) {
        callback(ad);
      });
    });

    it("should load VAST, parse vpaid and call adsready", function(done) {
      var adsReadyCallback = jasmine.createSpy('adsReadyCallback').and.callFake(done);
      spyOn(this.mockAd, 'handshakeVersion').and.callThrough();
      spyOn(this.mockAd, 'initAd').and.callThrough();

      player.one('adsready', adsReadyCallback);


      player.vast.getContent("fake url");


      expect(player.vast.loadVPAIDResource).toHaveBeenCalled();
      expect(this.mockAd.handshakeVersion).toHaveBeenCalled();
      expect(this.mockAd.initAd).toHaveBeenCalled();
      expect(player.vastTracker).toBeDefined();
    });

    describe('events', function() {
      ['AdStopped', 'AdError'].forEach(function(event) {
        it('should call tearDown as soon as ' + event + ' event is triggered', function() {
          spyOn(player.vast, 'tearDown');

          player.vast.getContent("fake url");
          this.mockAd.trigger(event);

          expect(player.vast.tearDown).toHaveBeenCalled();
        });
      });

      it('should call tearDown and track event to VAST when AdSkipped event is triggered', function() {
        spyOn(player.vast, 'tearDown');

        player.vast.getContent("fake url");
        spyOn(player.vastTracker, 'skip');
        this.mockAd.trigger('AdSkipped');

        expect(player.vast.tearDown).toHaveBeenCalled();
        expect(player.vastTracker.skip).toHaveBeenCalled();
      });
    });

    describe('tearDown', function() {
      it('should correctly remove vpaid video element and show original after tearDown', function() {
        spyOn(player.vast, 'tearDown').and.callThrough();

        player.vast.getContent("fake url");
        expect(document.querySelectorAll('video').length).toEqual(2);
        expect(document.querySelector('.vjs-tech').style.display).toEqual('none');
        this.mockAd.trigger('AdStopped');

        expect(player.vast.tearDown).toHaveBeenCalled();
        expect(document.querySelectorAll('video').length).toEqual(1);
        expect(document.querySelector('.vjs-tech').style.display).toEqual('');
      });

      it('should remove all listeners from vpaid after tear down', function() {
        var callback = jasmine.createSpy('AdStoppedCallback');

        player.vast.getContent("fake url");
        player.vast.onVPAID('AdStopped', callback);
        player.vast.tearDown();

        expect(callback).not.toHaveBeenCalled();
        expect(this.mockAd.totalListeners()).toEqual(0);
      });

      it('should remove vpaid ad controls after tear down', function() {
        player.vast.getContent("fake url");

        expect(document.querySelector('.vast-ad-control')).not.toBeNull();
        player.vast.tearDown();
        expect(document.querySelector('.vast-ad-control')).toBeNull();
      });
    });
  });

  describe('Localization', function() {
    it('should use video.js localization if vjs.localize is available', function() {
      spyOn(player, 'localize');
      player.vast.createSkipButton();
      player.vast.enableSkipButton();

      expect(player.localize).toHaveBeenCalled();
    });

    it('should fallback to default text if vjs.localize is not available (prior to video.js 4.7.3)', function() {
      player.localize = undefined;
      player.vast.createSkipButton();
      player.vast.enableSkipButton();
    });
  });
})(window, videojs, DMVAST);
