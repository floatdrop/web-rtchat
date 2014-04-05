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
                    author: this.get('name'),
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

    App.UsersListController = Em.ObjectController.extend({
        actions: {
            alertModel: function () {
                console.log(this.get('model'));
            }
        }
    });

    App.Users = Em.Object.create({
        users: []
    });

    var rooms = {};
    var peers = {};

    App.RoomRoute = Ember.Route.extend({
        model: function (params) {
            var room = params.room_name;
            this.set('currentRoom', room);
            var self = this;
            return rooms[room] || $.getJSON('/api/room/' + room)
                .done(function (data) {
                    peers[room] = new Peer(data.id, {
                        host: '/',
                        port: window.location.hostname === 'localhost' ? 5000 : 80,
                        path: '/api/'
                    });

                    peers[room].on('open', function () {
                        $.getJSON('/api/folks/' + self.get('currentRoom'))
                            .done(function (folks) {
                                folks.forEach(function (user) {
                                    if (user.id === data.id) {
                                        self.controllerFor('room').set('name', user.name);
                                    }
                                    var users = App.Users.get('users');
                                    for (var i = users.length - 1; i >= 0; i--) {
                                        if (users[i].id === user.id) { return false; }
                                    }
                                    App.Users.get('users').pushObject(user);
                                });
                            });
                    });

                    rooms[room] = data;
                    return data;
                });
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
                this.transitionTo('room.view', item);
            }
        }
    });

    Ember.Handlebars.helper('format-date', function (value, options) {
        return moment(value).calendar(options);
    });

})();
