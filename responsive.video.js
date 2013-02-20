_V_.Responsive = _V_.Component.extend({

    ratio: "widescreen",

    init: function(player, options){
        this._super(player, options);
        
        if(options.ratio !== undefined) {
            this.ratio = options.ratio;
        }

        player.addEvent("loadedmetadata", this.proxy(this.resize));
    },

    resize: function() {
        var height, width;
        var techEl = this.player.el.getElementsByClassName("vjs-tech")[0];
        var posterEl = this.player.el.getElementsByClassName("vjs-poster")[0];
        if(techEl.videoHeight && techEl.videoWidth) {
          width = techEl.videoWidth;
          height = techEl.videoHeight;
        }

        // If we made a responsive div, and have a height and width, then let's do this thing.
        if (width && height) {
            this.player.el.style.display = 'inline-block';
            this.player.el.style.position = 'relative';
            this.player.el.style.height = '';
            this.player.el.style.width = '';
              
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

            this.el.style.paddingTop = ((height / width) * 100 ) + '%';
        }
    },

    createElement: function(){
        return _V_.createElement("div", {
            className: ("video-size")
        });
    }
});