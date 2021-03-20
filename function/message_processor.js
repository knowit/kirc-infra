const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

// Create client outside of handler to reuse
const lambda = new AWS.Lambda()

// Handler
exports.handler = async function(event, context) {
  event.Records.forEach(record => {
    process(record.body)  
    log(record.body)
    console.log(record.body)
  })
  console.log('## ENVIRONMENT VARIABLES: ' + serialize(process.env))
  console.log('## CONTEXT: ' + serialize(context))
  console.log('## EVENT: ' + serialize(event))
  
  return getAccountSettings()
}

// Use SDK client
var getAccountSettings = function(){
  return lambda.getAccountSettings().promise()
}

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}

var process = function(message) {
    log(message)

    
}

var log = function(message) {
    const currentTime = new Date()
    console.log(`At ${currentTime} a message was received from ${message.nickname}: ${message.message}`)
}

var store = function(message) {
    var client = MongoClient.connect(connectionString, mongoOptions, (err, client){
        if(err) throw err
        db = client.db("Message")
        col = db.collection("Message")

        col.insertOne(message, function(err, result){
            if(err) throw err
        })
        client.close()
    })
}