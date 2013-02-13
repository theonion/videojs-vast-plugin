function responsive (options) {

  options = options || {};

  var responsiveEl = document.createElement('div');
  responsiveEl.className = 'vsj-responsive';
  this.getEl().appendChild(responsiveEl);

  this.on('loadedmetadata', function() {

    var height, width;
    var videoEl = this.getEl().getElementsByTagName("video")[0];
    if(videoEl.videoHeight && videoEl.videoWidth) {
      width = videoEl.videoWidth;
      height = videoEl.videoHeight;
    }

    // If the aspectRatio is specified, trust that.
    if (options.aspectRatio) {
      width = options.aspectRatio[0];
      height = options.aspectRatio[1];
    }

    // If we made a responsive div, and have a height and width, then let's do this thing.
    if(videoEl.localName === 'video' && width && height) {

      console.log("Setting up styles...");

      this.getEl().style.display = 'inline-block';
      this.getEl().style.position = 'relative';
      this.getEl().style.height = '';
      this.getEl().style.width = '';
      
      videoEl.style.position = 'absolute';
      videoEl.style.top = 0;
      videoEl.style.bottom = 0;
      videoEl.style.left = 0;
      videoEl.style.right = 0;
      videoEl.style.height = '';
      videoEl.style.width = '';

      responsiveEl.style.paddingTop = ((height / width) * 100 ) + '%';
    }
  });
}