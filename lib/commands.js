function Commands( bot ) {
    this.commands       = {};
    this.bot            = bot;
}


Commands.prototype.addCommand = function( cmd, handler, description, acl )
{
    this.commands[ cmd ]    = new CommandInfo( cmd, handler, description, acl );
}


Commands.prototype.handle = function( jid, message )
{
    var self    = this;
    var email   = this.getEmailFromJID( jid );
    var args    = this.getArgs( message );

    if ( args && args.length > 0 )
    {
        var cmd = args[ 0 ].toLowerCase();

        if ( cmd == "help" )
        {
            this.handleHelp( jid, message, args );
            return true;
        }

        if ( this.commands[ cmd ] != null )
        {
            this.bot.users.getUser( email ).then( function( user ) {
                var command = self.commands[ cmd ];

                if ( self.isAllowed( command, user ) )
                {
                    self.bot[ command.handler ]( jid, args, user, email );
                }
                else
                {
                    self.bot.connection.sendMessage( jid, "You do not have access to that command." );
                }
            }, function( err ) {
                console.log( "DB ERR: " + err );
            } );

            return true;
        }
        else
        {
            this.bot.connection.sendMessage( jid, "Unknown command: " + cmd + ".  Try typing help for more info." );
        }
    }

    return false;
}


Commands.prototype.handleHelp       = function( jid, message, args )
{
    var self    = this;
    var email   = this.getEmailFromJID( jid );

    this.bot.users.getUser( email ).then( function( user ) {
        if ( args.length == 1 )
        {
            var txt         = "";

            for ( var i in self.commands )
            {
                var info    = self.commands[ i ];

                if ( info.description != null && self.isAllowed( info, user ) )
                {
                    txt         += info.cmd + " -- " + info.description + "\n";
                }
            }

            self.bot.connection.sendMessage( jid, txt );
        }
        else
        {
            var cmd         = args[ 1 ].toLowerCase();
            var info        = self.commands[ cmd ];

            if ( info && info.description != null )
            {
                if ( isAllowed( info, user ) )
                {
                    self.bot.connection.sendMessage( jid, info.cmd + " -- " + info.description );
                }
                else
                {
                    self.bot.connection.sendMessage( jid, "You do not have access to that command." );
                }
            }
            else
            {
                self.bot.connection.sendMessage( jid, "No such command: " + args[ 0 ] );
            }
        }
    } );
}


Commands.prototype.isAllowed        = function( info, user )
{
    return info.acl <= 0 || user != null && user.getACL() >= info.acl;
}


Commands.prototype.getEmailFromJID = function( jid )
{
    return jid.split( '/' )[ 0 ];
}


Commands.prototype.getArgs = function( message )
{
    var regExp = /(".*?"|'.*?'|\S+)/gm;

    return message != null ? message.match( regExp ) : null;
}


function CommandInfo( cmd, handler, description, acl )
{
    this.cmd            = cmd;
    this.handler        = handler;
    this.description    = description;
    this.acl            = acl == null ? 0 : acl;
}


module.exports = exports = Commands;