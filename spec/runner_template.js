var template = __dirname + "/runner.tmpl";

exports.process = function(grunt, task, context) {
  var source = grunt.file.read(template);
  return grunt.util._.template(source, context);
};