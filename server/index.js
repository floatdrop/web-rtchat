'use strict';

var PeerServer = require('peer').PeerServer;

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

var server = app.listen(port);

var peerServer = PeerServer({
    path: '/api/',
    server: server
});

app.use(peerServer);

app.initialize(peerServer);

console.log('Server listening on port ' + port);
