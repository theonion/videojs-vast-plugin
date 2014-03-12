'use strict';

var specs = "spec/*Spec.js",
    helpers = "spec/*Helpers.js";

var _ = require('lodash');

var desireds = require('./spec/desireds.js');

var gruntConfig = {
  env: {
    // dynamically filled
  },
  jshint: {
    ignore_warning: {
      options: {
        '-W083': true,
      },
      src: ['videojs.vast.js', specs],
    }, 
  },
  jasmine: {
    src: 'videojs.vast.js',
    options: {
      specs: specs,
      helpers: helpers,
      vendor: [
        "http://vjs.zencdn.net/4.4.3/video.js",
        "lib/videojs-contrib-ads/video.ads.js",
        "lib/vast-client.js"
      ]
    }
  },
  simplemocha: {
    sauce: {
      options: {
        timeout: 60000,
        reporter: "spec"
      },
      src: ["spec/sauce-wd.js"]
    }
  },
  concurrent: {
    "test-sauce": []
  },
  watch: {
    scripts: {
      files: ['*.js', 'spec/*.js'],
      tasks: ['jshint', 'jasmine']
    },
  }
};

_(desireds).each(function(desired, key) {
    gruntConfig.env[key] = { 
        DESIRED: JSON.stringify(desired)
    };
    gruntConfig.concurrent['test-sauce'].push('test:sauce:' + key);
});

module.exports = function(grunt) {
  grunt.initConfig(gruntConfig);

  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('default', ['test:sauce:' + _(desireds).keys().first()]);

  _(desireds).each(function(desired, key) {
    grunt.registerTask('test:sauce:' + key, ['env:' + key, 'simplemocha:sauce']);
  });

  grunt.registerTask('default', ['jshint', 'jasmine', 'watch']);
  grunt.registerTask('travis', ['jshint', 'jasmine', 'concurrent:test-sauce']);
};