(function() { // private module pattern

    'use strict'

    //===========================================================================
    // CONSTANTS
    //===========================================================================

    var FPS     = 60,       // 'update' frame rate fixed at 60fps independent of rendering
        WIDTH   = 720,      // width of the canvas
        HEIGHT  = 540,      // height of the canvas
        
        KEY     = { SPACE: 32, A: 65, LEFT: 37, W: 87, UP: 38, D: 68, RIGHT: 39 };

    //===========================================================================
    // VARIABLES
    //===========================================================================    
         
    var player,
        playerBullets,
        asteroids,
        particles,
        playState,
        renderer;
    
    var level           = 1;
    
    //===========================================================================
    // GAME - SETUP/UPDATE/RENDER
    //===========================================================================

    function run() {
        
        setup();
        
        Game.run({
            
            fps:    FPS,
            update: update,
            render: render

        });

        Dom.on(document, 'keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);
        Dom.on(document, 'keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);

    }
    
    function setup() {
        
        player          = new Player();
        playerBullets   = new Bullets();
        asteroids       = new Asteroids();
        particles       = new Particles();
        
        playState       = new PlayState();
        
        renderer        = new Renderer();

    }

    function update(dt) {
        
        playState.update(dt);
        
    }

    function render() {

        renderer.render();

    }

    function onkey(ev, key, pressed) {

        switch(key) {

            case KEY.LEFT:  player.input.left  = pressed; ev.preventDefault(); return false;
            case KEY.RIGHT: player.input.right = pressed; ev.preventDefault(); return false;
            case KEY.UP:    player.input.up    = pressed; ev.preventDefault(); return false;
                
            case KEY.A:     player.input.left  = pressed; ev.preventDefault(); return false;
            case KEY.D:     player.input.right = pressed; ev.preventDefault(); return false;
            case KEY.W:     player.input.up    = pressed; ev.preventDefault(); return false;

            case KEY.SPACE:
                player.input.shoot         = pressed;
                break;

        }

    }
    
    //===========================================================================
    // PlayState
    //===========================================================================
    
    var PlayState = Class.create({
        
        initialize: function() {
            
            this.MAX_BULLETS        = 4;
            
            this.shootTimer         = 0;
            this.shootTime          = 0.15;
            
            asteroids.spawnAsteroids();
            
        },
        
        gameRules: function() {
            
            if(asteroids.numAsteroidsLeft === 0) {
                
                level++;
                asteroids.spawnAsteroids();
                
            }
            
        },
        
        playerShoot: function(dt) {
            
            this.shootTimer += dt;
            
            if(!player.hit) {
            
                if(player.input.shoot && this.shootTimer > this.shootTime && playerBullets.allBullets.length < this.MAX_BULLETS) {
            
                    playerBullets.shootBullet(player.x, player.y, player.radians);
                    this.shootTimer = 0;
                
                }
                
            }
            
        },
        
        detectCollisions: function() {
            
            // player-asteroid collision
            if(!player.hit) {
                
                for(let i = 0; i < asteroids.allAsteroids.length; i++) {
                    
                    let a = asteroids.allAsteroids[i];
                    
                    if(a.intersects(player)) {
                        
                        player.hit = true;
                        asteroids.allAsteroids.splice(i, 1);
                        i--;
                        asteroids.splitAsteroid(a);
                        // play explosion sound
                        break;
                        
                    }
                    
                }
                
            }
            
            // O(n^2).... ew
            // bullet-asteroid collision
            for(let i = 0; i < playerBullets.allBullets.length; i++) {
                
                let b = playerBullets.allBullets[i];
                
                for(let j = 0; j < asteroids.allAsteroids.length; j++) {
                    
                    let a = asteroids.allAsteroids[j];
                    
                    if(a.contains(b.x, b.y)) {
                        
                        playerBullets.allBullets.splice(i, 1);
                        i--;
                        asteroids.allAsteroids.splice(j, 1);
                        j--;
                        asteroids.splitAsteroid(a);
                        player.incrementScore(a.score);
                        // play explosion sound
                        break;
                        
                    }
                    
                }
                
            }
            
        },
        
        
        
        updateEntities: function(dt) {
            
            // update player
            player.update(dt);
            
            if(player.dead) {
                
                if(player.extraLives === 1) {
                    
                    // stop all sound
                    // save score
                    // change state to game over
                    
                    return;
                    
                }
                
                player.reset();
                player.loseLife();
                // flyingsaucer = null;
                // stop flyingsaucer sounds
                return;
                
            }
            
            // update bullets
            playerBullets.update(dt);
            
            for(let i = 0; i < playerBullets.allBullets.length; i++) {
                
                if(playerBullets.allBullets[i].remove === true) {
                    
                    playerBullets.allBullets.splice(i, 1);
                    
                }  
                
            }
            
            // update asteroids
            asteroids.update(dt);
            
            // update particles
            particles.update(dt);
            
            for(let i = 0; i < particles.allParticles.length; i++) {   
                
                if(particles.allParticles[i].remove === true) {  
                    
                    particles.allParticles.splice(i, 1);
                    
                }
                
            }
            
        },
        
        update: function(dt) {
            
            this.gameRules();
            this.playerShoot(dt);
            this.detectCollisions();
            this.updateEntities(dt);
            
        }
        
    });
    
    //===========================================================================
    // Player
    //===========================================================================

    var Player = Class.create({

        initialize: function() {
            
            this.bullets            = playerBullets;
            
            this.shapex             = [];
            this.shapey             = [];
            this.flamex             = [];
            this.flamey             = [];
            
            this.x                  = WIDTH / 2;
            this.y                  = HEIGHT / 2;
            
            this.dx                 = 0;
            this.dy                 = 0;
            
            this.radians            = Math.PI / 2;
            this.rotationSpeed      = 3;
            
            this.maxSpeed           = 300;
            this.acceleration       = 200;
            this.deceleration       = 10;
            this.acceleratingTimer  = 0;
            
            this.hit                = false;
            this.dead               = false;
            
            this.hitTimer           = 0;
            this.hitTime            = 2;
            
            this.score              = 0;
            this.extraLives         = 3;
            this.requiredScore      = 10000;
            
            this.input              = { left: false, right: false, up: false, shoot: false };

            // initialize arrays
            for(let i = 0; i < 4; i++) {
                this.shapex.push(0);
                this.shapey.push(0);
            }

            for(let i = 0; i < 3; i++) {
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

            this.flamex[1] = this.x + Math.cos(this.radians - Math.PI) * (6 + (this.acceleratingTimer * 50));
            this.flamey[1] = this.y + Math.sin(this.radians - Math.PI) * (6 + (this.acceleratingTimer * 50));

            this.flamex[2] = this.x + Math.cos(this.radians + 5 * Math.PI / 6) * 5;
            this.flamey[2] = this.y + Math.sin(this.radians + 5 * Math.PI / 6) * 5;

        },

        reset: function() {

            this.x = WIDTH / 2;
            this.y = HEIGHT / 2;
            
            this.dx = this.dy = 0;
            this.radians = Math.PI / 2;
            
            this.setShape();
            this.hit = this.dead = false;

        },

        loseLife: function() {

            return this.extraLives--;

        },

        incrementScore: function(l) {

            this.score += l;

        },

        hit: function() {

            if(this.hit) return;
            
            this.hit    = true;
            this.dx     = this.dy = 0;
            this.input.left = this.input.right = this.input.up = false;
            // stop thruster sound
            
            particles.spawnParticles(player.x, player.y);
            
        },
        
        wrap: function() {
            
            if(this.x < 0) this.x = WIDTH;
            if(this.x > WIDTH) this.x = 0;
            if(this.y < 0) this.y = HEIGHT;
            if(this.y > HEIGHT) this.y = 0;
            
        },

        update: function(dt) {

            // check if hit
            if(this.hit) {
                
                this.hitTimer += dt;
                
                if(this.hitTimer > this.hitTime) {
                    
                    this.dead = true;
                    this.hitTimer = 0;
                    
                }
                
                return;
        
            }

            // check extra lives
            if(this.score >= this.requiredScore) {

                this.extraLives++;
                this.requiredScore += 10000;
                // play extra life sound;

            }

            // turning
            if(this.input.left) {

                this.radians -= this.rotationSpeed * dt;

            }
            else if(this.input.right) {

                this.radians += this.rotationSpeed * dt;

            }

            // acceleration
            if(this.input.up) {

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

                this.dx = (this.dx / vec) * this.maxSpeed;
                this.dy = (this.dy / vec) * this.maxSpeed;

            }

            // set position
            this.x += this.dx * dt;
            this.y += this.dy * dt;

            // set shape
            this.setShape();

            // set flame
            if(this.input.up) {

                this.setFlame();

            }

            // screen wrap
            this.wrap();

        }

    });
    
    //===========================================================================
    // Bullet
    //===========================================================================

    var Bullet = Class.create({

        initialize: function(x, y, radians) {

            this.x                  = x;
            this.y                  = y;
            
            this.radians            = radians;
            this.speed              = 350;
            
            this.dx                 = Math.cos(this.radians) * this.speed;
            this.dy                 = Math.sin(this.radians) * this.speed;
            
            this.lifeTimer          = 0;
            this.lifeTime           = 1;
            
            this.remove             = false;
            
            this.width              = this.height = 4;

        },
        
        wrap: function() {
            
            if(this.x < 0) this.x = WIDTH;
            if(this.x > WIDTH) this.x = 0;
            if(this.y < 0) this.y = HEIGHT;
            if(this.y > HEIGHT) this.y = 0;
            
        },

        update: function(dt) {
            
            this.x += this.dx * dt;
            this.y += this.dy * dt;
            
            this.lifeTimer += dt;
            
            if(this.lifeTimer > this.lifeTime) {
                
                this.remove = true;
                
            }
            
            this.wrap();
            
        }

    });
    
    //===========================================================================
    // Bullets
    //===========================================================================
    
    var Bullets = Class.create({
       
        initialize: function() {
            
            this.allBullets         = [];
            
        },
        
        shootBullet: function(x, y, radians) {
            
            // place bullet in front of player to prevent collision
            x = x + Math.cos(radians) * 12;
            y = y + Math.sin(radians) * 12;
            
            this.allBullets.push(new Bullet(x, y, radians));
            
        },
        
        update: function(dt) {
            
            for(let i = 0; i < this.allBullets.length; i++) {
                
                this.allBullets[i].update(dt);
                
            }
            
        }
        
    });
    
    //===========================================================================
    // Asteroid
    //===========================================================================

    var Asteroid = Class.create({

        initialize: function(x, y, type) {

            this.x                  = x;
            this.y                  = y;
            this.type               = type;
            
            this.rotationSpeed      = Game.Math.random(-1, 1);
            this.radians            = Game.Math.random(0, 2 * Math.PI);
            
            this.shapex             = [];
            this.shapey             = [];
            this.dists              = [];
            
            this.remove             = false;
            

            // type = small
            if(this.type === 0) {

                this.numPoints      = 8;
                this.width          = this.height = 25;
                this.speed          = Game.Math.random(70, 100);
                this.score          = 100;

            }

            // type = medium
            else if(this.type === 1) {

                this.numPoints      = 10;
                this.width          = this.height = 43;
                this.speed          = Game.Math.random(50, 60);
                this.score          = 50;

            }

            // type = large
            else if(this.type === 2) {

                this.numPoints      = 12;
                this.width          = this.height = 73;
                this.speed          = Game.Math.random(20, 30);
                this.score          = 20;

            }
            
            this.radius             = this.width / 2;
            
            this.dx                 = Math.cos(this.radians) * this.speed;
            this.dy                 = Math.sin(this.radians) * this.speed;

            // initialize array to prevent endless push on updates in setShape()
            for(let i = 0; i < this.numPoints; i++) {

                this.shapex.push(0);
                this.shapey.push(0);

            }

            for(let i = 0; i < this.numPoints; i++) {

                this.dists.push(Game.Math.random(this.radius / 2, this.radius));

            }

            this.setShape();

        },

        setShape: function() {

            let angle = 0;

            for(let i = 0; i < this.numPoints; i++) {

                this.shapex[i] = this.x + Math.cos(angle + this.radians) * this.dists[i];
                this.shapey[i] = this.y + Math.sin(angle + this.radians) * this.dists[i];
                angle += (2 * Math.PI) / this.numPoints;

            }

        },
        
        intersects: function(other) {
            
            for(let i = 0; i < other.shapex.length; i++) {
                
                if(this.contains(other.shapex[i], other.shapey[i])) {
                    
                    return true;
                    
                }
                
            }
            
            return false;
            
        },
        
        contains: function(x, y) {
            
            let b = false;
            
            for(let i = 0, j = this.shapex.length - 1; i < this.shapex.length; j = i++) {
                
                if((this.shapey[i] > y) != (this.shapey[j] > y) && (x < (this.shapex[j] - this.shapex[i]) * (y - this.shapey[i]) / (this.shapey[j] - this.shapey[i]) + this.shapex[i])) {
                    
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
            
        },

        update: function(dt) {

            this.x += this.dx * dt;
            this.y += this.dy * dt;

            this.radians += this.rotationSpeed * dt;
            this.setShape();

            this.wrap();

        }

    });
    
    //===========================================================================
    // Asteroids
    //===========================================================================
    
    var Asteroids = Class.create({
       
        initialize: function() {
            
            this.allAsteroids       = [];
            this.totalAsteroids     = 0;
            this.numAsteroidsLeft   = 0;
            
        },
        
        spawnAsteroids: function() {
            
            this.allAsteroids = []; // clear asteroids
            
            let numToSpawn = 4 + level - 1;
            this.totalAsteroids = numToSpawn * 7;
            this.numAsteroidsLeft = this.totalAsteroids;
            // sounds delays place here
            
            for(let i = 0; i < numToSpawn; i++) {
                
                let x = Game.Math.random(0, WIDTH);
                let y = Game.Math.random(0, HEIGHT);
                
                let dx = x - player.x;
                let dy = y - player.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                while(dist < 100) {
                    
                    x = Game.Math.random(0, WIDTH);
                    y = Game.Math.random(0, HEIGHT);
                    dx = x - player.x;
                    dy = y - player.y;
                    dist = Math.sqrt(dx * dx + dy * dy);
                    
                }
                
                asteroids.allAsteroids.push(new Asteroid(x, y, 2));
                
            }
            
        },
        
        splitAsteroid: function(a) {
            
            if(Asteroid.prototype.isPrototypeOf(a)) {
                
                particles.spawnParticles(a.x, a.y);
                this.numAsteroidsLeft--;
                // currentDelay = ((maxDelay - minDelay)) * this.numAsteroidsLeft / this.totalAsteroids) + minDelay;
                
                if(a.type === 2) {
                    
                    asteroids.allAsteroids.push(new Asteroid(a.x, a.y, 1));
                    asteroids.allAsteroids.push(new Asteroid(a.x, a.y, 1));
                    
                }
                
                if(a.type === 1) {
                    
                    asteroids.allAsteroids.push(new Asteroid(a.x, a.y, 0));
                    asteroids.allAsteroids.push(new Asteroid(a.x, a.y, 0));
                    
                }
                
            }
            else {
                console.log("Error: parameter needs to be an Asteroid");
            }
        },
        
        update: function(dt) {
            
            for(let i = 0; i < this.allAsteroids.length; i++) {
                
                this.allAsteroids[i].update(dt);
                
            }
            
        }
        
    });
    
    //===========================================================================
    // Particle
    //===========================================================================

    var Particle = Class.create({

        initialize: function(x, y) {

            this.x                  = x;
            this.y                  = y;
            
            this.speed              = 50;
            this.radians            = Game.Math.random(0, 2 * Math.PI);
            
            this.dx                 = Math.cos(this.radians) * this.speed;
            this.dy                 = Math.sin(this.radians) * this.speed;
            
            this.timer              = 0;
            this.time               = 1;
            
            this.remove             = false;
            
            this.width              = this.height = 2;

        },
        
        wrap: function() {
            
            if(this.x < 0) this.x = WIDTH;
            if(this.x > WIDTH) this.x = 0;
            if(this.y < 0) this.y = HEIGHT;
            if(this.y > HEIGHT) this.y = 0;
            
        },

        update: function(dt) {

            this.x += this.dx * dt;
            this.y += this.dy * dt;

            this.timer += dt;

            if(this.timer > this.time) {

                this.remove = true;

            }
            
            this.wrap();

        }

    });
    
    //===========================================================================
    // Particles
    //===========================================================================
    
    var Particles = Class.create({
       
        initialize: function() {
            
            this.allParticles = [];
            
        },
        
        spawnParticles: function(x, y) {
            
            for(let i = 0; i < 6; i++) {
                
                this.allParticles.push(new Particle(x, y));
                
            }
            
        },
        
        update: function(dt) {
            
            for(let i = 0; i < this.allParticles.length; i++) {
                
                this.allParticles[i].update(dt);
                
            }  
            
        }
        
    });
    
    //===========================================================================
    // RENDERER
    //===========================================================================

    var Renderer = Class.create({

        initialize: function() {

            this.canvas        = Game.Canvas.init(Dom.get('canvas'), WIDTH, HEIGHT);
            this.ctx           = this.canvas.getContext('2d');

        },

        render: function() {

            this.ctx.clearRect(0, 0, WIDTH, HEIGHT);   // clear canvas
            this.renderBackground(this.ctx);
            this.renderPlayer(this.ctx);
            this.renderPlayerBullets(this.ctx);
            this.renderAsteroids(this.ctx);
            this.renderParticles(this.ctx);

        },

        renderBackground: function(ctx) {

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);    // set canvas background

        },

        renderPlayer: function(ctx) {
            
            if(!player.hit) {
                
                // draw ship
                ctx.beginPath();
                ctx.moveTo(player.shapex[0], player.shapey[0]);
                ctx.lineTo(player.shapex[1], player.shapey[1]);
                ctx.lineTo(player.shapex[2], player.shapey[2]);
                ctx.lineTo(player.shapex[3], player.shapey[3]);
                ctx.lineTo(player.shapex[0], player.shapey[0]);
                ctx.strokeStyle = '#F9F9F9';
                ctx.fillStyle = '#F9F9F9';
                ctx.stroke();
                ctx.fill();

                // draw flames
                if(player.input.up) {

                    ctx.beginPath();
                    ctx.moveTo(player.flamex[0], player.flamey[0]);
                    ctx.lineTo(player.flamex[1], player.flamey[1]);
                    ctx.lineTo(player.flamex[2], player.flamey[2]);
                    ctx.lineTo(player.flamex[0], player.flamey[0]);
                    ctx.strokeStyle = '#F2A74A';
                    ctx.fillStyle = '#F2A74A';
                    ctx.stroke();
                    ctx.fill();

                }
                
            }

        },

        renderPlayerBullets: function(ctx) {
            
            for(let i = 0; i < playerBullets.allBullets.length; i++) {
                
                ctx.beginPath();
                ctx.arc(playerBullets.allBullets[i].x, playerBullets.allBullets[i].y, playerBullets.allBullets[i].width / 2, 0, 2 * Math.PI);
                ctx.fillStyle = "#00FF00";
                ctx.fill();
                
            }
            
        },

        // find a better algorithm. O(n^2) is bad.
        renderAsteroids: function(ctx) {
            
            for(let i = 0; i < asteroids.allAsteroids.length; i++) {
                
                ctx.beginPath();
                ctx.moveTo(asteroids.allAsteroids[i].shapex[0], asteroids.allAsteroids[i].shapey[0]);
                
                for(let j = 0; j < asteroids.allAsteroids[i].shapex.length; j++) {
                    
                    ctx.lineTo(asteroids.allAsteroids[i].shapex[j], asteroids.allAsteroids[i].shapey[j]);
                    
                }
                
                ctx.lineTo(asteroids.allAsteroids[i].shapex[0], asteroids.allAsteroids[i].shapey[0]);
                ctx.strokeStyle = '#F9F9F9';
                ctx.fillStyle = '#737373';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fill();
                
            }
            
        },

        renderParticles: function(ctx) {
            
            for(let i = 0; i < particles.allParticles.length; i++) {
                
                ctx.beginPath();
                ctx.arc(particles.allParticles[i].x, particles.allParticles[i].y, particles.allParticles[i].width / 2, 0, 2 * Math.PI);
                ctx.fillStyle = '#737373';
                ctx.fill();
                
            }
            
        }

    });

    //===========================================================================
    // LETS PLAY!
    //===========================================================================
    
    run();

    //-------------------------------------------------------------------   

})();