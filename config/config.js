//config

module.exports = {
  admin: {
    name: "KIRO", // OPTIONAL name of your discord avatar
    id: "194730926100578303", // OPTIONAL id for your discord avatar
  },
  guild: {
    name: "Last Attempt", // OPTIONAL
    realm: "Ysondre", // REQUIRED your 'default' realm so you can use commands without adding a realm and region
    region: "en_US", // REQUIRED your 'default' region so you can use commands without adding a realm and region
  },

  // other things
  cmndPrefix: "$", // the prefix you want to use for this bot, could be ! & ~ $cc or whatever you want
  token: "put your bot TOKEN here", // REQUIRED discord bot token
  apiKey: "put your API KEY here", // REQUIRED blizzard api key
  allowedChannel: "", // OPTIONAL channel id to limit the bot to eg. 285562118596722688
  playing: "the auction house!", // Change this to whatever 'game' you want the bot to be playing
};
