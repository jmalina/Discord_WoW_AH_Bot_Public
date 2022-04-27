const Commando = require("discord.js-commando");
//var cc = require('./cc/getItems.js');
const ahData = require("../../parseAhDataForServer.js");
const config = require("../.././config/config.js");

class ccUndercut extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "undercut",
      aliases: ["uc", "undercuts", "cuts"],
      group: "auction",
      memberName: "undercut",
      description:
        "Shows a persons items that are undercut. Adding an item just shows data about if that item is undercut.",
      details:
        "Duplicates in the list indicate items posted at different prices or stack sizes",
      examples: [
        "$uc dade arthas eu, $undercut cc, $undercut cc Potion of the Old War ysondre us, $undercut cc dawnlight",
      ],
      argsCount: 2,
      argsType: "multiple",
    });
  }

  async run(msg, args) {
    var realm = config.guild.realm; // Ysondre
    var region = config.guild.region; // en_US
    console.log(args);
    var name = "";
    var text = ""; // item
    var diffRealm = false;

    if (args.length < 1) {
      msg.message.channel.sendMessage(
        "Examples: $uc dade arthas eu OR $undercut cc OR $undercut cc Potion of the Old War ysondre us OR $undercut cc dawnlight"
      );
      return;
    }
    // if we got realm/region data
    if (
      args[args.length - 1].toLowerCase() === "us" ||
      args[args.length - 1].toLowerCase() === "eu"
    ) {
      // last item
      if (args[args.length - 1].toLowerCase() === "eu") {
        region = "en_GB";
      } else {
        region = "en_US";
      }
      args.pop(); // get off the region
      realm = args.pop();
      name = args.shift();
      text = args.join(" "); // item
      diffRealm = true;
    } else {
      name = args.shift();
      text = args.join(" ");
    }

    msg.message.channel
      .sendMessage(
        "Getting data for " +
          realm +
          " " +
          region +
          ". This may take some extra time."
      )
      .then((message) => {
        ahData.undercut(name, text, realm, region, function callback(data) {
          message.delete();
          msg.message.channel.sendMessage(data);
        });
      });
  }
}

module.exports = ccUndercut;
