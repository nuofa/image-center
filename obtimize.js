#!/usr/bin/env node
'use strict'

const config  = require('./config');
const {MongoClient, Binary} = require('mongodb');
const CWebp = require('cwebp').CWebp;

new CWebp('backup/bf79dfc3c67e7546c33eae741c8e4aeb.png')
.command('-lossless')
  .write('image.webp', function(err) {
    console.log(err || 'encoded successfully');
});

const optimize = async (images, modes) => {
    // TODO: Add projection to data field to ignore data! How?
    const image = await images.findOne({temporary: {$exists: true}});

    if (image) {
        const temporary = image.temporary;

    } else {
        process.exit();
    }
}

MongoClient.connect(config.mongo_uri)
    .then(database => {
        const db = database.db(config.mongo_db);

        optimize(db.collection('image'), db.collection('mode'));
    })
    .catch(err => {
        console.dir(err);
        console.error("Please check you db connection parameters");
        process.exit(1);
    });
