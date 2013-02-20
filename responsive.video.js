function responsive (options) {

  options = options || {};

  var responsiveEl = document.createElement('div');
  responsiveEl.className = 'vjs-responsive';
  this.el().appendChild(responsiveEl);

  this.on('loadedmetadata', function() {
    var height, width;
    var techEl = this.el().getElementsByClassName("vjs-tech")[0];
    var posterEl = this.el().getElementsByClassName("vjs-poster")[0];
    if(techEl.videoHeight && techEl.videoWidth) {
      width = techEl.videoWidth;
      height = techEl.videoHeight;
    }

    // If the aspectRatio is specified, trust that.
    if (options.aspectRatio) {
      width = options.aspectRatio[0];
      height = options.aspectRatio[1];
    }

    // If we made a responsive div, and have a height and width, then let's do this thing.
    if(width && height) {

      this.el().style.display = 'inline-block';
      this.el().style.position = 'relative';
      this.el().style.height = '';
      this.el().style.width = '';

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
}