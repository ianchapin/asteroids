(function() {

'use strict'

//===========================================================================
// CONSTANTS
//===========================================================================

var FPS     = 60,       // 'update' frame rate fixed at 60fps independent of rendering
    WIDTH   = 720,      // width of the canvas
    HEIGHT  = 540;      // height of the canvas

//===========================================================================
// VARIABLES
//===========================================================================    

var player,
    bullets = [],
    asteroids = [],
    particles = [],
    renderer;

//===========================================================================
// UTILITY METHODS
//===========================================================================
    
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

//===========================================================================
// GAME - SETUP/UPDATE/RENDER
//===========================================================================

function run() {
    //Game.Load.images(IMAGES, function(images) {
        //Game.Load.json("levels/demo", function(level) {
            setup();
            Game.run({
                fps:    FPS,
                update: update,
                render: render
            });
            Dom.on(document, 'keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);
            Dom.on(document, 'keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);
        //});
    //});
}

function setup() {
    player      = new Player();
    renderer    = new Renderer();
}

function update(dt) {
    player.update(dt);
}

function render(dt) {
    renderer.render(dt);
}

function onkey(ev, key, pressed) {
    switch(key) {
        case KEY.LEFT:  player.input.left  = pressed; ev.preventDefault(); return false;
        case KEY.RIGHT: player.input.right = pressed; ev.preventDefault(); return false;
        case KEY.UP:    player.input.up    = pressed; ev.preventDefault(); return false;

        case KEY.SPACE:
            player.input.jump          = pressed;
            break;
    }
}
 
//===========================================================================
// Space Object
//===========================================================================

var SpaceObject = Class.create({
    
    initialize: function() {
    
        this.x                  = null;
        this.y                  = null;
        this.width              = null;
        this.height             = null;
        this.dx                 = null;
        this.dy                 = null;
        this.radians            = null;
        this.speed              = null;
        this.rotationSpeed      = null;
        this.shapex             = [];
        this.shapey             = [];
        
    },
    
    getx: function() {
        return this.x;
    },
    
    gety: function() {
        return this.y;
    },
    
    getShapex: function() {
        return this.shapex;
    },
    
    getShapey: function() {
        return this.shapey;
    },
    
    setPosition: function(x, y) {
        this.x = x;
        this.y = y;
    },
    
    intersects: function(other) {
        if(other.isPrototypeOf(this)) {
            var sx = [],
                sy = [];
            sx = this.getShapex();
            sy = this.getShapey();
            for(var i = 0; i < sx.length; i++) {
                if(this.contains(sx[i], sy[i])) {
                    return true;
                }
            }
            return false;
        }
        else {
            console.log("Error: returning false");
            return false;
        }
    },
    
    contains: function(x, y) {
        var b = false;
        for(var i = 0, j = this.shapex.length - 1; i < this.shapex.length; j = i++) {
            if((this.shapey[i]) > this.y) != (this.shapey[j] > this.y) && (this.x < this.shapex[j] - this.shapex[i]) * (this.y - this.shapey[i]) / (this.shapey[j] - this.shapey[i]) + this.shapex[i])) {
                b = !b;
            }
        }
        return b;
    },
    
    wrap: function() {
        if(this.x < 0) this.x = WIDTH;
        if(this.x > WIDTH) this.x = 0;
        if(this.y < 0) this.y = HEIGHT;
        if(this.y > HEIGHT) this.y = 0;
    }
    
});
    
//===========================================================================
// Player
//===========================================================================

var Player = Class.create({

    initialize: function(bullets) {
      
        this.bullets            = bullets;
        this.MAX_BULLETS        = 4;
        this.flamex             = [];
        this.flamey             = [];
        this.maxSpeed           = 300;
        this.acceleration       = 200;
        this.deceleration       = 10;
        this.accerleratingTimer = 0;
        this.hit                = false;
        this.dead               = false;
        this.hitTimer           = null;
        this.hitTime            = null;
        this.hitLines           = null;
        this.hitLinesVector     = null;
        this.score              = 0;
        this.extraLives         = 3;
        this.requiredScore      = 10000;
        this.x                  = WIDTH / 2;
        this.y                  = HEIGHT / 2;
        this.radians            = Math.PI / 2;
        this.rotationSpeed      = 3;
        this.input              = { left: false, right: false, up: false, shoot: false };
        
        // initialize arrays
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
        
    },
    
    setShape: function() {
        
        this.shapex[0] = this.x + Math.cos(this.radians) * 8;
        this.shapey[0] = this.y + Math.sin(this.radians) * 8;
        
        this.shapex[1] = this.x + Math.cos(this.radians - 4 * Math.PI / 5) * 8;
        this.shapey[1] = this.y + Math.sin(this.radians - 4 * Math.PI / 5) * 8;
        
        this.shapex[2] = this.x + Math.cos(this.radians + Math.PI) * 5;
        this.shapey[2] = this.y + Math.sin(this.radians + Math.PI) * 5;
        
        this.shapex[3] = this.x + Math.cos(this.radians + 4 * Math.PI / 5) * 8;
        this.shapey[3] = this.y + Math.sin(this.radians + 4 * Math.PI / 5) * 8;
        
    },
    
    setFlame: function() {
        
        this.flamex[0] = this.x + Math.cos(this.radians - 5 * Math.PI / 6) * 5;
        this.flamey[0] = this.y + Math.sin(this.radians - 5 * Math.PI / 6) * 5;
        
        this.flamex[1] = this.x + Math.cos(this.radians - Math.PI) * (6 + this.acceleratingTimer * 50);
        this.flamey[1] = this.y + Math.sin(this.radians - Math.PI) * (6 + this.acceleratingTImer * 50);
        
        this.flamex[2] = this.x + Math.cos(this.radians + 5 * Math.PI / 6) * 5;
        this.flamey[2] = this.y + Math.sin(this.radians + 5 * Math.PI / 6) * 5;
        
    },
    
    setLeft: function(b) {
        
    },
    
    setRight: function(b) {
        
    },
    
    setUp: function(b) {
        
    },
    
    setPosition: function(x, y) {
        
    },
    
    isHit: function() {
        
    },
    
    reset: function() {
        
    },
    
    getScore: function() {
        
    },
    
    getLives: function() {
        
    },
    
    loseLife: function() {
        
    },
    
    incrementScore: function(l) {
        
    },
    
    shoot: function() {
        
    },
    
    hit: function() {
        
    },
    
    update: function(dt) {
        
    }
    
});
    
Player.prototype = new SpaceObject();       // set SpaceObject as parent
    
//===========================================================================
// Bullet
//===========================================================================

var Bullet = Class.create({
    
});
    
Bullet.prototype = new SpaceObject();       // set SpaceObject as parent
    
//===========================================================================
// Asteroid
//===========================================================================

var Asteroid = Class.create({
    
});
    
Asteroid.prototype = new SpaceObject();     // set SpaceObject as parent
    
//===========================================================================
// Paricle
//===========================================================================

var Particle = Class.create({
    
});
    
Particle.prototype = new SpaceObject();     // set SpaceObject as parent
    
//===========================================================================
// RENDERER
//===========================================================================
    
var Renderer = Class.create({
    
    initialize: function(images) {
        this.canvas        = Game.Canvas.init(Dom.get('canvas'), WIDTH, HEIGHT);
        this.ctx           = this.canvas.getContext('2d');
    },
    
    render: function(dt) {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);   // clear canvas
        this.renderBackground(this.ctx);
    },
    
    renderBackground: function(ctx) {
        ctx.fillStyle = "#252625";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);    // set canvas background
    }
    
});
    
//===========================================================================
// LETS PLAY!
//===========================================================================   

run();
    
//-------------------------------------------------------------------------    

})();