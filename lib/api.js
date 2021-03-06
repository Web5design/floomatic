var fs = require("fs");

var log = require("floorine");
var request = require('request');

var utils = require("./utils");


request = request.defaults({
  strictSSL: true
});

exports.del = function (host, username, owner, secret, workspace, cb) {
  var options = {
    uri: "https://" + host + '/api/workspace/' + owner + '/' + workspace
  };
  request.del(options, cb).auth(username, secret);
};

exports.create = function (host, username, owner, secret, workspace, perms, cb) {
  var err_start = 'Could not create workspace ' + owner + '/' + workspace + ': ',
    options,
    url = 'https://' + host + '/' + owner + '/' + workspace;

  options = {
    uri: "https://" + host + '/api/workspace/',
    json: {
      name: workspace,
      owner: owner
    }
  };

  if (perms) {
    options.json.perms = perms;
  }

  request.post(options, function (err, result, body) {
    var data = {};

    if (err) {
      log.log("Error creating workspace:", err);
      return cb(err);
    }
    if (body) {
      body = body.detail || body;
    }

    if (result.statusCode === 401) {
      return cb(new Error(err_start + 'Your credentials are wrong. see https://floobits.com/help/floorc/' + '\nHTTP status ' + result.statusCode + ': ' + body));
    }
    if (result.statusCode === 402) {
      return cb(new Error(err_start + body.toString()));
    }
    if (result.statusCode === 403) {
      return cb(new Error(err_start + 'You do not have permission. see https://floobits.com/help/floorc/'));
    }
    if (result.statusCode === 409) {
      log.warn('This workspace already exists.');
    } else if (result.statusCode >= 400) {
      return cb(new Error(err_start + ' HTTP status ' + result.statusCode + ': ' + body));
    }
    log.log('Created workspace', url);

    data = utils.load_floo();
    data.url = url;
    /*jslint stupid: true */
    fs.writeFileSync(".floo", JSON.stringify(data), 'utf-8');
    /*jslint stupid: false */
    cb();
  }).auth(username, secret);
};
