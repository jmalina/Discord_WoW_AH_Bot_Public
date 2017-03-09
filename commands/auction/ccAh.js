const Commando = require('discord.js-commando');
const ahData = require('../../parseAhDataForServer.js');
const config = require('../.././config/config.js');

class ccAh extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'ah',
            aliases: ['auction', 'aah', 'ahh', 'getmesomeauctiondataomgomgomg', 'omg', 'omnom', 'a'],
            group: 'auction',
            memberName: 'ah',
            description: 'Shows details about what an item costs on the auction house.',
            details: 'Auction data can be up to an hour old as this is a limitation of the Blizzard servers',
            examples: ['$ah Starlight Rose Ysondre EU, $ah foxflower, $ah Flask of ten thousand scars'],
            argsCount: 2,
            argsType: 'multiple'
        });
    }

    async run(msg, args)
    {
        if(args.length < 1)
        {
            msg.message.channel.sendMessage('Examples: $ah Starlight Rose Ysondre EU, $ah foxflower, $ah Flask of ten thousand scars');
            return;
        }

        var realm = config.guild.realm; // Ysondre
        var region = config.guild.region; // en_US
        console.log(args);
        //console.log(msg.message.content);
        var text = "";
        var diffRealm = false;
        // if we got realm/region data
        if ( (args[args.length-1].toLowerCase() === 'us') || (args[args.length-1].toLowerCase() === 'eu') ) // last item
        {
            if(args[args.length-1].toLowerCase() === 'eu')
            {
                region = 'en_GB';
            }else{
                region = 'en_US';
            }
            args.pop(); // get off the region
            realm = args.pop(); 
            text = args.join(" "); // item
            diffRealm = true;
        } else {
            text = args.join(" ");
            console.log("our item is:\n" + text);
        }

        msg.message.channel.sendMessage('Getting data for ' + realm +' '+ region +'. This may take some extra time.').then((message) => {
            ahData.queryForItem(text, realm, region, function callback(data){
                message.delete() 
                msg.message.channel.sendMessage(data);
            });
        });
    }
}

module.exports = ccAh;
