const Commando = require('discord.js-commando');
//var cc = require('./cc/getItems.js');
const ahData = require('../../parseAhDataForServer.js');
const config = require('../.././config/config.js');

class ccTop extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'top',
            aliases: ['tops', 'most', 'to'],
            group: 'auction',
            memberName: 'top',
            description: 'Shows who posts the most auctions on a realm.',
            details: 'Post are non-unique.',
            examples: ['$top, $top arthas eu, $top Ysondre US'],
            argsCount: 2,
            argsType: 'multiple'
        });
    }

    async run(msg, args)
    {
        var realm = config.guild.realm; // Ysondre
        var region = config.guild.region; // en_US
        console.log(args);
        var name = "";
        var text = ""; // item
        var diffRealm = false;

        if(args.length > 0)
        {
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
                diffRealm = true;
            } 
        }

        var author = msg.author;
        msg.message.channel.sendMessage('Getting data for ' + realm +' '+ region +
            '. Looking through this data and finding our top posts will take a few minutes.'+
            ' I will mention you when I am done.').then((message) => {
            ahData.topPosters(realm, region, function callback(data){
                message.delete() 
                msg.message.channel.sendMessage("Yo "+author+" here is that data you requested!");
                msg.message.channel.sendMessage(data);
            });
        });
    }
}

module.exports = ccTop;