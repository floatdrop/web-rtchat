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

var app = require('./app');

app.listen(port);
console.log('Server listening on port ' + port);
console.log(url);
