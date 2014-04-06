/* global App:true, Ember, Em, moment, $, Peer */
(function () {

    App = Ember.Application.create();

    App.Router.map(function () {
        this.resource('join', { path: '/' });
        this.resource('room', { path: '/room/:room_name' });
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

    var rooms = {};
    var peers = {};
    var connections = {};

    App.RoomController = Em.ObjectController.extend({
        name: 'Unknown',
        actions: {
            sendMessage: function () {
                var self = this;
                var message = this.get('message');
                this.get('messages').pushObject({
                    author: this.get('user.name'),
                    content: message,
                    date: Date()
                });
                this.get('users').forEach(function (user) {
                    if (user.id === self.get('id')) { return; }
                    console.log('Broadcasting the message to ' + user.id);
                    self.getConnection(user.id, function (conn) {
                        conn.send({
                            type: 'MESSAGE',
                            user: self.get('user'),
                            date: Date(),
                            message: message
                        });
                    });
                });
                this.set('message', '');
            }
        },
        getConnection: function (id, cb) {
            console.log(connections[id]);
            if (connections[id]) {
                console.log('Connection to ' + id + ' from cache: ', connections[id]);
                return cb(connections[id]);
            }
            console.log('Creating connection to ' + id);
            var peer = peers[this.get('room.name')];
            var conn = peer.connect(id);
            conn.on('open', function () {
                console.log('Connection to ' + id + ' established: ', conn);
                connections[id] = conn;
                cb(conn);
            });
        },
        greetUser: function (user) {
            var self = this;
            console.log('Greeting user ', user);
            this.getConnection(user.id, function (conn) {
                conn.send({
                    type: 'GREETINGS',
                    user: self.get('user')
                });
            });
        },
        createPeer: function () {
            var room = this.get('room.name');
            var id = this.get('id');
            var self = this;
            if (id === undefined) { return; }
            console.log('User created', id);
            var peer = peers[room] = new Peer(id, {
                host: '/',
                port: window.location.hostname === 'localhost' ? 8080 : 80,
                path: '/api/'
            });
            peer.on('connection', function (conn) {
                console.log('Incoming connection', conn);
                var id = conn.peer;
                conn.on('data', function (data) {
                    console.log('Message from ' + id + ': ', data);
                    if (!data.type) { return console.log('Malformed message from ' + id); }
                    if (data.type === 'GREETINGS') {
                        self.get('users').addObject(data.user);
                    }
                    if (data.type === 'MESSAGE') {
                        self.get('messages').pushObject({
                            author: data.user.name,
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
            peer.on('open', this.fetchUsers.bind(this));
        }.observes('id').on('didInsertElement'),
        fetchUsers: function () {
            var self = this;
            var id = self.get('id');
            $.getJSON('/api/folks/' + this.get('room.name'))
                .done(function (folks) {
                    folks.forEach(function (user) {
                        if (user.id === id) {
                            self.set('user', {
                                name: user.name,
                                id: id
                            });
                        }
                        self.get('users').addObject(user);
                        if (user.id !== id) { self.greetUser(user); }
                    });
                });
        }
    });


    App.RoomRoute = Ember.Route.extend({
        model: function (params) {
            var room = params.room_name;

            if (rooms[room]) { return rooms[room]; }

            var model = Em.Object.create({
                id: undefined,
                users: [],
                room: {
                    name: room
                }
            });
            $.getJSON('/api/room/' + room)
                .done(function (data) {
                    model.setProperties(data);
                });

            rooms[room] = model;

            return model;
        }
    });

    App.ActiveRoomsView = Ember.View.create({
        templateName: 'active-rooms',
        rooms: Ember.ArrayController.create()
    });

    App.ActiveRoomsView.rooms.set('content', ['Swarm']);

    App.JoinRoute = Ember.Route.extend({
        actions: {
            goToLink: function (item) {
                App.ActiveRoomsView.rooms.addObject(item);
                this.transitionTo('room', item);
            }
        }
    });

    Ember.Handlebars.helper('format-date', function (value, options) {
        return moment(value).calendar(options);
    });

})();
