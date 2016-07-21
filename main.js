var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
		var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;

		// validate that the delta is within range
		if(deltaTime > 1)
			deltaTime = 1;
		
		return deltaTime;
	}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;
var LAYER_COUNT = 3;
var LAYER_BACKGROUND = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;
var MAP = { tw: 60, th: 15};
var TILE = 35;
var TILESET_TILE = TILE * 2;
var TILESET_PADDING = 2;
var TILESET_SPACING = 2;
var TILESET_COUNT_X = 14;
var TILESET_COUNT_Y = 14;

var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;

var enemies = [];

var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;

var METER = TILE;
var GRAVITY = METER * 9.8 * 6;
var MAXDX = METER * 10; // max horizontal speed, 10m
var MAXDY = METER * 20; // max vertical movement, 15m
var ACCEL = MAXDX * 2;
var FRICTION = MAXDX * 6;
var JUMP = METER * 1500;

var left = false;
var right = false;
var jump = false;

var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_DEAD = 2
var STATE_GAMEOVER = 3;
var STATE_WIN = 4;
var gameState = STATE_SPLASH;

var bulletIcon = document.createElement("img");
bulletIcon.src = "BulletUI.png"

var musicBackground;
var sfxFire;
var sfxVictory;

var cells = [];
function initialize()
{
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++)
	{
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[layerIdx].height; y++)
		{
			cells[layerIdx][y] = [];
			for(var x = 0; x < level1.layers[layerIdx].width; x++)
			{
				if(level1.layers[layerIdx].data[idx] != 0)
				{
					cells[layerIdx][y][x] = 1;
					cells[layerIdx][y-1][x] = 1;
					cells[layerIdx][y-1][x+1] = 1;
					cells[layerIdx][y][x+1] = 1;
				}
				else if(cells[layerIdx][y][x] != 1)
				{
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
		for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++)
		{
			for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++)
			{
				if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0)
				{
					var px = tileToPixel(x);
					var py = tileToPixel(y);
					var e = new Enemy(px, py);
					enemies.push(e);
				}
				idx++;
			}
		}
		cells[LAYER_OBJECT_TRIGGERS] = [];
		idx = 0;
		for(var y = 0; y < level1.layers[LAYER_OBJECT_TRIGGERS].height; y++)
		{
			cells[LAYER_OBJECT_TRIGGERS][y] = [];
			for(var x = 0; x < level1.layers[LAYER_OBJECT_TRIGGERS].width; x++)
			{
				if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] != 0)
				{
					cells[LAYER_OBJECT_TRIGGERS][y][x] = 1;
					cells[LAYER_OBJECT_TRIGGERS][y - 1][x] = 1;
					cells[LAYER_OBJECT_TRIGGERS][y - 1][x + 1] = 1;
					cells[LAYER_OBJECT_TRIGGERS][y][x + 1] = 1;
				}
				else if(cells[LAYER_OBJECT_TRIGGERS][y][x] != 1)
				{
					cells[LAYER_OBJECT_TRIGGERS][y][x] = 0;
				}
				idx++;
			}
		}
	}

	musicBackground = new Howl (
	{
		urls: ["background.ogg"],
		loop: true,
		buffer: true,
		volume: 0.5
	});
	musicBackground.play();

	sfxJump = new Howl (
	{
		urls: ["jump.ogg"],
		buffer: true,
		volume: 1,
		onend: function()
		{
			isSfxPlaying = false;
		}
	});

	sfxVictory = new Howl (
	{
		urls: ['Victory.ogg'],
		buffer: true,
		volume: 1
	});
}


// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

// load an image to draw
var chuckNorris = document.createElement("img");
chuckNorris.src = "hero.png";

var player = new Player();
var keyboard = new Keyboard();


var tileset = document.createElement( "img" )
tileset.src = "tileset.png";


function cellAtTileCoord(layer, tx, ty)
{
	if(tx < 0 || tx >= MAP.tw || ty < 0)
		return 1;

	if(ty >= MAP.th)
		return 0;
	return cells[layer][ty][tx];
};

function cellAtPixelCoord(layer, x, y)
{
	if(x < 0 || x > SCREEN_WIDTH || y < 0)
		return 1;

	if(y > SCREEN_HEIGHT)
		return 0;
	return cellAtPixelCoord(layer, p2t(x), p2t(y));
};

function tileToPixel(tile)
{
	return tile * TILE;
};

function pixelToTile(pixel)
{
	return Math.floor(pixel / TILE);
};

function bound(value, min, max)
{
	if(value < min)
		return min;
	if(value > max)
		return max;
	return value;
};

var worldOffsetx = 0;
function drawMap()
{
	var startX = -1;
	var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var offsetX = TILE + Math.floor(player.position.x%TILE);

	startX = tileX - Math.floor(maxTiles / 2);

	if(startX < -1)
	{
		startX = 0;
		offsetX = 0;
	}

	if(startX > MAP.tw - maxTiles)
	{
		startX = MAP.tw - maxTiles + 1;
		offsetX = TILE;
	}

	worldOffsetx = startX * TILE + offsetX;

	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++)
	{
		for(var y = 0; y < level1.layers[layerIdx].height; y++)
		{
			var idx = y * level1.layers[layerIdx].width + startX;
			for(var x = startX; x < startX + maxTiles; x++)
			{
				if(level1.layers[layerIdx].data[idx] != 0)
				{
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) *
								(TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) *
								(TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE,
								(x - startX) * TILE - offsetX, (y-1) * TILE, TILESET_TILE, TILESET_TILE);
				}
				idx++;
			}
		}
	}
}

var splashTimer = 3;
function runSplash(deltaTime)
{
	splashTimer -= deltaTime;
	if(splashTimer <= 0)
	{
		gameState = STATE_GAME;
		return;
	}


	context.font = "bold 40px Ariel";
	context.fillStyle = "#000000"
	context.fillText ("GET READY", 200, 240);
}

function runGame(deltaTime)
{
	player.update(deltaTime);
	player.draw();

	time -= deltaTime;


	/*for(var i = 0; i < enemies.length; i++)
	{
		enemies[i].update(deltaTime)
	}

	for(var i=0; i<enemies.length; i++)
  	{
  		enemies[i].draw();
  	}*/




/*for(var i = 0; i < 10; i++)
{
	context.drawImage(bulletIcon,0 + (30 * i),0,30,30);
}*/
	
	//context.drawImage(chuckNorris, SCREEN_WIDTH/2 - chuckNorris.width/2, SCREEN_HEIGHT/2 - chuckNorris.height/2);
	

	/* update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}		

	// draw the FPS
	context.fillStyle = "#f00";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);*/

	context.fillStyle = "red";
	context.font = "32px Arial";
	var timeText = "Time Left: " + time;
	context.fillText(timeText, SCREEN_WIDTH - 630, 35)

	for(var i = 0; i < lives + 1; i++)
	{
		context.drawImage(heartImage, 15 + ((heartImage.width + 2)* i), 40);
	}
}

function runDead(deltaTime)
{
	if(keyboard.isKeyDown(keyboard.KEY_E) == true)
	{
		gameState = STATE_GAME;
	}



	context.font="72px Verdana";	
	context.fillStyle = "red";	
	var width =  context.measureText("YOU DIED").width;
	context.fillText("YOU DIED", SCREEN_WIDTH/2 - width/2, SCREEN_HEIGHT/2);		
	
	context.font="18px Verdana";	
	context.fillStyle = "#000";	
	width =  context.measureText("Press E to Try Again.").width;
	context.fillText("Press E to Try Again.", SCREEN_WIDTH/2 - width/2, 300);
}

function runGameOver(deltaTime)
{
	context.font="72px Verdana";	
	context.fillStyle = "red";	
	var width =  context.measureText("GAME OVER").width;
	context.fillText("GAME OVER", SCREEN_WIDTH/2 - width/2, SCREEN_HEIGHT/2);

	context.font="18px Verdana";	
	context.fillStyle = "#000";	
	width =  context.measureText("Press F5 to Try Again.").width;
	context.fillText("Press F5 to Try Again.", SCREEN_WIDTH/2 - width/2, 300);
}

function runWin(deltaTime)
{
	drawMap();
	musicBackground.stop();
	

	context.font = "bold 40px Ariel";
	context.fillStyle = "#000000"
	context.fillText ("CONGRATS, YOU WON!!!", 100, 240);
}

function run()
{
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, canvas.width, canvas.height);

	drawMap();

	var deltaTime = getDeltaTime();

	switch(gameState)
	{
		case STATE_SPLASH:
			runSplash(deltaTime);
			break;

		case STATE_GAME:
			runGame(deltaTime);
			break;

		case STATE_DEAD:
			runDead(deltaTime);
			break;

		case STATE_GAMEOVER:
			runGameOver(deltaTime);
			break;

		case STATE_WIN:
			runWin(deltaTime);
			break;
	}
}

initialize();


//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
	var onEachFrame;
	if (window.requestAnimationFrame) {
		onEachFrame = function(cb) {
			var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
			_cb();
		};
	} else if (window.mozRequestAnimationFrame) {
		onEachFrame = function(cb) {
			var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
			_cb();
		};
	} else {
		onEachFrame = function(cb) {
			setInterval(cb, 1000 / 60);
		}
	}

	window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
