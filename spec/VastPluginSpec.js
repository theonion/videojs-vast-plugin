(function(){
  "use strict";

  var player;

  beforeEach(function() {
    var id = "vid";
    (function() {
      var video = document.createElement("video");
      video.id = id;
      video.src = "http://vjs.zencdn.net/v/oceans.mp4";
      video.setAttribute = "controls";
      document.body.appendChild(video);
    })();
    player = videojs(id);
  });

  afterEach(function() {
    player.dispose();
  });

  describe("VideoJS plugin testing logistics", function() {
    it("is registered", function() {
      expect(player.vast).toBeDefined();
    });
  });

})();
