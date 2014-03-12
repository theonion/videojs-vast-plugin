videojs-vast-plugin [![Build Status](https://travis-ci.org/theonion/videojs-vast-plugin.png?branch=master)](https://travis-ci.org/theonion/videojs-vast-plugin)
===================

This plugin reads a [VAST file](https://www.iab.net/vast), grabs the first video it can, and plays it as pre-roll advertisement before your video. It will also click through to whatever url the advertiser designates, track any clicks, and fire all of the correct pixel trackers at the right times.

###Usage
Include the plugin and it's dependencies:

```
<script src="http://vjs.zencdn.net/4.4.3/video.js"></script>
<script src="vast-client.js"></script>
<script src="video.ads.js"></script>
<script src="videojs.persistvolume.js"></script>
```

Add "ads" and "vast" to the plugins object, and pass a url:

    plugins: {
        ads: {},
        vast: {
            url: 'http://url.to.your/vast/file.xml'
        }
    }
