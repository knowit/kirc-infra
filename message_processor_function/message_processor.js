const { MongoClient } = require('mongodb');
const index = 'Message';
const password = process.env.PASSWORD;
const mongoConnectionString =
  'mongodb://kirc:' +
  password +
  '@knowit-irc-messages.cluster-ci2nclm2m805.eu-central-1.docdb.amazonaws.com:27017/?ssl=false&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false';
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true,
};
let cachedCollection = null;
const debug = process.env.DEBUG;

// Handler
exports.handler = async function (event, context) {
  console.log('Started handling event', event);
  const messages = event.Records.map((record) => JSON.parse(record.body));
  const processedMessages = messages.map((message) => processMessage(message));
  await send(processedMessages);
  console.log('Finished handling event');
  context.succeed('Exit');
};

const processMessage = function (message) {
  console.log('Processing message', message);

  let content = message.message;

  if (content.startsWith('/bi') || content.startsWith('/ib')) {
    message.style += 'font-weight: bold; font-style: italic;';
    content = content.substring(3);
  } else if (content.startsWith('/b')) {
    message.style += 'font-weight: bold;';
    content = content.substring(2);
  } else if (content.startsWith('/i')) {
    message.style += 'font-style: italic;';
    content = content.substring(2);
  }
  content = content.trim();

  return {
    message: content,
    timestamp: processTimestamp(message.timestamp),
    id: message.id,
    nickname: message.nickname,
    style: message.style,
  };
};

const send = async function send(messages) {
  console.log('Sending', messages);
  await connectToDatabase();
  await cachedCollection.insertMany(messages);
  console.log('Inserted', messages);
  if (debug) {
    const amount = await cachedCollection.countDocuments();
    console.log('Counted documents: ' + amount);
  }
};

async function connectToDatabase() {
  if (cachedCollection) {
    console.log('Connection found. Returning');
    return cachedCollection;
  }
  console.log(
    'Connection not yet established. Connecting.',
    mongoConnectionString
  );
  const client = new MongoClient(mongoConnectionString, mongoOptions);
  const connectedClient = await client.connect();
  console.log('Connection acquired', client);
  const collection = connectedClient.db(index).collection(index);
  console.log('Connection to index ' + index + ' obtained.');
  cachedCollection = collection;
  return cachedCollection;
}

function processTimestamp(timestampAsString) {
  const date = new Date(timestampAsString);
  const now = new Date(Date.now());
  if (isNaN(date.getTime()) || date > now || timestampAsString === null) {
    return now.toISOString();
  }
  return date.toISOString();
}
