'use strict';

var PeerServer = require('./peer').PeerServer;
// var fs = require('fs');
// var http = require('http');
// var https = require('https');

if (process.env.NODETIME) {
    require('nodetime').profile({
        accountKey: process.env.NODETIME,
        appName: 'swarming'
    });
}

var port = Number(process.env.PORT || 8080),
    url  = 'http://localhost:' + port + '/';

if (process.env.SUBDOMAIN) {
    url = 'http://' + process.env.SUBDOMAIN + '.jit.su/';
}

var app = require('./app');

var server = app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});

var peerServer = new PeerServer({
    path: '/api/',
    server: server
});

if (process.env.MONGO_CS) {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(process.env.MONGO_CS, function (err, db) {
        if (err) { throw err; }
        peerServer.on('trace', function (data) {
            data.payload.date = Date();
            db.collection('latency').insert(data.payload, function () {
                if (err) { console.log(err); }
                console.log(data.payload.p1 + ' --- ' + data.payload.latency + ' --> ' + data.payload.p2);
            });
        });
    });
}

app.use(peerServer);

app.initialize(peerServer);
