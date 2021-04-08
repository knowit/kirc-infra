const { MongoClient } = require('mongodb')
const index = 'Message'
const password = process.env.PASSWORD
const mongoConnectionString = "mongodb://kirc:" + password + "@knowit-irc-messages.cluster-ci2nclm2m805.eu-central-1.docdb.amazonaws.com:27017/?ssl=false&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true
}
let cachedCollection = null;
const debug = process.env.DEBUG

// Handler
exports.handler = async function (event, context) {
  console.log('Started handling event', event)
  const messages = event.Records.map((record) => JSON.parse(record.body))
  const processedMessages = messages.map(message => processMessage(message))
  await send(processedMessages)
  console.log("Finished handling event")
  context.succeed('Exit')
}

const processStyleTokens = function (message, style) {

  let styleParts = style.split(';');
  if (message.startsWith('/')) {
    const space = message.indexOf(' ');
    if (space === -1) {
      return {
        message, // change message to '' if we want to remove slash-commands without space
        style,
      } 
    }
    const cmd = message.substring(0, space);
    const text = message.substring(space);
    if (cmd.indexOf('i') !== -1) {
      styleParts = styleParts.filter(function(s) {
        return !s.startsWith('font-style');
      })
      styleParts.push('font-style: italic')
    }
    if (cmd.indexOf('b') !== -1) {
      styleParts = styleParts.filter(function(s) {
        return !s.startsWith('font-weight');
      })
      styleParts.push('font-weight: bold')
    }
    return {
      message: text,
      style: styleParts.join(';')
    }
  }
  return {
    message,
    style,
  }
}

const processMessage = function (message) {
  console.log('Processing message', message)
  return {
    ...processStyleTokens(message.message, message.style),
    timestamp: processTimestamp(message.timestamp),
    id: message.id,
    nickname: message.nickname,
  }
}

const send = async function send(messages) {
  console.log("Sending", messages)
  await connectToDatabase()
  await cachedCollection.insertMany(messages)
  console.log('Inserted', messages)
  if (debug) {
    const amount = await cachedCollection.countDocuments()
    console.log("Counted documents: " + amount)
  }
}

async function connectToDatabase() {
  if (cachedCollection) {
    console.log('Connection found. Returning')
    return cachedCollection
  }
  console.log('Connection not yet established. Connecting.', mongoConnectionString)
  const client = new MongoClient(mongoConnectionString, mongoOptions)
  const connectedClient = await client.connect()
  console.log("Connection acquired", client)
  const collection = connectedClient.db(index).collection(index)
  console.log('Connection to index ' + index + ' obtained.')
  cachedCollection = collection
  return cachedCollection
}

function processTimestamp(timestampAsString) {
  const date = new Date(timestampAsString)
  const now = new Date()
  // magic number
  const maxOffset = 42069
  if (date.getTime() <= now.getTime() && date.getTime() + maxOffset > now.getTime()) {
    return date.toISOString()
  }
  return now.toISOString()
}