#!/usr/bin/env node

if (process.env.NODETIME) {
    require('nodetime').profile({
        accountKey: process.env.NODETIME,
        appName: 'swarming'
    });
}

var server = require('http').createServer(require('./app.js')),
    port = 8080,
    url  = 'http://localhost:' + port + '/';

if (process.env.SUBDOMAIN) {
    url = 'http://' + process.env.SUBDOMAIN + '.jit.su/';
}

server.listen(port);
console.log('Express server listening on port ' + port);
console.log(url);
