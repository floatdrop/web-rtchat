/* global App:true, Ember, Em, moment, $, Peer */
(function () {

    App = Ember.Application.create();

    App.Router.map(function () {
        this.resource('join', { path: '/' });
        this.resource('room', { path: '/room/:room_name' });
    });

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
        }
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

    function greetUser(id) {
        // var peer = peers[id] || new Peer()
    }

    function fetchUsers(id) {
        var self = this;
        $.getJSON('/api/folks/' + this.get('room.name'))
            .done(function (folks) {
                folks.forEach(function (user) {
                    if (user.id === id) {
                        self.set('user', {
                            name: user.name,
                            id: id
                        });
                    }
                    var users = self.get('users');
                    for (var i = users.length - 1; i >= 0; i--) {
                        if (users[i].id === user.id) { return false; }
                    }
                    greetUser(user.id);
                    users.pushObject(user);
                });
            });
    }

    App.RoomRoute = Ember.Route.extend({
        model: function (params) {
            var room = params.room_name;

            if (rooms[room]) { return rooms[room]; }

            var model = Em.Object.create({
                users: [],
                room: {
                    name: room
                }
            });

            $.getJSON('/api/room/' + room)
                .done(function (data) {
                    peers[room] = new Peer(data.id, {
                        host: '/',
                        port: window.location.hostname === 'localhost' ? 5000 : 80,
                        path: '/api/'
                    });
                    peers[room].on('open', fetchUsers.bind(model, data.id));

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
