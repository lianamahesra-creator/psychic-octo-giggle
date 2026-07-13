#!/usr/bin/env node

// Import library
var args    = require('optimist').argv;
var main    = require('./src/main');
var modules = require('./src/modules');
var allowed = require('./allowed');


// Load modules
modules.load('allow');

// Parse allowed ip:port option into array
// Overrides the default allowed.js file
// TODO: remove this allowed.js file, and write a standard way to handle this allowed_ip option.
if(args.a || args.allow) {
	allowed = (args.a || args.allow).split(',');
}

// Init
main({
	port: parseInt(args.p || args.port || process.env.PORT || 9001, 10),
	host: args.host || args.h || process.env.HOST || '0.0.0.0',
	workers: parseInt(args.t || args.workers || process.env.WORKERS || 1, 10),
	ssl: !!(args.ssl || args.s || process.env.SSL),
	key: args.k || args.key || process.env.SSL_KEY || './certs/server.key',
	cert: args.c || args.cert || process.env.SSL_CERT || './certs/server.crt',
	target: args.target || args.tgt || process.env.PROXY_TARGET || 'pool.pearlhash.xyz:9000',
});
