var Engine      = require( 'tingodb' )();
var nicetime    = require( 'nicetime' );
var Connection  = require( './lib/connection' );
var Commands    = require( './lib/commands' );
var Users       = require( './lib/users' );
var GameTimer   = require( './lib/timer' );
var Events      = require( './lib/events' );
var Monsters    = require( './lib/monsters' );
var config      = require( './config.json' );


var ACL_OWNER   = 500;


function Idle()
{
    var self        = this;
    this.config     = config;
    this.db         = new Engine.Db( config.db, {} );
    this.events     = new Events( this );

    this.monsters   = new Monsters.Monsters( this, this.config );
    this.users      = new Users.Users( this, this.db );
    this.users.load().then( function() {
        self.onUsersLoad();
    }, function( err ) {
        console.log( "Error loading users: " + err );
    });
}


Idle.prototype.onUsersLoad  = function()
{
    this.commands   = new Commands( this );

    this.initCommands();

    this.connection = new Connection( this );
    this.connection.connect();
}


Idle.prototype.initCommands = function()
{
    this.commands.addCommand( "register", "handleRegister", "Registers an account" );
    this.commands.addCommand( "info", "handleInfo", "Prints out the info of your account" );
    this.commands.addCommand( "save", "handleSave", "Saves the database", this.config.permissions.save );
    this.commands.addCommand( "auth", "handleAuth" );
    this.commands.addCommand( "vcard", "handleVCard" );
    this.commands.addCommand( "hog", "handleHOG", "Triggers a Hand of God event", this.config.permissions.hog );
    this.commands.addCommand( "calamity", "handleCalamity", "Triggers a Calamity event", this.config.permissions.calamity );
    this.commands.addCommand( "godsend", "handleGodsend", "Triggers a Godsend event", this.config.permissions.godsend );
    this.commands.addCommand( "levelup", "handleLevelUp", "Triggers a level up event", this.config.permissions.level_up );
    this.commands.addCommand( "challenge", "handleChallenge", "Triggers a 1v1 challenge", this.config.permissions.challenge );
    this.commands.addCommand( "hof", "handleHOF", "Shows the hall of fame" );
    this.commands.addCommand( "die", "handleDie", "Kills the bot", this.config.permissions.die );
    this.commands.addCommand( "monsters", "handleMonsters", "Shows all monsters" );
}


Idle.prototype.handleMonsters   = function( jid, args, user, email )
{
    var monsters        = this.monsters.monsters;
    var len             = monsters.length;
    var message         = "";

    for ( var i = 0; i < len; ++i )
    {
        var monster     = monsters[ i ];
        message         += "Level " + monster.getLevel() + " " + monster.getName() + " - itemsum " + monster.getItemSum() + " - at [" + monster.getX() + ", " + monster.getY() + "]\n";
    }

    this.connection.sendMessage( jid, message );
}


Idle.prototype.handleDie    = function( jid, args, user, email )
{
    this.connection.sendMessage( jid, "Goodnight, sweet prince." );
    process.exit( 0 );
}


Idle.prototype.online   = function()
{
    this.gameTimer  = new GameTimer( this );
}


Idle.prototype.handleHOF    = function( jid, args, user, email )
{
    var hof         = this.users.getHOF();
    var numHOF      = Math.min( hof.length, 10 );
    var message     = "Hall of fame:\n-------------------------\n";

    for ( var i = 0; i < numHOF; ++i )
    {
        var user    = hof[ i ];
        message     += ( i + 1 ) + ". " + user.getEmail() + " the level " + ( user.getLevel() + 1 ) + " " + user.getClassName() + " -- itemsum " + user.getItemSum() + "\n";
    }

    this.connection.sendMessage( jid, message );
}


Idle.prototype.handleSave   = function( jid, args, user, email )
{
    var self        = this;

    this.save().then( function() {
        self.connection.sendMessage( jid, "Database saved." );
    }, function( err ) {
        self.connection.sendMessage( jid, "Error saving database: " + err );
    } );
}


Idle.prototype.handleAuth   = function( jid, args, user, email )
{
    var self    = this;

    if ( user != null && args.length > 1 && args[ 1 ] == this.config.admin_password )
    {
        user.setACL( ACL_OWNER );
        this.connection.sendMessage( jid, "Your ACL is now " + ACL_OWNER );
    }
}


Idle.prototype.handleHOG    = function( jid, args, user, email )
{
    console.log( "Idle :: " + email + " triggered a Hand of God" );
    this.hog();
}


Idle.prototype.handleCalamity   = function( jid, args, user, email )
{
    console.log( "Idle :: " + email + " triggered a calamity" );
    this.calamity();
}


Idle.prototype.calamity         = function( jid, args, user, email )
{
    this.events.calamity();
}


Idle.prototype.handleGodsend    = function( jid, args, user, email )
{
    console.log( "Idle :: " + email + " triggered a Godsend" );
    this.godsend();
}

Idle.prototype.godsend          = function() { this.events.godsend(); }


Idle.prototype.handleLevelUp    = function( jid, args, user, email )
{
    console.log( "Idle :: " + email + " triggered a level up" );
    user.levelUp();
    this.events.levelUp( user );
}


Idle.prototype.handleChallenge    = function( jid, args, user, email )
{
    console.log( "Idle :: " + email + " triggered a challenge" );
    this.events.challengeOpponent( user );
}


Idle.prototype.hog          = function() { this.events.hog(); }


Idle.prototype.save     = function()
{
    return this.users.saveUsers();
}


Idle.prototype.handleRegister = function( jid, args, user, email )
{
    var self    = this;

    if ( user == null )
    {
        if ( args.length < 2 )
        {
            this.connection.sendMessage( jid, "Syntax: register <class name>" );
        }
        else
        {
            var className = args.slice( 1 ).join( " " );

            this.users.register( email, className ).then( function( newUser ) {
                self.connection.sendMessage( jid, "Registered a new account with the class: " + newUser.getClassName() + ".  You are level " + ( newUser.getLevel() + 1 ) + ".  Next level in: " + nicetime( newUser.getNextTime() ) );
            }, function( err ) {
                self.connection.sendMessage( jid, "Error registering a new account" );
            });
        }
    }
    else
    {
        this.connection.sendMessage( jid, "Your account is already registered" );
    }
}


Idle.prototype.handleInfo   = function( jid, args, user, email )
{
    var self    = this;

    if ( args.length > 1 )
    {
        this.users.getUser( args[ 1 ] ).then( function( newUser ) {
            if ( newUser )
            {
                self.getInfo( jid, newUser );
            }
            else
            {
                self.connection.sendMessage( jid, "No such user: " + args[ 1 ] );
            }
        } );
    }
    else
    {
        self.getInfo( jid, user );
    }
}


Idle.prototype.getInfo      = function( jid, user )
{
    try {
    if ( user )
    {
        var info    = "-- " + user.getEmail() + " --\n";
        info        += "Class: " + user.getClassName() + "\n";
        info        += "Level: " + ( user.getLevel() + 1 ) + "\n";

        var nextTime    = user.getNextTime();
        info        += "Next level in: " + nicetime( nextTime ) + " (" + nextTime + " seconds)\n";

        info        += "Location: [" + user.getX() + ", " + user.getY() + "]\n";

        var acl     = user.getACL();
        if ( acl )
        {
            info    += "ACL: " + acl + "\n";
        }

        info        += "--------------------\nEquipment:\n";

        var items       = this.config.rpg.items;
        var numItems    = items.length;
        var score       = 0;

        for ( var i = 0; i < numItems; ++i )
        {
            var type    = items[ i ];
            var item    = user.getItem( type );
            var level   = item.level;

            info        += type + ": " + level + "\n";
            score       += level;
        }

        info        += "\nScore: " + score;

        this.connection.sendMessage( jid, info )
    }
    } catch ( err ) { console.log( err ); }
}


Idle.prototype.handleVCard  = function( jid, args, user, email )
{
    this.connection.getVCard( jid );
}


Idle.prototype.handleMessage = function( jid, message )
{
    console.log( jid + " :: " + message );

    this.commands.handle( jid, message );
};


Idle.prototype.updatePresence = function( jid, state, statusText )
{
    this.users.updatePresence( jid, state );
}


var idle        = new Idle();
