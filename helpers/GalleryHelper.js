'use strict'

const {MongoClient, Binary, ObjectID} = require('mongodb');
const ModeHelper = require('./ModeHelper');
const formatSupport = require('../formatSupport');

class GalleryHelper {

    constructor(db) {
        this.db = db;
        this.galleries = db.collection('image');
        this.modeHelper = new ModeHelper(db);
    }

    async findHandler(req, res) {
        const gallery = await this.find(req.params);

        if (gallery) {
            gallery.id = gallery._id;
            delete gallery._id;

            res.contentType = 'json';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(gallery));
        } else {
            res.writeHead(404);
            res.end();
        }
    }

    async find(params) {
        const id = req.params.id;
        const mode = req.params.mode;
        const name = req.params.name;

        const q = id ? {_id: new ObjectID(id)} : {name: name, mode: mode};
        const gallery = await this.galleries.findOne(q);

        if (gallery) {
            gallery.id = gallery._id;
            delete gallery._id;

            return gallery;
        } else {
            return null;
        }
    }

}

module.exports = GalleryHelper;