'use strict'

const {MongoClient, Binary, ObjectID} = require('mongodb');
const formatSupport = require('../util/formatSupport');

class ModeHandler {

    constructor(db) {
        this.db = db;
        this.modes = db.collection('mode');
    }

    async list(name) {
        return await this.modes.find({name: name}).toArray();
    }

    async listHandler(req, res) {
        const list = await this.list(req.params);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(list));
    }

    /**
     * 
     * @param {mode: optional, size: optional, limit: optional, skip: optional} params 
     */
    async list(params) {
        const list = await this.modes.find()
                .project({'404': 0, watermark: 0})
                .limit(params.limit ? params.limit : 100)
                .skip(params.skip ? params.skip : 0)
                .sort({modified: -1})
                .toArray();

        list.forEach(i => {
            i.id = i._id;
            delete i._id;
        });

        return list;
    }

}

module.exports = ModeHandler;
