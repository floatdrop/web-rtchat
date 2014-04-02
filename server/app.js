var express = require('express'),
    app = express();

var httpProxy = require('http-proxy')
    .createProxyServer({target:'http://localhost:8081'});

app.use(express.static(__dirname + '/../public'));

module.exports = app;
