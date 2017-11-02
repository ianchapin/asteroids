/*
    File: asteroids.js
    Name: Ian Chapin
    Date: 10/30/2017
    Description: This file enables the game of Asteroids in a canvas element. Enjoy!
*/

//////////////////////////////////////////////////

/* Global Variables */

// grabs canvas
var canvas = document.querySelector('#canvas');
var c = canvas.getContext('2d');

// keeps track of mouse coordinates
var mouseX;
var mouseY;

// sets canvas width and height to whatever the size of current window is
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

// stores the canvas width and height
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

// setting up key values for 'keydown' event listener
var KEY = {
    BACKSPACE: 8,
    TAB:       9,
    RETURN:   13,
    ESC:      27,
    SPACE:    32,
    PAGEUP:   33,
    PAGEDOWN: 34,
    END:      35,
    HOME:     36,
    LEFT:     37,
    UP:       38,
    RIGHT:    39,
    DOWN:     40,
    INSERT:   45,
    DELETE:   46,
    ZERO:     48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
    A:        65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
    TILDA:    192
  };

//////////////////////////////////////////////////

/* Event Listeners */

// when the mouse moves
canvas.onmousemove = function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

// when the browser window is resized
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// on key down
document.addEventListener('keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);

// on key up
document.addEventListener('keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);

function onkey(ev, key, pressed) {
  switch(key) {
    case KEY.UP: player.up = pressed; ev.preventDefault(); break;
    case KEY.LEFT: player.left = pressed; ev.preventDefault(); break;
    case KEY.RIGHT: player.right = pressed; ev.preventDefault(); break;
    case KEY.SPACE: player.shoot  = pressed; ev.preventDefault(); break;
  }
}

//////////////////////////////////////////////////

/* Useful functions */

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(max, min) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

//////////////////////////////////////////////////

/* Object Constructors */

// Space Object
function SpaceObject() {
    this.x = null;
    this.y = null;
    
    this.dx = null;
    this.dy = null;
    
    this.radians = null;
    this.speed = null;
    this.rotationSpeed = null;
    
    this.width = null;
    this.height = null;
    
    this.shapex = [];
    this.shapey = [];
}

SpaceObject.prototype.getx = function() {
    return this.x;
}

SpaceObject.prototype.gety = function() {
    return this.y;
}

SpaceObject.prototype.getShapex = function() {
    return this.shapex;
}

SpaceObject.prototype.getShapey = function() {
    return this.shapey;
}

SpaceObject.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
}

SpaceObject.prototype.intersects = function(other) {
    // incomplete
}

SpaceObject.prototype.contains = function(x, y) {
    // incomplete
}

SpaceObject.prototype.wrap = function() {
    if(this.x < 0) this.x = canvasWidth;
    if(this.x > canvasWidth) this.x = 0;
    if(this.y < 0) this.y = canvasHeight;
    if(this.y > canvasHeight) this.y = 0;
}
// end of Space Object



// Player
Player.prototype = new SpaceObject(); // set SpaceObject as parent

function Player(bullets) {
    this.bullets = bullets;
    
    this.MAX_BULLETS = 4;
    
    this.flamex = [];
    this.flamey = [];
    
    this.left = false;
    this.right = false;
    this.up = false;
    
    this.maxSpeed = 300;
    this.acceleration = 200;
    this.deceleration = 10;
    this.acceleratingTimer = 0;
    
    this.hit = false;
    this.dead = false;
    
    this.hitTimer = null;
    this.hitTime = null;
    this.hitLines = null;
    this.hitLinesVector = null;
    
    this.score = 0;
    this.extraLives = 3;
    this.requiredScore = 10000;
    
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    
    this.radians = Math.PI / 2;
    this.rotationSpeed = 0.005;
    
    // initialize array to prevent endless push on updates in setShape()
    for(var i = 0; i < 4; i++) {
        this.shapex.push(0);
        this.shapey.push(0);
    }
    for(var i = 0; i < 3; i++) {
        this.flamex.push(0);
        this.flamey.push(0);
    }
    
    this.setShape();
    this.setFlame();
}

Player.prototype.setShape = function() {
    this.shapex[0] = this.x + Math.cos(this.radians) * 8;
    this.shapey[0] = this.y + Math.sin(this.radians) * 8;
    
    this.shapex[1] = this.x + Math.cos(this.radians - 4 * Math.PI / 5) * 8;
    this.shapey[1] = this.y + Math.sin(this.radians - 4 * Math.PI / 5) * 8;
    
    this.shapex[2] = this.x + Math.cos(this.radians + Math.PI) * 5;
    this.shapey[2] = this.y + Math.sin(this.radians + Math.PI) * 5;
    
    this.shapex[3] = this.x + Math.cos(this.radians + 4 * Math.PI / 5) * 8;
    this.shapey[3] = this.y + Math.sin(this.radians + 4 * Math.PI / 5) * 8;
}

Player.prototype.setFlame = function() {
    this.flamex[0] = this.x + Math.cos(this.radians - 5 * Math.PI / 6) * 5;
    this.flamey[0] = this.y + Math.sin(this.radians - 5 * Math.PI / 6) * 5;
    
    this.flamex[1] = this.x + Math.cos(this.radians - Math.PI) * (6 + this.acceleratingTimer * 50);
    this.flamey[1] = this.y + Math.sin(this.radians - Math.PI) * (6 + this.acceleratingTimer * 50);
    
    this.flamex[2] = this.x + Math.cos(this.radians + 5 * Math.PI / 6) * 5;
    this.flamey[2] = this.y + Math.sin(this.radians + 5 * Math.PI / 6) * 5;
}

Player.prototype.setLeft = function(b) {
    this.left = b;
}

Player.prototype.setRight = function(b) {
    this.right = b;
}

Player.prototype.setUp = function(b) {
    if(b && !this.up && !this.hit) {
        // play thruster sound
    }
    else if(!b) {
        // stop thruster sound
    }
    this.up = b;
}

Player.prototype.setPosition = function(x, y) {
    
    SpaceObject.prototype.setPosition.call(x, y); // call parent method
    this.setShape();
    
}

Player.prototype.isHit = function() {
    return this.hit;
}

Player.prototype.isDead = function() {
    return this.dead;
}

Player.prototype.isHit = function() {
    return this.hit;
}

Player.prototype.reset = function() {
    
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.setShape();
    this.hit = this.dead = false;
}

Player.prototype.getScore = function() {
    return this.score;
}

Player.prototype.getLives = function() {
    return this.extraLives;
}

Player.prototype.loseLife = function() {
    return this.extraLives--;
}

Player.prototype.incrementScore = function(l) {
    this.score += 1;
}

Player.prototype.shoot = function() {
    if(this.bullets.length() === this.MAX_BULLETS) return;
    this.bullets.push(new Bullet(this.x, this.y, this.radians));
    // play shooting sound
}

Player.prototype.hit = function() {
    // incomplete
}

Player.prototype.update = function(dt) {
    // check if hit
    //incomplete
    
    // check extra lives
    if(this.score >= this.requiredScore) {
        this.extraLives++;
        this.requiredScore += 10000;
        // play extra life sound;
    }
    
    // turning
    if(this.left) {
        this.radians += this.rotationSpeed * dt;
    }
    else if(this.right) {
        this.radians -= this.rotationSpeed * dt;
    }
    
    // acceleration
    if(this.up) {
        this.dx += Math.cos(this.radians) * this.acceleration * dt;
        this.dy += Math.sin(this.radians) * this.acceleration * dt;
        this.acceleratingTimer += dt;
        if(this.acceleratingTimer > 0.1) {
            this.acceleratingTimer = 0;
        }
    }
    else {
        this.acceleratingTimer = 0;
    }
    
    // decerleration
    let vec = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if(vec > 0) {
        this.dx -= (this.dx / vec) * this.deceleration * dt;
        this.dy -= (this.dy / vec) * this.deceleration * dt;
    }
    if(vec > this.maxSpeed) {
        this.dx = (this.dx * vec) * this.maxSpeed;
        this.dy = (this.dy * vec) * this.maxSpeed;
    }
    
    // set position
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    
    // set shape
    this.setShape();
    
    // set flame
    if(this.up) {
        this.setFlame();
    }
    
    // screen wrap
    SpaceObject.prototype.wrap.call();
}

Player.prototype.draw = function() {
    
    // draw ship
    c.beginPath();
    c.moveTo(this.shapex[0], this.shapey[0]);
    c.lineTo(this.shapex[1], this.shapey[1]);
    c.lineTo(this.shapex[2], this.shapey[2]);
    c.lineTo(this.shapex[3], this.shapey[3]);
    c.lineTo(this.shapex[0], this.shapey[0]);
    c.strokeStyle = '#F9F9F9';
    c.fillStyle = '#F9F9F9';
    c.fill();
    c.stroke();
    
    // draw flames
    if(this.up) {
        c.beginPath();
        c.moveTo(this.flamex[0], this.flamey[0]);
        c.lineTo(this.flamex[1], this.flamey[1]);
        c.lineTo(this.flamex[2], this.flamey[2]);
        c.lineTo(this.flamex[0], this.flamey[0]);
        c.strokeStyle = '#F2A74A';
        c.fillStyle = '#F2A74A';
        c.fill();
        c.stroke();
    }
    
}
// end of Player



// Bullet
Bullet.prototype = new SpaceObject(); // set SpaceObject as parent

function Bullet(x, y, radians) {
    this.lifeTime = 0;
    this.lifeTimer = 1;
    
    this.remove = null;
    
    this.speed = 350;
    this.dx = Math.cos(this.radians) * this.speed;
    this.dy = Math.sin(this.radians) * this.speed;
    
    this.width = this.height = 2;
} 

Bullet.prototype.shouldRemove = function() {
    return this.remove;
}

Bullet.prototype.update = function(dt) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    
    SpaceObject.prototype.wrap.call();
    
    this.lifeTimer += dt;
    if(this.lifeTimer > this.lifeTime) {
        this.remove = true;
    }
}

Bullet.prototype.draw = function() {
    // incomplete
}
// end of Bullet

    
    
// Asteroid
Asteroid.prototype = new SpaceObject(); // set SpaceObject as parent

function Asteroid(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    this.dists = [];
    
    this.remove = null;
    
    if(this.type === 0) { // small
        this.numPoints = 8;
        this.width = this.height = 20;
        this.speed = getRandomArbitrary(0.1, 1.5);
        this.score = 100;
    }
    else if(this.type === 1) { // medium
        this.numPoints = 10;
        this.width = this.height = 35;
        this.speed = getRandomArbitrary(0.1, 1);
        this.score = 50;
    }
    else if(this.type === 2) { // large
        this.numPoints = 12;
        this.width = this.height = 60;
        this.speed = getRandomArbitrary(0.1, 0.5);
        this.score = 20;
    }
    
    // initialize array to prevent endless push on updates in setShape()
    for(var i = 0; i < this.numPoints; i++) {
        this.shapex.push(0);
        this.shapey.push(0);
    }
    
    this.rotationSpeed = getRandomArbitrary(-0.05, 0.05);
    
    this.radians = getRandomArbitrary(0, 2 * Math.PI);
    this.dx = Math.cos(this.radians) * this.speed;
    this.dy = Math.sin(this.radians) * this.speed;
    
    var radius = this.width / 2;
    for(var i = 0; i < this.numPoints; i++) {
        this.dists.push(getRandomArbitrary(radius / 2, radius));
    }
    
    this.setShape();
} 

Asteroid.prototype.setShape = function() {
    var angle = 0;
    for(var i = 0; i < this.numPoints; i++) {
        this.shapex[i] = this.x + Math.cos(angle + this.radians) * this.dists[i];
        this.shapey[i] = this.y + Math.sin(angle + this.radians) * this.dists[i];
        angle += (2 * Math.PI) / this.numPoints;
    }
}

Asteroid.prototype.getType = function() {
    return this.type;
}

Asteroid.prototype.shouldRemove = function() {
    return this.remove;
}

Asteroid.prototype.getScore = function() {
    return this.score;
}

Asteroid.prototype.update = function(dt) {
    this.x += this.dx;
    this.y += this.dy;
    
    this.radians += this.rotationSpeed;
    this.setShape();
    
    this.wrap();
}

Asteroid.prototype.draw = function() {
    c.beginPath();
    c.moveTo(this.shapex[0], this.shapey[0]);
    for(var i = 1; i < this.numPoints; i++) {
        c.lineTo(this.shapex[i], this.shapey[i]);
    }
    c.lineTo(this.shapex[0], this.shapey[0]);
    c.strokeStyle = '#F9F9F9';
    c.fillStyle = '#737373';
    c.fill();
    c.stroke();
}
// end of Asteroid



// Particle
Particle.prototype = new SpaceObject(); // set SpaceObject as parent

function Particle(x, y) {
    this.x = x;
    this.y = y
    
    this.width = this.height = 2;
    
    this.speed = 50;
    this.radians = Math.random() * (2 * Math.PI);
    this.dx = Math.cos(this.radians) * speed;
    this.dy = Math.sin(this.radians) * speed;
    
    this.timer = 0;
    this.time = 1;
    
    this.remove = null;
} 
    
Particle.prototype.shouldRemove = function() {
    return remove;
}

Particle.prototype.update = function(dt) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    
    this.timer += dt;
    if(this.timer > this.time) {
        this.remove = true;
    }
}

Particle.prototype.draw = function() {
    // incomplete
}
// end of Particle

//////////////////////////////////////////////////

/* Game State */

var player = new Player(0);
var s = new Asteroid(100, canvasHeight / 2, 0);
var m = new Asteroid(200, canvasHeight / 2, 1);
var l = new Asteroid(500, canvasHeight / 2, 2);

//////////////////////////////////////////////////

/* Update All */

var maxfps = 60;
var now;
var then = Date.now();
var interval = 1000 / maxfps;
var dt; // delta time

// game loop
function updateAll() {
    
    window.requestAnimationFrame(updateAll); // request another animation frame
    
    now = Date.now(); //current time
    dt = now - then; // delta time
    
    if(dt > interval) {
        then = now - (dt % interval);
        
        /* Draw frame below */
        c.clearRect(0, 0, canvasWidth, canvasHeight); // clear canvas

        c.fillStyle = "#252625";
        c.fillRect(0, 0, canvasWidth, canvasHeight); // set canvas background

        player.update(dt);
        player.draw();
        
        s.update(dt);
        s.draw();
        
        m.update(dt);
        m.draw();
        
        l.update(dt);
        l.draw();
        
    }
}

updateAll();