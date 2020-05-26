const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;


const sleep = time => new Promise((resolve) => {
    setTimeout(() => resolve(), time);
});


class MongoWrapper {
    constructor(connection_string, db_name) {
        try {
            if (connection_string.indexOf('mongodb://') === -1) {
                connection_string = 'mongodb://' + connection_string;
            }
            this.connection_string = connection_string;
            this.db_name = db_name;
            //     await this.establishConnection(connection_string);
            return this;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async establishConnection() {
        try {
            if (!this.client || this.client === undefined || this.client === null) {
                const options = {
                    poolSize: 10,
                };
                console.debug(this.connection_string, options);
                this.client = await MongoClient.connect(this.connection_string, options);
                console.info("Mongo Connection Pool Established");
                this.db = this.client.db(this.db_name);
                // this.analytic_db = this.client.db(this.analytic_db_name);
                this.collections = await this.db.listCollections({}).toArray();
            }
            return;
        } catch (err) {
            console.error(err);
            this.client = null;
            // retry
            await sleep(5000);
            return this.establishConnection();
        }
    }

    async closeConnection() {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
                console.info("Mongo Connection Pool Closed");
            }
            return;
        } catch (err) {
            console.error(err);
            this.client = null;
        }
    }

    getObjectId(id) {
        return new mongodb.getObjectId(id);
    }

    getGridFSBucket(query) {
        return new mongodb.getGridFSBucket(this.db, query);
    }

    async listCollections() {
        try {
            return await this.db.listCollections({}).toArray();
        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }

    async distinct(collection, key, query) {
        try {
            return await this.db.distinct(collection, key, query).toArray();
        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }

    async findOne(collection, query) {
        try {
            return await this.db.collection(collection).findOne(query);
        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }

    async find(collection, query, projection, limit, skip, sort) {
        try {

            if (sort && skip && limit) {
                return await this.db.collection(collection).find(query, projection).limit(limit).skip(skip)
                    .sort(sort)
                    .toArray();
            }
            if (sort && skip) {
                return await this.db.collection(collection).find(query, projection).skip(skip).sort(sort)
                    .toArray();
            }
            if (sort && limit) {
                return await this.db.collection(collection).find(query, projection).limit(limit).sort(sort)
                    .toArray();

            }
            if (skip && limit) {
                return await this.db.collection(collection).find(query, projection).limit(limit).skip(skip)
                    .toArray();
            }
            if (sort) {
                return await this.db.collection(collection).find(query, projection).sort(sort).toArray();
            }
            if (skip) {
                return await this.db.collection(collection).find(query, projection).skip(skip).toArray();
            }
            if (limit) {
                return await this.db.collection(collection).find(query, projection).limit(limit).toArray();
            }

            return await this.db.collection(collection).find(query, projection).toArray();


        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }

    async update(collection, filter, update, options) {
        try {
            return await this.db.collection(collection).updateOne(filter, update, options);
        } catch (err) {
            console.error("Error", err);
            return { error: "document not updated" };
        }
    }

    async insert(collection, document) {
        try {
            return await this.db.collection(collection).insertOne(document);
        } catch (err) {
            console.error("Error", err);
            return { error: "document not inserted" };
        }
    }

    async delete(collection, query) {
        try {
            return await this.db.collection(collection).deleteOne(query);
        } catch (err) {
            console.error("Error", err);
            return { error: "document not deleted" };
        }
    }

    async remove(collection, query) {
        try {
            return await this.db.collection(collection).remove(query);
        } catch (err) {
            console.error("Error", err);
            return { error: "document not removed" };
        }
    }
}


module.exports = MongoWrapper;
