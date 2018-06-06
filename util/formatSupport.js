'use strict'

module.exports = function(userAgent, accept) {
	const formats = [];

	if (accept && accept.indexOf('image/webp') > -1) {
		formats.push('webp');
	}

	formats.push('jpeg');
	formats.push('png');

	return formats;
}