'use strict';

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

'use strict';

var PeerServer = require('peer').PeerServer;

var app = require('./app');

var server = app.listen(port);

var peerServer = PeerServer({
    path: '/api/',
    server: server
});

app.use(peerServer);

peerServer.on('connection', function (id) {
    console.log('connected ' + id);
});

peerServer.on('disconnect', function (id) {
    console.log('disconnected ' + id);
});

console.log('Server listening on port ' + port);
console.log(url);
