var express = require('express');
var app = express();

app.use(express.static(__dirname + '/../public'));

app.initialize = function(peerServer) {
    peerServer.on('connection', function (id) {
        console.log('connected ' + id);
    });

    peerServer.on('disconnect', function (id) {
        console.log('disconnected ' + id);
    });
};

module.exports = app;
