#!/usr/bin/env nodejs
'use strict'

const fs      = require('fs');
const config  = require('../config');
const MongoClient = require('mongodb').MongoClient;
const Binary  = require('mongodb').Binary;

const action = process.argv[2];

// Add mode action
MongoClient.connect(config.mongo_uri, function(err, database) {
    if (err) {
        return console.dir(err);    
    }
    const db = database.db(config.mongo_db);

    (async function() {
        try {
            await db.collection('mode').remove();
            console.log('All Removed');
            
            const collection = db.collection('keepGoingExample');

            const modes = JSON.parse(fs.readFileSync('modes.json', 'utf8'));
            for (const mode of modes) {
                if (mode['404']) {
                    mode['404'] = Binary(fs.readFileSync(mode['404']));
                }
                if (mode['watermark']) {
                    mode['watermark'] = Binary(fs.readFileSync(mode['watermark']));
                }
                await collection.insert(mode);
                console.log(mode.name + ' ' + mode.size + ' added!');
            }
        } catch(e) {
            console.dir(e);
            process.exit(1);
        }

        process.exit();
    })();
});

