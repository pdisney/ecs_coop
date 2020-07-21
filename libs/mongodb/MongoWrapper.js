const mongodb = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const MongoClient = mongodb.MongoClient;
const GridFSBucket = mongodb.GridFSBucket;
 

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
                    poolSize: 100,
                    useUnifiedTopology: true 
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
        return new ObjectID(id);
    }
 
    IsValidObjectId(id){
        return ObjectID.isValid(id);
    }
 
    getGridFSBucket(query) {
        return new GridFSBucket(this.db, query);
    }
 
    async listCollections() {
        try {
            return await this.db.listCollections({}).toArray();
        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }
 
    async aggregate(collection, query, sort) {
        try {
            const result = await this.db.collection(collection).aggregate(query);
            if (sort)
                result.sort(sort);
            return result.toArray();
        } catch (err) {
            console.error("Error", err);
            return [];
        }
    }
 
    async distinct(collection, key, query) {
        try {
            return await this.db.collection(collection).distinct(key, query);
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
 
    /*  async findCount(collection, query, projection) {
          try {
              return await this.db.collection(collection).find(query, projection).count();
          } catch (err) {
              console.error("Error", err);
              return -1;
          }
      }*/
 
    async find(collection, query, projection, count, limit, skip, sort) {
        try {
            console.debug(collection, query);
            const result = await this.db.collection(collection).find(query, projection);
            if (count) return result.count();
            if (sort)
                result.sort(sort);
            if (skip)
                result.skip(skip);
            if (limit)
                result.limit(limit);
            return result.toArray();
        } catch (err) {
            console.error("Error", err);
            return { "error": err };
        }
    }
 
    async update(collection, filter, update, options) {
        try {
          //  console.debug('mongo update', collection, filter, update, options);
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
 