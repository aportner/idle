var Q           = require( 'q' );
var randInt     = require( './utils' ).randInt;


function Users( bot, db )
{
    this.bot        = bot;
    this.db         = db.collection( 'users' );
    this.users      = {}
    this.buddylist  = new Buddylist( this );
}


Users.prototype.load    = function()
{
    var self        = this;
    var deferred    = Q.defer();

    this.db.find( {} ).toArray( function( err, result ) {
        if ( err )
        {
            deferred.reject( err );
        }
        else
        {
            if ( result )
            {
                var len     = result.length;

                for ( var i = 0; i < len; ++i )
                {
                    var model   = result[ i ];
                    self.users[ model.email ] = new User( self.bot, self ).setModel( model );
                }
            }

            deferred.resolve( true );
        }
    } );

    return deferred.promise;
}


Users.prototype.getUser = function( email )
{
    var deferred    = Q.defer();
    var self        = this;

    if ( this.users[ email ] )
    {
        deferred.resolve( this.users[ email ] );
    }
    else
    {
        this.db.findOne( { email: email }, function( err, item ) {
            if ( !err )
            {
                var user = null;

                if ( item )
                {
                    self.users[ email ] = user = new User( self.bot, self ).setModel( item );
                }

                deferred.resolve( user );
            }
            else
            {
                deferred.reject( err );
            }
        } );
    }

    return deferred.promise;
}


Users.prototype.register = function( email, className )
{
    var user;

    console.log( "Registering a user " + email + " with class " + className );

    this.users[ email ] = user = new User( this.bot, this );
    return user.register( email, className );
}


Users.prototype.updatePresence = function( jid, state )
{
    console.log( "USERS :: " + jid + " is " + state );
    this.buddylist.updatePresence( jid, state );
}


Users.prototype.isOnline = function( email )
{
    return this.buddylist.isOnline( email );
}


Users.prototype.save    = function( user )
{
    var deferred    = Q.defer();

    this.db.save( user.getModel(), function( err, result ) {
        if ( err )
        {
            deferred.reject( err )
        }
        else
        {
            deferred.resolve( result );
        }
    } );

    return deferred.promise;
}


Users.prototype.saveUsers   = function()
{
    var promises            = [];

    for ( var i in this.users )
    {
        var user            = this.users[ i ];
        promises.push( user.save() );
    }

    return Q.all( promises );
}


Users.prototype.getOnlineUsers  = function()
{
    var users       = [];

    for ( var i in this.users )
    {
        var user    = this.users[ i ];

        if ( user.isOnline() )
        {
            users.push( user );
        }
    }

    return users;
}


Users.prototype.getHOF      = function()
{
    var result      = [];

    for ( var i in this.users )
    {
        result.push( this.users[ i ] );
    }

    result.sort( function( o1, o2 ) {
        if ( o1 == o2 )
        {
            return 0;
        }
        else
        {
            var l1  = o1.getLevel();
            var l2  = o2.getLevel();

            if ( l1 == l2 )
            {
                var nl1     = o1.getNextTime();
                var nl2     = o2.getNextTime();

                if ( nl1 == nl2 )
                {
                    var i1  = o1.getItemSum();
                    var i2  = o2.getItemSum();

                    return i2 - i1;
                }
                else
                {
                    return nl1 - nl2;
                }
            }
            else
            {
                return l2 - l1;
            }
        }
    } );

    return result;
}


Users.prototype.getVCard    = function( jid )
{
    this.bot.connection.getVCard( jid );
}




function User( bot, users )
{
    this.bot        = bot;
    this.users      = users;
    this.model      = {};
}


User.prototype.register = function( email, className )
{
    var self            = this;
    var deferred        = Q.defer();

    this.model.email        = email;
    this.model.className    = className;
    this.model.level        = 0;
    this.model.nextTime     = this.calculateNextTime();

    this.sanitizeModel();

    this.users.db.insert( this.model, function( err, result ) {
        if ( err )
        {
            deferred.reject( err );
        }
        else
        {
            self.model  = result[ 0 ];
            deferred.resolve( self );
        }
    } );

    return deferred.promise;
}


User.prototype.setModel = function( model )
{
    this.model = model;
    this.sanitizeModel();

    return this;
}


User.prototype.sanitizeModel = function()
{
    if ( this.model.acl == null )
    {
        this.model.acl = 0;
    }

    if ( this.model.items == null )
    {
        this.model.items = {}
    }

    if ( this.model.x == null || this.model.y == null )
    {
        this.spawn();
    }
}


User.prototype.spawn        = function()
{
    this.model.x    = randInt( this.bot.config.rpg.map_x );
    this.model.y    = randInt( this.bot.config.rpg.map_y );
}


User.prototype.moveTick     = function()
{
    var mapX        = this.bot.config.rpg.map_x;
    var mapY        = this.bot.config.rpg.map_y;

    this.model.x    += randInt( 3 ) - 1;
    this.model.y    += randInt( 3 ) - 1;

    if ( this.model.x < 0 )
    {
        this.model.x    = mapX - 1;
    }
    else if ( this.model.x >= mapX )
    {
        this.model.x    = 0;
    }

    if ( this.model.y < 0 )
    {
        this.model.y    = mapY - 1;
    }
    else if ( this.model.y >= mapY )
    {
        this.model.y    = 0;
    }
    
}


User.prototype.calculateNextTime = function()
{
    var rpg     = this.bot.config.rpg
    return rpg.rpbase * Math.pow( rpg.rpstep, this.model.level );
}


User.prototype.isOnline     = function()
{
    return this.users.isOnline( this.model.email );
}


User.prototype.xpTick       = function( ms )
{
    var sec     = ms * 0.001;

    this.model.nextTime = Math.floor( this.model.nextTime - sec );

    // console.log( this.model.email + " :: " + this.model.nextTime )

    if ( this.model.nextTime <= 0 )
    {
        console.log( "LEVEL UP" );
        this.levelUp();
        return true;
    }

    return false;
}


User.prototype.exchangeItem     = function( type, level )
{
    var item    = this.getItem( type );

    if ( level > item.level )
    {
        this.setItem( type, level );
        return true;
    }

    return false;
}


User.prototype.levelUp      = function()
{
    ++this.model.level;
    this.model.nextTime     = this.calculateNextTime();
}


User.prototype.save         = function()
{
    return this.users.save( this );
}


User.prototype.getClassName = function() { return this.model.className; }
User.prototype.getEmail     = function() { return this.model.email; }
User.prototype.getLevel     = function() { return this.model.level; }
User.prototype.getNextTime  = function() { return this.model.nextTime; }
User.prototype.getModel     = function() { return this.model; }
User.prototype.getACL       = function() { return this.model.acl; }
User.prototype.getX         = function() { return this.model.x; }
User.prototype.getY         = function() { return this.model.y; }

User.prototype.getItem      = function( type ) {
    var item    = this.model.items[ type ];

    if ( item == null )
    {
        item = {
            level: 0
        }
    }

    return item;
}


User.prototype.setItem      = function( type, level )
{
    this.model.items[ type ] = {
        level: level
    }
}


User.prototype.getItemSum   = function()
{
    var items       = this.bot.config.rpg.items;
    var numItems    = items.length;
    var score       = 0;

    for ( var i = 0; i < numItems; ++i )
    {
        var item    = items[ i ];
        score       += this.getItem( item ).level;
    }

    return score;
}

User.prototype.setACL       = function( acl ) { this.model.acl = acl; }


User.prototype.addTime      = function( time )
{
    this.model.nextTime     = Math.floor( this.model.nextTime + time );
}


User.prototype.sendMessage      = function( text, jid, overrideMute )
{
    jid         = jid ? jid : this.getEmail();
    this.bot.connection.sendMessage( jid, text );
}



function Buddylist( users )
{
    this.users  = users;
    this.jids   = [];
}


Buddylist.prototype.updatePresence = function( jid, state )
{
    var index   = this.jids.indexOf( jid );

    if ( state == "offline" && index >= 0 )
    {
        this.jids.splice( index, 1 );
    }
    else if ( state != "offline" && index == -1 )
    {
        this.jids.push( jid );
    }
}


Buddylist.prototype.isOnline = function( email )
{
    var len     = this.jids.length;

    for ( var i = 0; i < len; ++i )
    {
        if ( email == this.jids[ i ].split( '/' )[ 0 ] )
        {
            return true;
        }
    }

    return false;
}



module.exports.Users    = Users;
module.exports.User     = User;