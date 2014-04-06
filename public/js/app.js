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
                this.get('messages').pushObject({
                    author: this.get('user.name'),
                    content: this.get('message'),
                    date: Date()
                });
                this.set('message', '');
            }
        },
        getConnection: function (id, cb) {
            if (connections[id]) {
                console.log('Connection to ' + id + ' established: ', connections[id]);
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
        addUser: function (user) {
            var users = this.get('users');
            for (var i = users.length - 1; i >= 0; i--) {
                if (users[i].id === user.id) { return false; }
            }
            return users.pushObject(user);
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
                        self.addUser(data.user);
                    }
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
                        self.addUser(user);
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
