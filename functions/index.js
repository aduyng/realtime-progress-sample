const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {PubSub} = require("@google-cloud/pubsub");

const pubsub = new PubSub();
admin.initializeApp();
const database = admin.database();

exports.run = functions.pubsub.topic("trigger")
    .onPublish((message) => {
      const {sentAt} = message.json;
      console.log(`triggered at ${new Date(sentAt).toString()}`);

      return new Promise((resolve) => {
        let progress = 0;
        const handler = setInterval(() => {
          progress += 1;
          database.ref("progress").set(progress);
          if (progress >= 100) {
            clearInterval(handler);
            resolve();
          }
        }, 500);
      });
    });


exports.trigger = functions.https.onRequest((request, response) => {
  const messageBody = JSON.stringify({sendAt: Date.now()});
  const buffer = Buffer.from(messageBody);
  const fullTopicName = "projects/realtime-progress-sample/topics/trigger";

  return pubsub
      .topic(fullTopicName)
      .publish(buffer)
      .then((messageId) => {
        console.log(`Message ${messageId} published to topic ${fullTopicName}`);
        response.send(JSON.stringify({messageId}));
      })
      .catch((error) => {
        console.error(`unable to publish to topic ${fullTopicName}`);
      });
});
