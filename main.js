const {Client, Intents, MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton} = require("discord.js"),
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
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS
			]
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
		rp_info.discus_ch_id.push(it.discus_ch_id)
		rp_info.forms_ch_id.push(it.forms_ch_id)
	})
})

let embed,
	project,
	admins=[],
	logsChannel,
	rp_info= {
		forms_ch_id:[],
		discus_ch_id: []
	},
	commands=[
		{
			name:'rp',
			description:'Chose rp'
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
				},
				{
					name:"main_channel",
					type:"CHANNEL",
					description:"Main rp channel",
					required: true
				}
			]
		},
		{
			name:"wipe",
			description: "DROP TABLE"
		},
		{
			name:"ban_sys",
			description: "Work with ban sys",
			options: [
				{
					name:"ban",
					type:"SUB_COMMAND",
					description: "This ban some user",
					options:[
						{
							name:"user",
							type:"USER",
							description:"User, who will banned",
							required: true
						},
						{
							name: "ban_reason",
							type: "STRING",
							description: "Reason to ban user"
						}
					]
				},
				{
					name:"unban",
					type: "SUB_COMMAND",
					description: "This unban some user",
					options:[
						{
							name: "user",
							type: "USER",
							description: "User, who will unbanned",
							required: true
						},
						{
							name: "end_time",
							type: "STRING",
							description: "Timestamp in format 'SS_MM_HH_DD'. If u want permanent ban, leave this blank"
						},
						{
							name: "ban_reason",
							type: "STRING",
							description: "Reason to unban user"
						}
					]
				}
			]
		},
		{
			name:"rp_discus",
			description: "Start some discussion:D",
			options:[
				{
					name:"msg_id",
					type:"STRING",
					description: "ID of msg you want to discuss",
					required: true
				},
				{
					name:"msg_content",
					type: "STRING",
					description: "Message's text",
					required: true
				}
			]
		},
		{
			name: "help",
			description: "Help with some command",
			options: [
				{
					name:"command_name",
					type: "STRING",
					description: "Name of cmd to help with"
				}
			]
		},
		{
			name:"rp_state",
			description: "Change your rp state on server"
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
				msg.reply("Here is bot's commands:\nThere is nothing\n\npaparating na:D")
			}
		break;
	}
}
function select_rp(inter, select_menu_id, button_id, offset){
	const row = new MessageActionRow()
	let menu = new MessageSelectMenu().setCustomId(select_menu_id).setPlaceholder('Select RP').setMaxValues(5),
		button = new MessageButton()
			.setStyle("SECONDARY")
			.setLabel("Next page")
			.setCustomId("rp_next_page"+(offset+4))
	connection.query("select * from rp_info limit 6 offset ?;",[offset],(err,data)=>{
		if(err)console.log(err)
		if(data.length===5){
			data.forEach((it)=>{
				menu.addOptions([{
					label: it.value,
					value: it.name
				}])
			})
		}else{
			data.forEach((it, index)=>{
				if(index < 5) {
					menu.addOptions([{
						label:it.value,
						value:it.name
					}])
				}else if(index<=5){
					row.addComponents(button)
				}
			})
		}
		row.addComponents(menu);
		inter.update({
			components:[row],
			ephemeral:true
		})
	})
}
function user_stats(msg){
	console.log(`\x1b[35m[${moment().format("DD.MM HH:mm:ss")}]\x1b[34m\n\tchatID:\x1b[0m ${msg.channelId}\x1b[34m\n\tuserID:\x1b[0m ${msg.author.id}\x1b[34m\n\tusertag:\x1b[0m ${msg.author.username}#${msg.author.discriminator}\x1b[34m\n\tmsgID:\x1b[0m ${msg.id}\x1b[34m\n\ttext:\x1b[0m>${msg.content}<`)
	connection.query(`SELECT * FROM users WHERE userID = ${msg.author.id};`,(err,res)=>{
		if(err)console.log(err);
		if(res.length!==0){
			if(res[0].msgCount%res[0].divisor!==0){
				connection.query(`UPDATE users SET msgCount = ${res[0].msgCount+=1} WHERE userID = ${msg.author.id};`,(err)=>{
					if(err)console.log(err);
				})
			}else{
				connection.query('UPDATE users SET msgCount=?, lvl=?, divisor=? WHERE userID=?;',[res[0].msgCount+1,res[0].lvl+1,res[0].divisor+25*(res[0].lvl+1),msg.author.id],(err)=>{
					if(err) console.log(err);
				})
			}
		}else{
			connection.query(`INSERT INTO users(userID,roles) VALUES (?);`,[msg.author.id.toString(),msg.member._roles.join("$").replace(/s/,"")],(err)=>{
				if(err)console.log(err);
			})
		}
	})
}
function keep_connection(){
	connection.query("SELECT * FROM mutedPPL;", (err,data)=>{
		if(err)console.log(err)
		data.forEach(it=>{
			if(Number(it.endMute)<Date.now()){
				sample.members.cache.get(it.userID).roles.remove(mute,`End of mute`)
					.then(mbr=>{
						if(it.roles.split("$")){
							mbr.roles.add(it.roles.split("$"))
						}
						mbr.user.createDM()
							.then(dm=>dm.send("```Your mute is over.\nAll privileges have been restored.```"))
						connection.query("DELETE FROM mutedPPL WHERE userID=?",it.userID)
					})
			}
		})
	})
}

bot.on("ready", ()=>{
	setInterval(keep_connection, 5*60*1000)
	project=bot.guilds.cache.get("897986118077788221");
	logsChannel=project.channels.cache.find(ch=>ch.name==="sample_logs")

	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`);
})
bot.on("messageCreate", async (msg)=>{
	if(msg.author.bot)return;
	if(rp_info.forms_ch_id.includes(msg.channel.id))msg.react("🤔");
	if(!msg.content.startsWith("!"))return user_stats(msg);
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
bot.on("messageReactionAdd", (react,user)=>{
	if(!rp_info.forms_ch_id.includes(react.message.channel.id)||react.me)return;
	if(project.members.cache.get(user.id).roles.cache.has("974444939704426496")){
		if(react.emoji.name==="✅"){
			connection.query("select main_ch_id from rp_info where forms_ch_id=?",[react.message.channel.id], (err, data)=>{
				if(err&&err.errno!==1136)console.log(err)
				project.channels.cache.get(data[0].main_ch_id).permissionOverwrites.create(react.message.author.id,{
					'SEND_MESSAGES':true,
					'CREATE_PUBLIC_THREADS':true,
					'SEND_MESSAGES_IN_THREADS':true
				})
			})
		}
	}else{
		react.remove()
		user.send("Nope")
	}
})
bot.on("interactionCreate",  inter=>{
	if(inter.isCommand()){
		const cmd = inter.commandName,
			sub_cmd = inter.options._subcommand,
			args = inter.options._hoistedOptions
		switch (cmd) {
			case "rp":
				connection.query("select * from rp_info;", (err,data)=>{
					if(err)console.log(err)

					const row = new MessageActionRow()
					let menu = new MessageSelectMenu().setCustomId('rp_selectmenu').setPlaceholder('Select RP'),
						button = new MessageButton()
							.setStyle("SECONDARY")
							.setLabel("Next page")
							.setCustomId("rp_next_page4")

					if(data.length===5){
						data.forEach((it)=>{
							menu.addOptions([{
								label: it.value,
								value: it.name
							}])
						})
					}else{
						data.forEach((it, index)=>{
							if(index < 5) {
								menu.addOptions([{
									label:it.value,
									value:it.name
								}])
							}else if(index<=5){
								row.addComponents(button)
							}
						})
					}
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
				console.log(bot.guilds.cache.get("897986118077788221").members.cache)
				connection.query("delete from users;", err => {
					if(err)console.log(err)
				})
				project.members.cache.map(user=>{
					if(!user.user.bot)connection.query(`insert into users(userID, roles) VALUES("${user.id}","${user._roles.join("$")}")`, err => {
						if (err) console.log(err)
					})
				})
				embed=new MessageEmbed()
					.setTitle("Wipe successful")
					.addField("Was added", project.members.cache.size+'mb":D')
					.setColor("#5514d9")
				inter.reply({
					embeds:[embed],
					ephemeral:true
				})
			break;
			case "ban_sys":
				switch (sub_cmd) {
					//TODO:доделать ban_sys
					case"ban":
					break
					case"unban":

					break
				}
			break
			case "rp_discus":
				connection.query("select discus_ch_id from rp_info where main_ch_id=?;",[inter.channel.type==="GUILD_PUBLIC_THREAD"?inter.channel.parentId:inter.channelId],(err,data)=>{
					if(err)console.log(err);
					inter.channel.messages.fetch(args[0].value)
						.then(msg=> {
							let attach=[]
							let embed = new MessageEmbed()
								.setTitle(args[1].value)
								.setColor("#00ffff")
								.setAuthor({
									name: inter.user.username,
									iconURL: inter.user.avatarURL
								})
								.addField("Message content", msg.content)
								.setImage(msg.attachments.first()?msg.attachments.first().url:"")
							let i=0;
							msg.attachments.map((_attach)=>{
								if(i>0){
									attach.push({
										id: _attach.id,
										name: _attach.name,
										attachment: _attach.url
									})
								}
								i++
							})
							inter.reply({
								content:`Discussion started in <#${data[0].discus_ch_id}>`,
								ephemeral: true
							})
							project.channels.cache.get(data[0].discus_ch_id).send({
								embeds: [embed],
								files: attach
							})
						})
				})
			break;
			case"help":
				switch (args[0]) {
					case"rp_discus":
						embed=new MessageEmbed()
							.setTitle("Helpful info")
							.addField("msg_id","Here should be the ID of the message you want to discuss")
							.addField("msg_content","Here should be what you think about the message")
							.addField("How to find msg id?","Go to settings > advanced and turn on \"developer mode\"")
							.addField("","(I couldn't do it any other way, forgive me <З)")
						inter.reply({
							embeds:[embed],
							ephemeral: true
						})
					break
					default:
						embed=new MessageEmbed()
							.setTitle("Helpful info")
							.addField("",`Sorry, I couldn't find the command "${args[0]}"`)
						inter.reply({
							embeds:[embed],
							ephemeral: true
						})
				}
				break
			case "rp_state":
				connection.query("select * from rp_info;", (err,data)=>{
					if(err)console.log(err)

					const row = new MessageActionRow()
					let menu = new MessageSelectMenu().setCustomId('rp_state_select').setPlaceholder('Select RP'),
						button = new MessageButton()
							.setStyle("SECONDARY")
							.setLabel("Next page")
							.setCustomId("rp_state_next_page4")

					if(data.length===5){
						data.forEach((it)=>{
							menu.addOptions([{
								label: it.name,
								value: it.value
							}])
						})
					}else{
						data.forEach((it, index)=>{
							if(index < 5) {
								menu.addOptions([{
									label: it.name,
									value: it.value
								}])
							}else if(index===5){
								row.addComponents(button)
							}
						})
					}
					row.addComponents(menu);
					inter.reply({
						components:[row],
						ephemeral:true
					})
				})
			break
			default:
				console.log(inter)
		}
	}else if(inter.isSelectMenu()){
		const inter_id = inter.customId,
			args = inter.values;
		switch (inter_id) {
			case "rp_selectmenu":
				connection.query("select * from rp_info where name=?",[args[0]],(err,data)=>{
					if(err)console.log(err)
					inter.member.roles.add(data[0].user_role_id)
					let embed = new MessageEmbed()
						.setColor("#00ff00")
						.setTitle("Role successfully added")
						.addField("You can rp yet","real;D")
					inter.update({
						embeds:[embed],
						ephemeral:true
					})
				})
			break
			case"rp_state_select":
				let row = new MessageActionRow().setComponents(
					new MessageButton()
						.setLabel("Unavailable")
						.setStyle("DANGER")
						.setCustomId("rp_state_unavailable$"+args.join("$")),
					new MessageButton()
						.setLabel("Available")
						.setStyle("SUCCESS")
						.setCustomId("rp_state_available$"+args.join("$"))
					),
					embed = new MessageEmbed()
						.setTitle("Select your state in "+args.join(" and "))
						.setColor("#5800d7")
				inter.reply({
					embeds:[embed],
					components:[row],
					ephemeral:true
				})
			break
		}
	}else if(inter.isButton()){
		if(inter.customId.match(/rp_next_page/)){
			return select_rp(inter, "rp_selectmenu", inter.customId, parseInt(inter.customId.replace(/rp_next_page/,"")))
		}else if(inter.customId.match(/rp_state_next_page/)){
			return select_rp(inter, "rp_state_select", inter.customId, parseInt(inter.customId.replace(/rp_state_next_page/,"")))
		}else if(inter.customId.match(/^rp_state_unavailable|^rp_state_available/)){
			let args = inter.customId.split("$").slice(1),
				cmd = inter.customId.split("$").shift()
			args.map(rp_name=>{
				connection.query("select discus_ch_id,state_msg_id from rp_info where value=?;",[rp_name],(err,data)=>{
					// /unavailable/
					let channel = project.channels.cache.get(data[0].discus_ch_id)

					if(cmd.match(/unavailable$/)){
						if(data[0].state_msg_id){
							channel.messages.fetch(data[0].state_msg_id)
								.then(msg=>{
									embed = new MessageEmbed()
										.setAuthor({
											name: "gohellp",
											iconURL: "https://cdn.discordapp.com/avatars/653202825580380193/965786893775cfd51fdd063e241eee00.webp"
										})
										.setTitle("Users rp_state")
										.setColor("#00ff00")
									msg.embeds.map(embed_=>embed_.fields.map(field=>{
										if(field.value!==`<@${inter.user.id}>`){
											embed.addField(field.name,field.value,field.inline)
										}
									}))
									msg.edit({
										embeds:[embed]
									})
									inter.update({
										embeds:[
											new MessageEmbed()
												.setTitle("Success change state for "+args.join(" and "))
												.setColor("#00ff00")
										]
									})
								})
						}
					}else{
						if(data[0].state_msg_id) {
							channel.messages.fetch(data[0].state_msg_id)
								.then(msg=>{
									embed = new MessageEmbed()
										.setAuthor({
											name: "gohellp",
											iconURL: "https://cdn.discordapp.com/avatars/653202825580380193/965786893775cfd51fdd063e241eee00.webp"
										})
										.setTitle("Users rp_state")
										.setColor("#00ff00")
									msg.embeds.map(embed_=>embed_.fields.map(field=>{
										if(field.value!==`<@${inter.user.id}>`){
											embed.addField(field.name,field.value,field.inline)
										}
									}))
										embed.addField("Available:", `<@${inter.user.id}>`, true)
									msg.edit({
										embeds: [embed]
									})
									inter.update({
										embeds:[
											new MessageEmbed()
												.setTitle("Success change state for "+args.join(" and "))
												.setColor("#00ff00")
										]
									})
								})
						}else{
							embed = new MessageEmbed()
								.setAuthor({
									name: "gohellp",
									iconURL: "https://cdn.discordapp.com/avatars/653202825580380193/965786893775cfd51fdd063e241eee00.webp"
								})
								.setColor("#00ff00")
								.setTitle("Users rp_state")
								.addField("Available:", `<@${inter.user.id}>`, true)
							channel.send({
								embeds: [embed]
							}).then(msg=> {
								msg.pin("Sets rp_state msg")
								connection.query("update rp_info set state_msg_id=? where value=?;",[msg.id,rp_name],err1=>{
									if(err1) console.log(err1)
								})
							})
							inter.update({
								embeds:[
									new MessageEmbed()
										.setTitle("Success")
										.setColor("#00ff00")
								]
							})

						}
					}
				})
			})
		}
	}
})
bot.on("guildMemberUpdate",(oldMbr,newMbr)=>{
	if(newMbr.bot)return;
	let rolesID=[];
	newMbr.roles.cache.forEach(role=>{
		if(role.id!=="897986118077788221")rolesID.push(role.id);
	})
	if(rolesID){
		connection.query('UPDATE users SET roles=? WHERE userID=?;', [rolesID.join('$'), newMbr.id], err => {
			if (err) console.log(err)
		})
	}
})
bot.on("voiceStateUpdate", (vc1,vc2)=>{
	if(vc2.channelId==="897986118954414103"){
		if(vc1.channelId!==null&&!vc1.channel.members.size){
			project.channels.cache.get(vc1.channelId).delete()
				.then(() => {
					connection.query('DELETE FROM voices WHERE ownID=?;', [vc1.id], err1 => {
						if (err1) console.log(err1)
					})
				})
		}

		project.channels.create(`${project.members.cache.find(m=>m.id===vc2.id).user.username}'s channel`,{
			type:'GUILD_VOICE',
			parent:project.channels.cache.get('897986118954414101'),//ID of voice category
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
						project.channels.cache.get(vc1.channelId).delete()
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

process.on('exit',code=>{
	connection.query('update rp_info set state_msg_id="" where length(state_msg_id)>0;',err=>{
		if(err)console.log(err)
		console.log(code)
	})
})