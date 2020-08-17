const functions = require('firebase-functions');
const admin = require('firebase-admin');
const discord = require('discord.js');

admin.initializeApp();
const db = admin.firestore();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

//
exports.eventCleanUp = functions.pubsub
  .schedule('0 0 1-30/3 * *')
  .onRun(async (context) => {
    const eventsDB = db.collection('events');
    const now = new Date().toISOString();

    const expiredEvents = await eventsDB.where('date', '<=', now).get();

    functions.logger.info(expiredEvents, { structuredData: true });
    if (!expiredEvents.empty) {
      //Spinup Mini Mercchan
      const mercchan = new discord.Client();
      await mercchan.login(`${functions.config().mercchan.discordtoken}`);
      functions.logger.info(mercchan, { structuredData: true });

      const auditchannel = await mercchan.channels.fetch('367468320821215234');
      await auditchannel.send(`Mini-Mercchan is Deleting Old Events`);

      expiredEvents.forEach(async (doc) => {
        await mercchan.channels.cache
          .find((c) => c.id === doc.data().channelID)
          .delete();

        const mercsGuild = await mercchan.guilds.fetch('300763347312181248');
        await mercsGuild.roles.cache
          .find((r) => r.id === doc.data().roleID)
          .delete();
      });

      // Delete Role

      mercchan.destroy();
      return 'Events Deleted';
    }
    return 'No Events to Delete';
  });
