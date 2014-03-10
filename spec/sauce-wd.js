var webdriver = require('wd')
  , assert = require('assert')
  , util = require('util');

var browser = webdriver.remote(
  util.format(
    "http://%s:%s@ondemand.saucelabs.com:80/wd/hub",
    process.env.SAUCE_USERNAME,
    process.env.SAUCE_ACCESS_KEY
  )
);

browser.on('status', function(info){
  console.log('\x1b[36m%s\x1b[0m', info);
});

browser.on('command', function(meth, path){
  console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
});

var desired = {
  browserName: 'iphone',
  version: '5.0',
  platform: 'Mac 10.6',
  name: "FINALLLYLYY",
  tags: [process.env.TRAVIS_NODE_VERSION.toString(), 'CI'],
  "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER
}

browser.init(desired, function() {
  browser.get("http://saucelabs.com/test/guinea-pig", function() {
    browser.title(function(err, title) {
      assert.ok(~title.indexOf('I am a page title - Sauce Labs'), 'Wrong title!');
      browser.elementById('submit', function(err, el) {
        browser.clickElement(el, function() {
          browser.eval("window.location.href", function(err, href) {
            assert.ok(~href.indexOf('guinea'), 'Wrong URL!');
            browser.quit()
          })
        })
      })
    })
  })
})