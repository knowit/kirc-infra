const AWS = require('aws-sdk')
const sqs = new AWS.SQS({region:'eu-east-1'});
const QUEUE_URL = 'https://sqs.eu-central-1.amazonaws.com/030483651510/etl.fifo'
const message_group_id = "kirc"

// Handler
exports.lambda_handler = async function(event, context) {
  const eventJSON = serialize(event)
  console.log("event", serialize(event))
  await send(eventJSON)
  context.succeed("Exit")
}

var send = async function send(eventJSON) {
  return new Promise(function(resolve, reject) {
    const sqsParams = {
      MessageBody: eventJSON,
      QueueUrl: QUEUE_URL,
      MessageGroupId: message_group_id
      
    }
    
    sqs.sendMessage(sqsParams, function(err, data) {
      if (err) {
        console.log('ERR', err);
        reject(err)
      }
      console.log("data", data)
      resolve(data)
    })
  })
}

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}