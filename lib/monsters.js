var Q           = require( 'q' );
var randInt     = require( './utils' ).randInt;


function Monsters( bot, config )
{
    this.bot        = bot;
    this.config     = config;

    this.spawnAll();
}


Monsters.prototype.spawnAll         = function()
{
    this.monsters   = [];

    var maxLevel    = this.config.rpg.monster_max_level;
    var monsters    = this.config.rpg.monsters;
    var len         = monsters.length;
    var spread      = this.getSpread();

    for ( var i = 0; i < len; ++i )
    {
        var name    = monsters[ i ];
        var monster = new Monster( name, this.getBaseLevel( i ), spread, this.bot )

        this.monsters.push( monster );
        monster.spawn();
    }
}


Monsters.prototype.moveTick         = function()
{
    this.monsters.forEach( function( monster ) {
        monster.moveTick();
    } );
}


Monsters.prototype.getSpread        = function()
{
    var maxLevel    = this.config.rpg.monster_max_level;
    var monsters    = this.config.rpg.monsters;
    var len         = monsters.length;

    return Math.floor( maxLevel / Math.max( len - 1, 1 ) );
}


Monsters.prototype.getBaseLevel     = function( index )
{
    return 1 + this.getSpread() * index;   
}



function Monster( name, baseLevel, spread, bot )
{
    this.name       = name;
    this.baseLevel  = baseLevel;
    this.spread     = spread;
    this.bot        = bot;
}


Monster.prototype.spawn             = function()
{
    var maxX        = this.bot.config.rpg.map_x;
    var maxY        = this.bot.config.rpg.map_y;

    this.x          = randInt( maxX );
    this.y          = randInt( maxY );

    var addLevel    = randInt( this.spread ) - Math.floor( 0.5 * ( this.spread + 1 ) ) + 1;
    this.level      = Math.max( this.baseLevel + addLevel, 1 );
    this.itemSum    = Math.max( Math.floor( Math.pow( this.level, 1.75 ) ) + randInt( this.level * addLevel ), 1 );

    console.log( "Spawning a level " + this.level + " " + this.name + " with itemsum " + this.itemSum + " at [" + this.x + ", " + this.y + "]" );
}


Monster.prototype.moveTick          = function()
{
    var mapX        = this.bot.config.rpg.map_x;
    var mapY        = this.bot.config.rpg.map_y;

    this.x          += randInt( 3 ) - 1;
    this.y          += randInt( 3 ) - 1;

    if ( this.x < 0 )
    {
        this.x      = mapX - 1;
    }
    else if ( this.x >= mapX )
    {
        this.x      = 0;
    }

    if ( this.y < 0 )
    {
        this.y      = mapY - 1;
    }
    else if ( this.y >= mapY )
    {
        this.y      = 0;
    }
}


Monster.prototype.getX              = function() { return this.x; }
Monster.prototype.getY              = function() { return this.y; }
Monster.prototype.getName           = function() { return this.name; }
Monster.prototype.getLevel          = function() { return this.level; }
Monster.prototype.getItemSum        = function() { return this.itemSum; }


module.exports.Monsters = Monsters;
module.exports.Monster  = Monster;