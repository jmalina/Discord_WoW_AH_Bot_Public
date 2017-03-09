const Commando = require('discord.js-commando');
const config = require('./config/config.js');

const client = new Commando.Client({
	owner: config.admin.id,
	commandPrefix: config.cmndPrefix

});

client.registry.registerGroups([
	['auction', ' to query the auction house data'],
	])
	.registerDefaultTypes()
	.registerDefaultGroups()
	.registerDefaultCommands({eval_:false})
	.registerCommandsIn(__dirname + '/commands');

if(config.allowedChannel !== "")
{
	client.dispatcher.addInhibitor(msg => {
		// used to limit channel, could make it more robust to make it more than just one channel
		if(msg.channel.id !== config.allowedChannel) return ['gotoRightChannel', msg.reply('Head over to the auction channel to do that!')];
	});
}

client.login(config.token);

client.on('ready', () => {
        client.user.setGame(config.playing);
});

// client.on('message', async (message) => {
// 	//console.log(message.content);
// 	if (message.channel === '285562118596722688' && message.content === '!roll <@285188467904741376>')
// 	{
// 		message.channel.sendMessage('!roll '+message.author);
// 	}
// });

//bot.on('disconnect', () => { process.exit(); })

// things to add to the bot:
// Test cases
