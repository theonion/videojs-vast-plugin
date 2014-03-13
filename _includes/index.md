

This plugin reads a [VAST file](https://www.iab.net/vast), grabs the first video it can, and plays it as pre-roll advertisement before your video. It will also click through to whatever url the advertiser designates, track any clicks, and fire all of the correct pixel trackers at the right times.

<iframe src="http://ghbtns.com/github-btn.html?user=theonion&amp;repo=videojs-vast-plugin&amp;type=watch&amp;count=true&amp;size=large"
  allowtransparency="true" frameborder="0" scrolling="0" width="170" height="30"></iframe><br/>

## Try it out!

* You want to create an "about me" page from a single markdown file and host it under a custom domain name.
* You want to create a single-page website that's mostly text, like [Know Your Company](https://knowyourcompany.com/).
* You want to share a single markdown file and tried GitHub Gist ([example](https://gist.github.com/dypsilon/5819504)), but would like something nicer-looking.
* You want something like GitHub's [automatic page generator](http://pages.github.com/) for a non-code repository.

## Usage
Include the plugin and it's dependencies:

```
<script src="http://vjs.zencdn.net/4.4.3/video.js"></script>
<script src="vast-client.js"></script>
<script src="video.ads.js"></script>
<script src="videojs.vast.js"></script>
```

Add "ads" and "vast" to the plugins object, and pass a url:

    plugins: {
        ads: {},
        vast: {
            url: 'http://url.to.your/vast/file.xml'
        }
    }

And when you play that video, a pre-roll ad should play beforehand.

Check out the [demo](https://github.com/theonion/videojs-vast-plugin/blob/master/example.html) for a more detailed example.


<a href="https://github.com/theonion/videojs-vast-plugin"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"></a>