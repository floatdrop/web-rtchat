'use strict';

var express = require('express');
var PeerServer = require('peer').PeerServer;

var server = PeerServer({
    path: '/api/'
});

server.on('connection', function (id) {
    console.log('connected ' + id);
});

server.on('disconnect', function (id) {
    console.log('disconnected ' + id);
});

var lrSnippet = require('connect-livereload')({port: 35729});
server.use(lrSnippet);
server.use(express.static(__dirname + '/../.tmp'));
server.use(express.static(__dirname + '/../public/app'));

module.exports = server;
