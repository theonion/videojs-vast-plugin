module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    autoWatch: true,
    singleRun: false,
    browsers: ['PhantomJS'],

    files: [
      'bower_components/vast-client-js/vast-client.js',
      'bower_components/videojs/dist/video-js/video.js',
      'bower_components/videojs-contrib-ads/src/videojs.ads.js',
      'videojs.vast.js',
      'spec/VastPluginSpec.js'
    ],

    preprocessors: {
      'videojs.vast.js': 'coverage'
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/'
    }
  });

  if (process.env.TRAVIS) {
    config.singleRun = true;
    config.autoWatch = false;
  }
};