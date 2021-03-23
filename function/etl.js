const AWS = require('aws-sdk')
const MongoClient = require('mongodb').MongoClient
const format = requrie('util').format
const fs = require('fs')
const mongoConnectionString = `mongodb://kirc:${process.env.mongoPassword}@knowit-irc-messages.ci2nclm2m805.eu-central-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&retryWrites=false`
const mongoOptions = {
    sslValidate: true,
    sslCA: ca,
    useNewUrlParser: true
}

let cachedDb = null;



// Handler
exports.lambda_handler = async function(event, context) {
  const eventJSON = serialize(event)
  console.log("event", serialize(event))
  await send(eventJSON)
  context.succeed("Exit")
}

async function connectToDatabase() {
    if (cachedDb) {
        return Promise.resolve(cachedDb);
    }

    return MongoClient.connect(mongoConnectionString, mongoOptions).then(db => {
        console.log("Connection succeeded!")
        cachedDb = db;
        return cachedDb;
    });
}


var send = async function send(message) {
      const db = await connectToDatabase()
      await db.insertOne(message)
      console.log("Inserted")
      Promise.resolve("ok")
}

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}