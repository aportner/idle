module.exports = exports = {
	randInt: function( num ) {
		return Math.floor( Math.random() * num );
	},

	randElement: function( array ) {
		return array[ exports.randInt( array.length ) ];
	}
};