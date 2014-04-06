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

var rooms = {};

var users = {};

var pending = {};

app.get('/api/folks/:room', function (req, res, next) {
    var room = req.params.room;
    if (!room) { return res.send(400); }
    if (!rooms[room]) { return res.send(404); }

    var data = _.map(rooms[room].users, function (user) {
        return {
            id: user,
            name: users[user].name
        };
    });

    console.log('--- Fetched ' + data.length + ' folks  for ' + room + ' room');

    res.json(data);
});

app.get('/api/room/:room', function (req, res, next) {
    var room = req.params.room;
    if (!room) { return res.send(400); }

    if (!rooms[room]) {
        rooms[room] = {
            users: []
        };
    }

    var data = {
        id: uuid4(),
        messages: [],
        users: rooms[room].users
    };

    pending[data.id] = room;

    console.log('--- ' + data.id + ' is about to join to ' + room + ' room');

    res.json(data);
});

app.initialize = function (peerServer) {
    peerServer.on('connection', function (id) {
        console.log('>>> ' + id + ' connecting');
        var room = pending[id];
        delete pending[id];
        if (!rooms[room]) { return console.log('>>? Room ' + room + ' is not exist'); }
        rooms[room].users.push(id);
        users[id] = {
            name: generateName(),
            room: room
        };
        console.log('>>> ' + id + ' connected to ' + room + ' room');
    });

    peerServer.on('disconnect', function (id) {
        if (!users[id]) { return console.log('<<?' + id + ' already disconnected'); }
        var room = users[id].room;
        if (!room) { return console.log('<<?' + id + ' disconnected, but was not bounded to any room'); }
        console.log('    ' + id + ' was found in ' + room);
        rooms[room].users = _.without(rooms[room].users, id);
        delete users[id];
        console.log('<<< ' + id + ' disconnected');
    });
};

module.exports = app;
