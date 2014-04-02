var PeerServer = require('peer').PeerServer;

var server = new PeerServer({
    port: 8081
});

server.on('connection', function (id) {

});

server.on('disconnect', function (id) {

});
