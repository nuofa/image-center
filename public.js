#!/usr/bin/env node
'use strict'

const http = require('http');
const config  = require('./config');
const {MongoClient} = require('mongodb');
const ImageHelper = require('./helpers/ImageHelper');
const GalleryHelper = require('./helpers/GalleryHelper');

MongoClient.connect(config.mongo_uri)
    .then(database => {
        const db = database.db(config.mongo_db);

        const host = config.publicHost || '127.0.0.1';
        const port = config.publicPort || 2201;

        const imageHelper = new ImageHelper(db);
        const galleryHelper = new GalleryHelper(db);

        http.createServer((req, res) => {
            const paths = req.url.split('/');

            (async function(){
                try {
                    if (paths.length > 2) {
                        /*
                            GET /image/:id
                        */
                        if (paths[1] == 'image' && paths.length == 3) {  
                            req.params = {id: paths[2]}; // mode params
                            return await imageHelper.findHandler(req, res);
                        }
                        
                        /*
                            GET /image/:mode/:name    
                        */
                        else if (paths[1] == 'image' && paths.length == 5) {  
                            req.params = {mode: paths[2], size: paths[3], name: decodeURIComponent(paths[4])};
                            return await imageHelper.findHandler(req, res);
                        }
                        
                        /*
                            GET /gallery/:id
                        */
                        if (paths[1] == 'gallery' && paths.length == 3) {
                            req.params = {id: paths[2]};
                            return await galleryHelper.findHandler(req, res);
                        }
                        
                        /*
                            GET /gallery/:mode/name
                        */
                        else if (paths[1] == 'gallery' && paths.length == 4) {
                            req.params = {mode: paths[2], name: decodeURIComponent(paths[3])};
                            return galleryHelper.findHandler(req, res);
                        }
                    }
                } catch(e) {
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
        console.error("Please check you db connection parameters");
        process.exit(1);
    });

process.on('uncaughtException', (err) =>
    console.log('Caught exception: ' + err)
);
