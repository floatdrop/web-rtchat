/* global App, Ember, moment */
(function () {

    App = Ember.Application.create();

    App.Router.map(function () {
        this.resource('join', { path: '/' });
        this.resource('room', function () {
            this.route('view', { path: '/:room_name' });
        });
    });

    App.RoomRoute = Ember.Route.extend({
        model: function () {
            return {
                messages: [{
                    author: 'Name',
                    content: 'Hello!',
                    date: Date()
                },{
                    author: 'Anonymous',
                    content: 'Hi!',
                    date: Date()
                }],
                users: ['Name', 'Anonymous']
            };
        }
    });

    App.ActiveRoomsView = Ember.View.create({
        templateName: 'active-rooms',
        rooms: Ember.ArrayController.create()
    });

    App.ActiveRoomsView.rooms.set('content', ['Swarm']);

    App.JoinRoute = Ember.Route.extend({
        actions: {
            goToLink: function(item) {
                App.ActiveRoomsView.rooms.addObject(item);
                this.transitionTo('room.view', item);
            }
        }
    });

    Ember.Handlebars.helper('format-date', function (value, options) {
        return moment(value).calendar();
    });

// var peer = new Peer({
//     host: '/',
//     port: window.location.hostname === 'localhost' ? 5000 : 80,
//     path: '/api/'
// });

})();
