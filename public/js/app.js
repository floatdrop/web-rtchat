/* global App:true, Ember, Em, moment, $, Peer */
(function () {

    App = Ember.Application.create();

    App.Router.map(function () {
        this.resource('join', { path: '/' });
        this.resource('chat', { path: '/chat' });
    });

    App.ChatMessagesView = Ember.View.extend({
        templateName: 'chat-messages',
        messagesChanged: function () {
            setTimeout(function () {
                var messages = $('#messages');
                var height = messages[0].scrollHeight;
                messages.scrollTop(height);
            }, 0);
        }.observes('controller.messages.@each').on('didInsertElement')
    });

    var connections = {};
    var peer;
    var latency = Ember.Object.create();

    App.ChatController = Em.ObjectController.extend({
        actions: {
            sendMessage: function () {
                var self = this;
                var message = this.get('message');
                this.get('messages').pushObject({
                    author: this.get('id'),
                    content: message,
                    date: Date()
                });
                this.get('users').forEach(function (user) {
                    if (user.id === self.get('id')) { return; }
                    self.getConnection(user, function (conn) {
                        var data = {
                            type: 'MESSAGE',
                            user: self.get('id'),
                            date: Date(),
                            message: message
                        };
                        console.log('<<< MESSAGE ' + user.id + ': ', data);
                        conn.send(data);
                    });
                });
                this.set('message', '');
            }
        },
        getConnection: function (id, cb) {
            if (!id) { return console.log('!!! getConnection called without id'); }
            if (connections[id]) {
                console.log('<<< CACHED CONNETION ' + id + ': ', connections[id]);
                return cb(connections[id]);
            }
            var conn = peer.connect(id);
            if (!conn) { return console.log('!!! Failed to fetch connection for ' + id); }
            connections[id] = conn;
            conn.on('open', function () {
                console.log('<<< CONNETION ' + id + ': ', connections[id]);
                cb(conn);
            });
        },
        greetUser: function (user) {
            var self = this;
            console.log('Greeting user ', user);
            this.getConnection(user.id, function (conn) {
                var data = {
                    type: 'GREETINGS',
                    user: self.get('id'),
                    sended: (new Date()).getTime()
                };
                console.log('<<< GREETINGS ' + user.id + ': ', data);
                conn.send(data);
            });
        },
        fetchUsers: function () {
            var self = this;
            var id = self.get('id');
            $.getJSON('/api/folks')
                .done(function (folks) {
                    folks.forEach(function (user) {
                        self.get('users').addObject(user.id);
                        if (user.id !== id) { self.greetUser(user); }
                    });
                });
        },
        setupPeer: function () {
            var self = this;
            peer.on('connection', function (conn) {
                console.log('>>> CONNECTION: ', conn);
                var id = conn.peer;
                conn.on('data', function (data) {
                    if (!data.type) { return console.log('Malformed message from ' + id); }
                    if (data.type === 'LATENCY') {
                        console.log('>>> LATENCY ', data);
                        latency.set(data.id, data.recieved - data.sended);
                        peer.trace({
                            latency: data.recieved - data.sended,
                            p1: self.get('id'),
                            p2: id
                        });
                    }
                    if (data.type === 'GREETINGS') {
                        console.log('>>> GREETINGS ' + id + ': ', data);
                        var recieved = (new Date()).getTime();
                        self.getConnection(id, function (c) {
                            console.log('<<< LATENCY ');
                            c.send({
                                type: 'LATENCY',
                                id: id,
                                recieved: recieved,
                                sended: data.sended
                            });
                        });
                        latency.set(id, data.recieved - data.sended);
                        peer.trace({
                            latency: recieved - data.sended,
                            p1: self.get('id'),
                            p2: id
                        });
                        self.get('users').addObject(data.user);
                    }
                    if (data.type === 'MESSAGE') {
                        console.log('>>> MESSAGE ' + id + ': ', data);
                        self.get('messages').pushObject({
                            author: data.user,
                            content: data.message,
                            date: data.data
                        });
                    }
                });
                conn.on('close', function () {
                    console.log('Connection to ' + id + ' closed');
                    self.get('users').forEach(function (user) {
                        if (user.id === id) {
                            self.get('users').removeObject(user);
                        }
                    });
                });
            });
        }
    });


    App.ChatRoute = Ember.Route.extend({
        setupController: function (controller, model) {
            if (!peer) { return controller.transitionToRoute('/'); }
            controller.set('model', model);
            controller.setupPeer();
            controller.fetchUsers();
        },
        model: function () {
            return {
                id: (peer || {}).id,
                users: [],
                messages: []
            };
        }
    });

    App.JoinRoute = Ember.Route.extend({
        createPeer: function (id, cb) {
            peer = new Peer(id, {
                host: '/',
                port: window.location.hostname === 'localhost' ? 8080 : 80,
                path: '/api/'
            });
            peer.on('error', cb);
            peer.on('open', function () { cb(); });
        },
        actions: {
            goToLink: function (nick) {
                var self = this;
                this.createPeer(nick, function (err) {
                    if (!err) {
                        self.transitionTo('/chat');
                    } else {
                        console.log(err);
                    }
                });

            }
        }
    });

    Ember.Handlebars.helper('format-date', function (value, options) {
        return moment(value).calendar(options);
    });

})();
