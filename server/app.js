'use strict';

var express = require('express');
var _ = require('lodash');
var generateName = function () { return require('sillyname')().split(' ')[0]; };
var uuid4 = require('uuid').v4;

var app = express();

// function requireHTTPS(req, res, next) {
//     if (!req.secure) {
//         return res.redirect('https://' + req.get('host') + req.url);
//     }
//     next();
// }

// app.use(requireHTTPS);

app.use(express.static(__dirname + '/../public'));

var users = {};

app.get('/api/folks', function (req, res, next) {
    var data = _.map(users, function (user) {
        return {
            id: user.id,
            name: user.name
        };
    });

    console.log('--- Fetched ' + data.length + ' folks');

    res.json(data);
});

app.initialize = function (peerServer) {
    peerServer.on('connection', function (id) {
        users[id] = {
            name: id,
            id: id
        };
        console.log('>>> ' + id + ' connected');
    });

    peerServer.on('disconnect', function (id) {
        if (!users[id]) { return console.log('<<?' + id + ' already disconnected'); }
        delete users[id];
        console.log('<<< ' + id + ' disconnected');
    });
};

module.exports = app;
