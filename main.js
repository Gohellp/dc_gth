const {Client, Intents, MessageActionRow, MessageSelectMenu, MessageEmbed} = require("discord.js"),
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
connection.query("select discus_ch_id,forms_ch_id from rp_info;", (err, data)=>{
	if(err)console.log(err)
	data.map(it=>{
		rp_discus_chs.push(it.discus_ch_id)
		rp_forms_chs.push((it.forms_ch_id))
	})
})

let embed,
	project,
	rp_logs,
	admins=[],
	rp_forms_chs=[],
	rp_discus_chs=[],
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
					name:"user_role",
					type:"ROLE",
					description:"Users's rp role",
					required: true
				},
				{
					name:"admin_role",
					type:"ROLE",
					description:"Admin's rp role",
					required: true
				},
				{
					name:"forms_channel",
					type:"CHANNEL",
					description:"Forms channel",
					required: true
				},
				{
					name:"discus_channel",
					type:"CHANNEL",
					description:"Discussion channel",
					required: true
				}
			]
		},
		{
			name:"wipe",
			description: "DROP TABLE"
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
function check_form(msg){
	msg.react("🤔")
	//TODO:доделать отправку в чат обсуждений с упоминанеим роли рп админа
}

bot.on("ready", ()=>{
	project=bot.guilds.cache.get("897986118077788221");
	rp_logs=project.channels.cache.get("974431401556447302");

	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`);
})
bot.on("messageCreate", async (msg)=>{
	if(rp_forms_chs.includes(msg.channel.id))check_form(msg);
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
				connection.query("select * from rp_info;", (err,data)=>{
					//TODO: проверять кол-во строк в запросе и при кол-ве БОЛЕЕ пяти, запрашивать по 4 штуки(если до конца остаётся БОЛЕЕ 5ти строк)
					if(err)console.log(err)
					//TODO:сделать обработку выпадающего списка БОЛЕЕ 5-ти элементов
					data.forEach((it,index)=>{
						if(index<5){
							menu.addOptions([{
								label: it.value,
								value: it.name
							}])
						}else if(index<=5){
							row.addComponents(
								new MessageButton()
									.setStyle("SECONDARY")
									.setLabel("Next page")
									.setCustomId("rp_next_page")
							)
						}
					})
					row.addComponents(menu);
					inter.reply({
						components:[row],
						ephemeral:true
					})
				})
			break
			case "add_rp":
				let data=[]
				args.map(it=>{
					data.push(it.value)
				})
				connection.query(`insert into rp_info(name, value, user_role_id, admin_role_id, forms_ch_id, discus_ch_id) VALUES('${data.join("','")}')`, err => {
					if (err) return console.log(err);
				})
				embed = new MessageEmbed()
					.setTitle("RP project successfully added")
					.setColor("#00ff00")
				inter.reply({
					embeds:[embed],
					ephemeral: true
				})
			break
			case "wipe":
				connection.query("delete from users;", err => {
					if(err)console.log(err)
				})
				project.members.cache.map(user=>{
					if(!user.bot)connection.query(`insert into users(userID, roles) VALUES("${user.id}","${user._roles.join("$")}")`, err => {
						if (err) console.log(err)
					})
				})
				embed=new MessageEmbed()
					.setTitle("Wipe successful")
					.addField(project.members.cache.size,"Was added")
					.setColor("#5514d9")
				inter.reply({
					embeds:[embed],
					ephemeral:true
				})
			break;
		}
	}else if(inter.isSelectMenu()){
		const inter_id = inter.customId,
			args = inter.values;
		switch (inter_id) {
			case "rp_selectmenu":
				console.log(args)
				args.map(it=>{
					//TODO: доделать до открытия категории рп только по роли
				})
			break
		}
	}else if(inter.isButton()){
		console.log(inter)
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