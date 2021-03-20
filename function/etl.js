'use strict';

const AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk-core')
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
const Lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });
const MongoClient = require('mongodb').MongoClient
const format = requrie('util').format
const fs = require('fs')
const mongoConnectionString = `mongodb://kirc:${process.env.mongoPassword}@knowit-irc-messages.ci2nclm2m805.eu-central-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&retryWrites=false`
const mongoOptions = {
    sslValidate: true,
    sslCA: ca,
    useNewUrlParser: true
}

// Your queue URL stored in the queueUrl environment variable
const QUEUE_URL = "https://sqs.eu-central-1.amazonaws.com/030483651510/message_processor_queue.fifo";
const PROCESS_MESSAGE = 'process-message';


function invokePoller(functionName, message) {
    const payload = {
        operation: PROCESS_MESSAGE,
        message,
    };
    const params = {
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: new Buffer(JSON.stringify(payload)),
    };
    return new Promise((resolve, reject) => {
        Lambda.invoke(params, (err) => (err ? reject(err) : resolve()));
    });
}


function processMessage(message, callback) {
    console.log(message);
    const promise = MongoClient.connect(mongoConnectionString, mongoOptions)

    promise.then(client => 
        client.db()
        )

    // delete message
    const params = {
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
    };
    SQS.deleteMessage(params, (err) => callback(err, message));
}

function poll(functionName, callback) {
    const params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 10,
    };
    // batch request messages
    SQS.receiveMessage(params, (err, data) => {
        if (err) {
            return callback(err);
        }
        // for each message, reinvoke the function
        const promises = data.Messages.map((message) => invokePoller(functionName, message));
        // complete when all invocations have been made
        Promise.all(promises).then(() => {
            const result = `Messages received: ${data.Messages.length}`;
            console.log(result);
            callback(null, result);
        });
    });
}

exports.handler = (event, context, callback) => {
    try {
        if (event.operation === PROCESS_MESSAGE) {
            // invoked by poller
            processMessage(event.message, callback);
        } else {
            // invoked by schedule
            poll(context.functionName, callback);
        }
    } catch (err) {
        callback(err);
    }
};
