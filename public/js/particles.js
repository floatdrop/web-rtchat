/* global $, Newton */

'use strict';

// Globals

var sim, renderer, container;
var particles, walls, particleMaterial, wallMaterial;
var gravity, radial, wind;
var mouseDown = false;

// Simulation

$(document).ready(function () {
    createSimulation();
    bindControls();
    startSimulation();
});

function createSimulation() {
    var $display = $('#display');
    var width = $display.width();
    var height = $display.height();

    particleMaterial = Newton.Material();
    wallMaterial = Newton.Material();

    renderer = Newton.GLRenderer($display[0]);
    sim = Newton.Simulator(simulate, renderer.callback, 60, 10);

    walls = createWalls();
    particles = Newton.Body(particleMaterial);
    gravity = Newton.LinearGravity(0, 0, 0);           // angle, strength, falloff power
    radial = Newton.RadialGravity(0, 0, -4, 2);        // x, y, strength, falloff power
    wind = Newton.LinearGravity(Math.PI * 0.5, 0.001, 0);
    container = Newton.WrapConstraint(0, 0, width, height);

    particles.free();

    sim
        .add(gravity, 'global')
        .add(wind, 'wind')
        .add(walls, 'shapes')
        .add(particles, 'particles')
        .add(radial, 'particles')
        .add(container, 'particles')
        .link('particles', 'particles shapes global');
}

function startSimulation() {
    sim.start();
    setInterval(showStats, 250);
}

function simulate(time) {
    if (mouseDown) {
        addParticles(radial.x, radial.y, ~~(time * 0.5));
    }
}

function showStats(time) {
    $('#fps').text(sim.fps);
    $('#particles').text(sim.particles.length);
    $('#edges').text(sim.edges.length);
    $('#constraints').text(sim.constraints.length);
    $('#forces').text(sim.forces.length);
}

// Utilities

function addParticles(x, y, n) {
    for (var i = 0; i < n; i++) {
        //if (particles.particles.length) return;
        var newParticle = createRandom(x, y, 50);
        particles.addParticle(newParticle);
    }
}

function createRandom(x, y, spread) {
    var size = Math.random() * 4 + 1;
    var x = Math.random() * spread * 2 + x - spread;
    var y = Math.random() * spread * 2 + y - spread;
    return Newton.Particle(x, y, size, particleMaterial);
}

function createWalls() {
    var polys = [
        // X
        150, 150, 200, 100,
        200, 100, 250, 150,
        250, 150, 300, 100,
        300, 100, 350, 150,
        350, 150, 300, 200,
        300, 200, 350, 250,
        350, 250, 300, 300,
        300, 300, 250, 250,
        250, 250, 200, 300,
        200, 300, 150, 250,
        150, 250, 200, 200,
        200, 200, 150, 150,

        // Triangle
        600, 125, 725, 275,
        725, 275, 475, 275,
        475, 275, 600, 125,

        // Box
        875, 125, 1050, 125,
        1050, 125, 1050, 275,
        1050, 275, 875, 275,
        875, 275, 875, 125
    ];

    var w = Newton.Body(wallMaterial);
    for (var i = 0; i < polys.length; i += 4) {
        var p1 = Newton.Particle(polys[i], polys[i + 1]);
        var p2 = Newton.Particle(polys[i + 2], polys[i + 3]);
        var e = Newton.Edge(p1, p2, wallMaterial);
        w.addParticle(p1);
        w.addParticle(p2);
        w.addEdge(e);       // TODO: figure out a more concise API
    }
    return w;
}

// User Interface

function bindControls() {
    $(document)
    .mouseup(onMouseUp);

    $('#whatever').click(function () {
        sim.link('particles', 'particles shapes global wind');
        return false;
    });

    $('#display')
    .mouseenter(onMouseEnter)
    .mousemove(onMouseMove)
    .mouseleave(onMouseLeave)
    .mousedown(onMouseDown);

    function onMouseMove(e) {
        radial.setLocation(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    }

    function onMouseDown(e) {
        mouseDown = true;
        return false;
    }

    function onMouseUp(e) {
        mouseDown = false;
    }

    function onMouseEnter(e) {
        radial.setStrength(4);
    }

    function onMouseLeave(e) {
        radial.setStrength(0);
    }
}
