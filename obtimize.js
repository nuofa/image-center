#!/usr/bin/env node
'use strict'

const config  = require('./config');
const ImageHelper = require('./helpers/ImageHelper');
const {MongoClient, Binary} = require('mongodb');
const CWebp = require('cwebp').CWebp;

/*new CWebp('backup/bf79dfc3c67e7546c33eae741c8e4aeb.png')
.command('-lossless')
  .write('image.webp', function(err) {
    console.log(err || 'encoded successfully');
});*/

const optimize = async (imageHelper) => {
    // TODO: Add projection to data field to ignore data! How?
    const image = await imageHelper.nextTemp();

    if (image) {
        const temporary = image.temporary;
        console.log(temporary)
    } else {
        console.log('Finish!');
        process.exit();
    }
}

MongoClient.connect(config.mongo_uri)
    .then(database => {
        const db = database.db(config.mongo_db);

        const host = config.publicHost || '127.0.0.1';
        const port = config.publicPort || 2201;

        const imageHelper = new ImageHelper(db);

        optimize(imageHelper);
    })
    .catch(err => {
        console.dir(err);
        console.error("Please check you db connection parameters");
        process.exit(1);
    });
