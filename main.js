const {Client, Intents, MessageActionRow, MessageSelectMenu} = require("discord.js"),
	moment = require("moment"),
	{createConnection} = require("mysql2"),
	{token,dbHost,dbLogin,dbPass} = require("./config.json"),
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
	}),
	connection = createConnection({
		host:dbHost,
		user:dbLogin,
		password:dbPass,
		database:"gth_db"
	});
connection.query("select userID from admin order by perm;", (err, data)=>{
	if(err)console.log(err);
	data.forEach(it=>{
		admins.push(it.userID)
	})
});

let project,
	admins=[],
	rp_channels=[],
	commands=[
		{
			name:'rp',
			description:'Chose rp'
		},
		{
			name:"test",
			description:"test"
		},
		{
			name:"add_rp",
			description: "Add rp project to DB",
			options:[
				{
					name:"name",
					type:"STRING",
					description:"name of RP project",
					required: true
				},
				{
					name:"value",
					type:"STRING",
					description:"Value for selectmenu",
					required: true
				},
				{
					name:"role",
					type:"ROLE",
					description:"RP's role",
					required: true
				},
				{
					name:"channel",
					type:"CHANNEL",
					description:"RP forms channel",
					required: true
				}
			]
		}
	];

function userCMDs(msg,cmd,args) {
	switch (cmd) {
		case "help":
			if(args[0]){
				switch(mess[1]){
					case"admin":
						if(admins.includes(msg.author.id)){
							msg.reply(`Nothing here ¯\\_(ツ)_/¯`)
						}else {
							msg.reply("Эта комманда доступна только админам сервера.")
						}
					break;
				}
			}else{
				msg.reply("Here is bot's commands:\nThere is only !report.\nReport: `!report {mention of user} {reason/channel's ID/message's ID}`\n\\>\\>\\>\\>This send report u'r report to admin chat.\n\npaparating na:D")
			}
		break;
	}
}
function check_form(){
	//TODO: перенести проверку анкет из старого кода
}

bot.on("ready", ()=>{
	project=bot.guilds.cache.get("897986118077788221");

	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`);
})
bot.on("messageCreate", async (msg)=>{
	if(rp_channels.includes(msg.channel.id))check_form(msg);
	if(!msg.content.startsWith("!")||msg.author.bot)return;
	let cmd = msg.content.slice(1).toLocaleLowerCase().split(" ").shift(),
		args =msg.content.split(" ").slice(1);
	if(admins.includes(msg.author.id)){
		switch(cmd){
			case "rm":
				let deleteCount = 0;
				try {
					deleteCount = parseInt(args[0], 10)+1;
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
			case "deploy":
				if (!msg.guild) return;
				msg.guild.commands.cache.forEach((com)=>{
					msg.guild.commands.delete(com.id)
				})
				await msg.guild.commands.set(commands)
			break;
			case "wipe":
				//TODO: сделать сброс статистики
			break;
			default:
				userCMDs(cmd,args)
		}
	}
})
bot.on("interactionCreate",  inter=>{
	if(inter.isCommand()){
		let cmd = inter.commandName,
			args = inter.options._hoistedOptions
		switch (cmd) {
			case "rp":
				const row = new MessageActionRow()
				let menu = new MessageSelectMenu().setCustomId('rp_selectmenu').setPlaceholder('Select RP');
				connection.query("select * from rp_parents;", (err,data)=>{
					if(err)console.log(err)
					data.forEach(it=>{
						menu.addOptions([{
							label: it.value,
							value: it.name
						}])
					})
					row.setComponents(menu);
					inter.reply({
						components:[row],
						ephemeral:true
					})
				})
			break
			case "add_rp":
				let data=""
				args.map(it=>{
					data+=" "+it.value
				})
				data=data.split(" ")
				connection.query(`insert into rp_parents(name, value, role_id) VALUES('${data[1]}','${data[2]}','${data[3]}')`, err => {
					if (err) return console.log(err);
				})
				connection.query(`insert into rp_channels(channel_id, parent_rp) values('${data[4]}','${data[2]}')`,err => {
					if (err) return console.log(err);
				})
				inter.reply({
					content:"RP project successfully added",
					ephemeral: true
				})
			break
		}
	}else if(inter.isSelectMenu()){
		const inter_id = inter.customId,
			args = inter.values;
		switch (inter_id) {
			case "rp_selectmenu":
				args.map(it=>{
					//TODO: доделать до открытия категории рп только по роли
				})
			break
		}
	}else return;
})
bot.on("voiceStateUpdate", (vc1,vc2)=>{ //TODO: переписать эту заглушку
	if(vc2.channelId==="897986118954414103"){
		if(vc1.channelId!==null&&!vc1.channel.members.size){
			sample.channels.cache.get(vc1.channelId).delete()
				.then(() => {
					connection.query('DELETE FROM voices WHERE ownID=?;', [vc1.id], err1 => {
						if (err1) console.log(err1)
					})
				})
		}

		sample.channels.create(`${sample.members.cache.find(m=>m.id===vc2.id).user.username}'s channel`,{
			type:'GUILD_VOICE',
			parent:sample.channels.cache.get('897986118954414101'),//ID of voice category
			permissionOverwrites:[
				{
					id: vc2.id,
					allow: ['MANAGE_CHANNELS','MANAGE_ROLES']
				}
			]
		})
			.then(ch=>{
				vc2.setChannel(ch)
				connection.query(`INSERT INTO voices(voiceID,ownID) VALUES(${ch.id},${vc2.id});`,err => {
					if(err)console.log(err)
				})
			})
	}else if(vc2.channelId!==vc1.channelId&&vc1.channelId!==null){
		connection.query('SELECT * FROM voices WHERE voiceID=?;',[vc1.channelId],(err,res)=>{
			if(err)console.log(err)


			if(res[0]&&res[0].ownID===vc1.id){
				if(!vc1.channel.members.size){
					try {
						sample.channels.cache.get(vc1.channelId).delete()
							.then(() => {
								connection.query('DELETE FROM voices WHERE ownID=?;', [vc1.id], err1 => {
									if (err1) console.log(err1)
								})
							})
					} catch (e) {
						logsChannel.send(`<@653202825580380193> some error with Deleting Voice Channel.\nError message:\`\`\`${e}\`\`\``)
					}
				} else {
					let nextMemberOwner = vc1.channel.members.toJSON()[Math.floor(Math.random() * (vc1.channel.members.size - 1))]
					connection.query("UPDATE voices SET ownID=? WHERE ownID=?;",[nextMemberOwner.id, res[0].ownID], (err)=>{
						if(err)console.log(err)
						vc1.channel.edit({name: `${nextMemberOwner.user.username}'s channel`,
							permissionOverwrites: [
								{
									id: nextMemberOwner.id,
									allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES']
								}
							]
						})
					})
				}
			}
		})
	}
})

bot.login(token)