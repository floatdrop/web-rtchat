'use strict';

var PeerServer = require('peer').PeerServer;
var fs = require('fs');
var http = require('http');
var https = require('https');

if (process.env.NODETIME) {
    require('nodetime').profile({
        accountKey: process.env.NODETIME,
        appName: 'swarming'
    });
}

var port = Number(process.env.PORT || 5000),
    url  = 'http://localhost:' + port + '/';

if (process.env.SUBDOMAIN) {
    url = 'http://' + process.env.SUBDOMAIN + '.herokuapp.com/';
}

var app = require('./app');

var options = {
    key: fs.readFileSync(__dirname + '/../ssl/self_signed/server.key'),
    cert: fs.readFileSync(__dirname + '/../ssl/self_signed/server.crt'),
    ca: fs.readFileSync(__dirname + '/../ssl/self_signed/ca.crt'),
};

// Create an HTTPS service identical to the HTTP service.
var sslServer = https.createServer(options, app).listen(port, function () {
    console.log('Secure Express server listening on port ' + port);
});

var peerServer = new PeerServer({
    path: '/api/',
    server: sslServer
});

app.use(peerServer);

app.initialize(peerServer);
