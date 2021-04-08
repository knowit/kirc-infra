const { MongoClient } = require("mongodb");
const index = "Message";
const password = process.env.PASSWORD;
const mongoConnectionString =
  "mongodb://kirc:" +
  password +
  "@knowit-irc-messages.cluster-ci2nclm2m805.eu-central-1.docdb.amazonaws.com:27017/?ssl=false&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false";
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true,
};
let cachedCollection = null;
const debug = process.env.DEBUG;

// Handler
exports.handler = async function (event, context) {
  console.log("Started handling event", event);
  const messages = event.Records.map((record) => JSON.parse(record.body));
  const processedMessages = messages.map((message) => processMessage(message));
  await send(processedMessages);
  console.log("Finished handling event");
  context.succeed("Exit");
};

const processMessage = function (message) {
  console.log("Processing message", message);
  let style = message.style;

  if (message.startsWith("/")) {
    const firstSpace = message.message.indexOf(" ");
    const prefix = message.message.substring(0, firstSpace);
    message.message = message.message.substring(firstSpace + 1);
    switch (prefix) {
      case "/b":
        style = "font-weight: bold;";
        break;
      case "/i":
        style = "font-style: italic;";
        break;
      case "/bi":
        style = "font-style: italic; font-weight: bold;";
        break;
      case "/ib":
        style = "font-style: italic; font-weight: bold;";
        break;
      default:
        break;
    }
  }
  return {
    message: message.message,
    timestamp: processTimestamp(message.timestamp),
    id: message.id,
    nickname: message.nickname,
    style: message.style,
  };
};

const send = async function send(messages) {
  console.log("Sending", messages);
  await connectToDatabase();
  await cachedCollection.insertMany(messages);
  console.log("Inserted", messages);
  if (debug) {
    const amount = await cachedCollection.countDocuments();
    console.log("Counted documents: " + amount);
  }
};

async function connectToDatabase() {
  if (cachedCollection) {
    console.log("Connection found. Returning");
    return cachedCollection;
  }
  console.log(
    "Connection not yet established. Connecting.",
    mongoConnectionString
  );
  const client = new MongoClient(mongoConnectionString, mongoOptions);
  const connectedClient = await client.connect();
  console.log("Connection acquired", client);
  const collection = connectedClient.db(index).collection(index);
  console.log("Connection to index " + index + " obtained.");
  cachedCollection = collection;
  return cachedCollection;
}

function processTimestamp(timestampAsString) {
  let date = new Date(timestampAsString);
  if (isNaN(date.getTime()) || !withinFiveMinutes(date)) {
    date = Date.now();
  }

  return date.toISOString();
}

function withinFiveMinutes(date) {
  const now = Date.now();

  return (
    date.getTime() >= now.getTime() - 300000 && date.getTime() < now.getTime()
  );
}
