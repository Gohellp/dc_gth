const {Client, Intents} = require("discord.js"),
	moment = require("moment"),
	{createConnection} = require("mysql2"),
	{token,dbHost,dbLogin,dbPass} = require("./config.json")
	bot = new Client({
		intents:
			[
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.DIRECT_MESSAGES,
				Intents.FLAGS.GUILD_VOICE_STATES,
				Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
				Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
			],
		partials: ['USER','CHANNEL','GUILD_MEMBER','MESSAGE','REACTION']
	});

let connection = createConnection({
		host:dbHost,
		user:dbLogin,
		password:dbPass,
		database:"gth_db"
	});
connection.query("select userID from admin order by perm;", (err, data)=>{
	if(err)console.log(err);
	data.forEach(it=>{
		admins.push(it)
	})
});

let project,
	admins=[],
	rp_channels=[];

function check_form(){

}

bot.on("ready", ()=>{
	project=bot.guilds.cache.get("897986118077788221");

	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`);
})
bot.on("messageCreate", msg=>{
	if(rp_channels.includes(msg.channel.id))check_form(msg);
	if(!msg.content.startsWith("!")||msg.author.bot)return;
	let cmd = msg.content.slice(1).toLocaleLowerCase().split(" ").shift(),
		args =msg.content.split(" ").slice(1);
	if(admins.includes(msg.author.id)){
		switch(cmd){
			case "rm":
				let deleteCount = 0;
				try {
					deleteCount = parseInt(args[0], 10);
				}catch(err) {
					return msg.reply('Please provide the number of messages to delete. (max 100)');
				}
				if (!deleteCount || deleteCount < 2 || deleteCount > 100)
					return msg.reply('Please provide a number between 2 and 100 for the number of messages to delete');
				else if(msg.channel.type==="DM")
					return msg.reply('You cann\'t use this command in DM chat');

				msg.channel.bulkDelete(deleteCount)
					.catch((error) => msg.reply(`Couldn't delete messages because of: ${error}`));
			break;
		}
	}
})

bot.login(token)