#!/usr/bin/env node
'use strict'

const fs      = require('fs');
const http = require('http');
const url = require('url');
const {MongoClient} = require('mongodb');
const config  = require('./config');
const ImageHelper = require('./helpers/ImageHelper');
const GalleryHelper = require('./helpers/GalleryHelper');
const ModeHelper = require('./helpers/ModeHelper');

// Backup folder for the images that we are going to optimize later
if (!fs.existsSync('backup')){
    fs.mkdirSync('backup');
}

MongoClient.connect(config.mongo_uri)
    .then(database => {
        const db = database.db(config.mongo_db);

        const host = config.privateHost || '127.0.0.1';
        const port = config.privatePort || 2203;

        const imageHelper = new ImageHelper(db);
        const galleryHelper = new GalleryHelper(db);
        const modeHelper = new ModeHelper(db);

        http.createServer((req, res) => {
            const paths = req.url.split('/');

            (async function(){
                try {
                    if (paths.length > 1) {
                        /*
                            POST /image
                        */
                        if (req.method == 'POST' && paths.length == 2 && paths[1] == 'image') {
                            return await imageHelper.addHandler(req, res);
                        }
                        
                        /*
                            GET /images
                        */
                        else if (paths.length == 4 && paths[1] == 'images') {
                            req.params = url.parse(req.url, true).query;
                            req.params.mode = paths[2];
                            req.params.size = paths[3];
                            return await imageHelper.listHandler(req, res);
                        }

                        /*
                            POST /mode
                        */
                    else if (req.method == 'POST' && paths.length == 2 && paths[1] == 'mode') {
                            req.params = url.parse(req.url, true).query;
                            req.params.mode = paths[2];
                            req.params.size = paths[3];
                            return await modeHelper.addHandler(req, res);
                        }

                        /*
                            GET /modes
                        */
                    else if (paths.length == 2 && paths[1] == 'modes') {
                            req.params = url.parse(req.url, true).query;
                            req.params.mode = paths[2];
                            req.params.size = paths[3];
                            return await modeHelper.listHandler(req, res);
                        }
                    }
                } catch(e) {
                    console.dir(e);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    return res.end(JSON.stringify(e));
                }

                res.writeHead(404);
                res.end();
            })();
        }).listen(port, host);

        // console info message
        console.log(`Server running at ${host}:${port}`);
    })
    .catch(err => {
        console.dir(err);
        console.error("Please check you db connection parameters");
        process.exit(1);
    });

process.on('uncaughtException', (err) =>
    console.log('Caught exception: ' + err)
);
