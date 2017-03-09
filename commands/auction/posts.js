const Commando = require('discord.js-commando');
//var cc = require('./cc/getItems.js');
const ahData = require('../../parseAhDataForServer.js');
const config = require('../.././config/config.js');

class ccPosts extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'posts',
            aliases: ['post', 'postatos', 'postarino', 'posta', 'podesa', 'postero', 'po'],
            group: 'auction',
            memberName: 'posts',
            description: 'How many posts a person has on the auction house, adding "all" will list items',
            details: 'Adding "all" after the name will display a list of unique items that user has posted. Doing $posts with nothing else shows how many posts are on that realm.',
            examples: ['$posts Cc all Ysondre US, $posts dade arthas eu, $posts budvar, $posts cc all, $posts'],
            argsCount: 2,
            argsType: 'multiple'
        });
    }

    async run(msg, args)
    {
        var realm = config.guild.realm; // Ysondre
        var region = config.guild.region; // en_US
        console.log(args);
        var text = "";
        var name = "";
        var diffRealm = false;
        // if we got realm/region data
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
                name = args.shift();
                text = args.join(" "); // item
                diffRealm = true;
            } else {
                name = args.shift();
                text = args.join(" ");
                //console.log("our name is:\n" + text);
            }
        }

        msg.message.channel.sendMessage('Getting data for ' + realm +' '+ region +'. This may take some extra time.').then((message) => {
            if(name === "")
            {
                ahData.numOfAuctions(realm, region, function callback(data){
                    message.delete() 
                    msg.message.channel.sendMessage(`There are ${data} posts on this realms auction house`);
                });
            } else if (text.toLowerCase() === "all")
            {
                ahData.listAllItemsOfOwner(name, realm, region, function callback(data){
                    message.delete() 
                    msg.message.channel.sendMessage(data);
                });   
            }else
            {
                ahData.numOfAuctionsForOwner(name, realm, region, function callback(data){
                    message.delete() 
                    msg.message.channel.sendMessage(`${name} ${realm}-${region} has ${data} posts on the auction house`);
                });
            }
        });
    }
}

module.exports = ccPosts;
