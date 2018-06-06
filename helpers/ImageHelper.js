'use strict'

const fs      = require('fs');
const {MongoClient, Binary, ObjectID} = require('mongodb');
const sharp = require('sharp');
const Joi = require('joi');
const crypto = require("crypto");
const formidable = require('formidable');
const ModeHelper = require('./ModeHelper');
const formatSupport = require('../formatSupport');

class ImageHelper {

    constructor(db) {
        this.db = db;
        this.images = db.collection('image');
        this.modeHelper = new ModeHelper(db);

        // Data schemas
        this.imageSchema = Joi.object().keys({
            name: Joi.string().min(1).max(60).required(),
            mode: Joi.string().regex(/^[a-z]{3,30}$/).required(),
            app: Joi.string().alphanum().min(1).max(30),
            language: Joi.string().regex(/^[a-z]{2}$/),
            owner: Joi.string().alphanum().min(1).max(32).optional(),
            label: Joi.string().min(1).max(100)
        });
    }

    praseForm(req) {
        var form = new formidable.IncomingForm();
 
        return new Promise(function(resolve, reject) {
            form.parse(req, function(err, fields, files) {
                if (err) return reject(Err);
                resolve({fields: fields, files: files});
            });
        });
    }

    async addHandler (req, res) {
        const form = await this.praseForm(req);
        const images = await this.add(form);
        res.writeHead(200, {'Content-Type': 'applicaion/json'});
        res.end(JSON.stringify(images));
    }

    async add (params) {
        const file = Object.values(params.files)[0];

        var data = {
            name: params.fields.name,
            mode: params.fields.mode,
            app: params.fields.app,
            language: params.fields.language,
            owner: params.fields.owner,
            label: params.fields.label
        };

        const dateValidate = Joi.validate(data, this.imageSchema);

        if (dateValidate.error) {
            console.log(data);
            console.log(dateValidate);
            return res.end(JSON.stringify({error: 10023, msg: "Invalid request"}));
        }
    
        const modeList = await this.modeHelper.list(data.mode);
        if (modeList.length == 0) {
            res.writeHead(400, {'Content-Type': 'json'});
            return res.end(JSON.stringify({error: 10010, msg: 'Illegal mode'}));

        }
    
        const meta = await sharp(file.path).metadata();
        data.format = meta.format;
        data.temporary = crypto.randomBytes(16).toString('hex');
    
        // Cleanup
        await this.images.remove({name: data.name, mode: data.mode});
    
        const now = new Date();
    
        const results = [];
        for (const mode of modeList) {
            var d = await sharp(file.path)
                .rotate()
                .crop(sharp.strategy.center)
                .resize(mode.width, mode.height)
                .toBuffer();
    
            const newData = JSON.parse(JSON.stringify(data));
            newData.modified = now;
            newData.data = Binary(d);
            newData.size = mode.size;
            const result = await this.images.insert(newData);
    
            // Next
            newData.id = data._id;
    
            if (mode.expire) {
                newData.expire = new Date(new Date().getTime() + mode.expire * 1000);
            }
    
            delete newData.data;
            delete newData._id;
    
            results.push(newData);
        }
    
        // Copy the file
        fs.createReadStream(file.path).pipe(fs.createWriteStream('backup/' + data.temporary + '.' + meta.format));
    
        return results;
    }

    async findHandler(req, res) {
        const params = req.params;
        params.userAgent = req.headers['User-Agent'];
        params.accept = req.headers['Accept'];

        const image = await this.find(params);
        if (image) {
            if (image.modified) {
                res.setHeader('Last-Modified', image.modified);
            }
            if (image.expire) {
                res.setHeader('Cache-Control', image.expire); // Forever
            } else {
                res.setHeader('Cache-Control', 'max-age=37739520, public'); // Forever
            }

            res.setHeader('Content-Type', 'image/' + image.format);
            res.end(image.data.buffer);
        } else {
            res.writeHead(404);
            next();
        }
    }

    /**
     * 
     * @param {id: optional, mode: optional, name: optional, size: optional, userAgent: optional, accept: optional} params 
     */
    async find(params) {
        const id = params.id;
        const mode = params.mode;
        const name = params.name; 
        const size = params.size;
        const userAgent = params.userAgent;
        const accept = params.accept;

        // Find the mode
        const formats = formatSupport(params.userAgent, params.accept);

        for (const format of formats) {
            const q = id ? {_id: new ObjectID(id)} : {name: name, mode: mode, size: size, format: format};
            const image = await this.images.findOne(q);
            if (image != null) {
                return image;
            }
        } 

        // Not found
        const q = {name: mode};
        if (size) {
            q.size = size;
        }

        const notFoundMode = await this.modeHandler.find(q);
        if (notFoundMode && notFoundMode['404']) {
            return {
                format: png,
                data: notFoundMode['404'].buffer
            };
        } else {
            return null;
        }
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
        const list = await this.images.find({mode: params.mode, size: params.size, format: 'jpeg'})
                .project({data: 0})
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

    async removeHandler(req, res) {
        const deleted = await this.deleteImage(params);
        res.send(deleted ? 204 : 404);
    }

    async remove(params) {
        // for id more, we find name & mode from id
        if (params.id) {
            const q = {_id: new ObjectID(params.id)};
            const image = await images.findOne(q);
            if (image) {
                params.name = image.name;
                params.mode = image.mode;
            }
        }

        if (params.name) {
            const q = {name: params.name, mode: params.mode};
            if (params.owner) q.owner = params.owner;
            const result = await images.remove(q);
            return result.result.n > 0;
        }

        return false;
    }

}

module.exports = ImageHelper;