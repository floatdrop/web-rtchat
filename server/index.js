#!/usr/bin/env node

var restify = require('restify');

if (process.env.NODETIME) {
    require('nodetime').profile({
        accountKey: process.env.NODETIME,
        appName: 'swarming'
    });
}

var PeerServer = require('peer').PeerServer;
var port = Number(process.env.PORT || 5000);

var server = new PeerServer({
    port: port,
    path: 'api'
});

server.on('connection', function (id) {
    console.log('connected ' + id);
});

server.on('disconnect', function (id) {
    console.log('disconnected ' + id);
});

server._app.get('/?.*', restify.serveStatic({
  directory: './public',
  default: 'index.html'
}));

console.log("Server started at " + port);
