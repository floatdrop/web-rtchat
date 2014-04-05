/* global App:true, Ember, Em, moment */
(function () {

    App = Ember.Application.create();

    App.Router.map(function () {
        this.resource('join', { path: '/' });
        this.resource('room', function () {
            this.route('view', { path: '/:room_name' });
        });
    });

    App.RoomController = Em.ObjectController.extend({
        actions: {
            sendMessage: function (message) {
                this.get('model').get('messages').pushObject({
                    author: 'Name',
                    content: message,
                    date: Date()
                });
                this.set('message', '');
            }
        }
    });

    App.RoomRoute = Ember.Route.extend({
        model: function () {
            return Em.Object.create({
                messages: [{
                    author: 'Name',
                    content: 'Hello!',
                    date: Date()
                }, {
                    author: 'Anonymous',
                    content: 'Hi!',
                    date: Date()
                }],
                users: ['Name', 'Anonymous']
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

// var peer = new Peer({
//     host: '/',
//     port: window.location.hostname === 'localhost' ? 5000 : 80,
//     path: '/api/'
// });

})();
