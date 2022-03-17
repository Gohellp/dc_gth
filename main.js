const { Client, Intents, MessageCollector,createMessageCollector, MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require("discord.js"),
	moment    = require('moment'),
	mysql     = require('mysql2'),
	cfg       = require('./config.json'),
	bot       = new Client({
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

const connection =mysql.createConnection({
	host:cfg.dbHost,
	user:cfg.dbLogin,
	database:"gth_db",
	password:cfg.dbPass
});
connection.query('SELECT userID from admin;',(err,data)=>{
	data.forEach(it=>{
		admins.push(it.userID)
	})
})
connection.query('SELECT * FROM rp_channels;',(err,data)=>{
	if(err)console.log(err)
	data.forEach(ID=>{
		rpChannels.push(ID.channel_id)
	})
})

const adminRoles ={
	0:"sample_own",
	1:"sample_admin",
	2:"sample_mod",
	3:"sample_observer",
	4:"sample_bots"
},
	userRoles ={//0 - нет каких-либо разрешений, +∞ - какие-либо доп плюшки
	0:"sample_newbie",
	1:"sample_user",
	2:"sample_junior"
},
	adminNums ={
	"own"   :0,
	"admin" :1,
	"mod"   :2,
	"obs"   :3,
	"bot"   :4
};
let own,
	mute,
	sample,
	logsChannel,
	discusChannel,
	member_to_add,
	admins=[],
	rpChannels=[];

async function userCommands(msg){
	let mess=msg.content.split(" ")
	mess[0]=mess[0].toLowerCase()
	switch(mess[0]){
		/*
		TODO: !question, !faq(создавать на основе вопроса-ответа, полученных в !question) и
			!helpme(помощь людям с их личными проблемами). Хочу сделать утопическую инфраструктуру,
			которую будет ОЧЕНЬ сложно обмануть
		*/
		case"!help":
			if(!mess[1]){
				msg.reply("Here is bot's commands:\nThere is only !report.\nReport: `!report {mention of user} {reason/channel's ID/message's ID}`\n\\>\\>\\>\\>This send report u'r report to admin chat.\n\npaparating na:D")
			}else{
				switch(mess[1]){
					case"admin":
						connection.query(`SELECT * FROM admin WHERE userID = ${msg.author.id};`,(err,res)=>{
							if(res.length!==0){
								msg.reply(
`Here is all admins commands:
!add {mention} {somewhere} (perms) - adds a user to \${somewhere}
!del {mention} {somewhere} - removes the user from \${somewhere}
!rm {2<number<100} - deleting \${number} messages
!mute {mention|userID} (time in seconds) - I won't comment that ¯\\\\_(ツ)\\_/¯
paparating na:D`
								)
							}else{
								msg.reply("Эта комманда доступна только админам сервера.")
							}
						})
						break;
				}
			}
		break;
		case"!report":
			if(mess[1]&&mess[2]){
				mess.shift()
				bot.channels.cache.find(ch=>ch.id==="898093629564919858")//ID of log channel
					.send(`Жалоба от <@${msg.author.id}>\nНа пользователя: ${mess[0]}\nТекст:\`${mess.splice(2,mess.length).join(" ")}\``)
					.then(message=>{
						report(message)
					})
			}else{
				msg.reply("Вы забыли указать пользователя и/или причину(комментарий/айди сообщения/канал), в котором это произошло.")
			}
/*
|тикет - запрос на вызов админа для выявления нарушений правил сервера. Он предназначен НЕ ДЛЯ задавания вопросов,
|решения личностных конфликтов, или развлечения Отправителя. За использование тикета не по назначению будет кара
|небесная. Тикет будет одним из важнейших звеньев в инфраструктуре сервера.
TODO: отправка репортов с возможностью согласиться на тикет через нажатие реакции. После нажатия на
	реакцию, она пропадает и тикет обновляется(редактирование сообщения) и бот запрашивает время, за которое
	админ обязан выполнить выбранный тикет. Тикет заносится в отдельную таблицу в базе данных. В таблице будут:
	айди Отправителя тикета, айди принявшего, айди сообщения с тикетом(для логов и лс принявшего) и время,
	выделенное на тикет(мб буду записывать дату окончания тикета), которое не может быть более 12 часов.
	В лс будет сообщение с реакциями: галочка - выполнено, крест - отклонить(понижает фактор доверия админа)
	и *что-то* - в ходе выполнения тикета было выявлено, что: а)Отправитель сам разобрался; б)тикет был
	отправлен "по приколу"(мут на 4 часа и запрет на использование тикетов); в)тикет был создан из-за незнания
	правил сервера(понижение прав доступа, вплоть до обязательного повторного прохождения вступления). При слишком
	частом использования его будет накладываться перманентный запрет на тикеты(создать 2 доп колонки в юзерской дб)
*/
		break;
		default:
			msg.reply(`Комманды "${msg.content}" не существует. Прошу Вас ознакомиться с нашим справочником комманд(!hellp).`)
		break;
	}
}
function delChannel(ch,text){
	ch.delete(text)
}
function checkMuted(){
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
						connection.query("DELETE FROM mute WHERE userID=?",it.userID)
					})
			}
		})
	})
}
function report(message){
	message.react('❌');message.react('✔');
	const filter = (reaction) => {
		return ['❌', '✔'].includes(reaction.emoji.name);
	};
	const reactColl = message.createReactionCollector(filter,{
		max: 3,
		time:18000000,
	});

	reactColl.on("collect",(react, user)=>{
		if(react.emoji.name==="✔"&&!user.bot){

		}else if(react.emoji.name==="❌"&&!user.bot){
			message.channel.send("Голосование за снятие тикета")
				.then(msj=>{
					msj.react('➕')
					msj.react('➖')
					const reactCollect = msj.createReactionCollector(filter,{
						max: 5,
						time:18000000,
					});
					reactCollect.on("collect",reaction=>{

					})
				})
		}else if(!user.bot){
			connection.query(`select * from admin where userID = ${user.id};`,(err,res)=>{
				if(err)console.log(err);
				connection.query(`insert into admin(trust_factor) values (${res.trust_factor-100});`,(err)=>{
					if(err) return console.log(err)
					console.log(`Фактор доверия ${user.id} был понижен из-за пренебрежительного отношения к боту.`)
				})
			})
		}
	})
}
function getLine(msgContent_){
	msgContent_ = msgContent_.toLowerCase().split("\n");
	return msgContent_.find(string_=>string_.includes("раса"))
}
function add_rp_admin(){

}

bot.once('ready',()=>{
	setInterval(checkMuted,5000)
	sample=bot.guilds.cache.find(g=>g.id==='897986118077788221')//Guild
	mute=sample.roles.cache.find(r=>r.name==="sample_muted")//Mute role
	logsChannel=sample.channels.cache.find(ch=>ch.name==="sample_logs")
	discusChannel=sample.channels.cache.get("953387408748085339")
	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`)
});
bot.on('messageCreate',async (msg)=>{
	if(msg.author.bot)return;
	if(msg.content.startsWith("!")){
		if(admins.includes(msg.author.id)){
			let aMess=msg.content.toLowerCase().split(" ")
			// noinspection FallThroughInSwitchStatementJS
			switch(aMess[0]){
				case"!add":
					if(!msg.mentions.members){
						msg.reply("Вы не упомянули пользователя, с которым хотите провести операцию")
						return;
					}
					if(aMess[2]){
						switch(aMess[2]){
							case"admin":
								if(aMess[3]){
									connection.query(`INSERT INTO admin(userID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[aMess[3]]});`,(err)=>{
										if(err)console.log(err);
									})
									msg.mentions.members.first().roles.add(sample.roles.cache.find(role=>role.name === adminRoles[adminNums[aMess[3]]]))
									msg.reply("Пользователь успешно поставлен на пост!")
								}else{
									connection.query("SELECT userID FROM admin WHERE perm = 'own';", (err,res)=>{
										if(err) console.log(err);
										own=res[0].userID;
									})
									const col=new MessageCollector(msg.channel,n => n.author.id===own,{
										time:3600000
									})
									msg.reply("own|admin|mod|obs|bot")
									col.on("collect",n => {
										connection.query(`INSERT INTO admin(userID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]});`,(err)=>{
											if(err)console.log(err);
										})
										msg.mentions.members.first().roles.add(sample.roles.cache.find(role=>role.name === adminRoles[adminNums[n.content]]))
										msg.reply("Пользователь успешно поставлен на пост!")
										col.stop()
									});
								}
								break;
						}
					}else{
						msg.reply("Вы заранее не указали, куда добавлять. Пожалуйста, укажите это сейчас")
						const collector=new MessageCollector(msg.channel,m=>admins.includes(m.author.id),{
							time: 3600000
						})
						collector.on("collect",m=>{
							m.content=m.content.split(" ")
							switch(m.content[0]){
								case"admin":
									connection.query("SELECT userID FROM admin WHERE perm = 'own';", (err,res)=>{
										if(err) console.log(err);
										own=res[0].userID;
									})
									if(msg.mentions.members.id){
										if(m.content[1]){
											connection.query(`INSERT INTO admin(userID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[m.content[1]]});`,(err) => {
												if(err) console.log(err);
											})
											msg.mentions.members.first().roles.add(sample.roles.cache.find(role => role.name===adminRoles[adminNums[m.content]]))
											msg.reply("Пользователь успешно поставлен на пост!")
										}else{
											msg.reply("own|admin|mod|obs|bot")
											const col=new MessageCollector(m.channel,n => n.author.id===own,{
												time:3600000
											})
											col.on("collect",n => {
												connection.query(`INSERT INTO admin(userID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]});`,(err) => {
													if(err) console.log(err);
												})
												msg.mentions.members.first().roles.add(sample.roles.cache.find(role => role.name===adminRoles[adminNums[n.content]]))
												msg.reply("Пользователь успешно поставлен на пост!")

											});
										}
									}else{

									}
								break;
							}
						});

					}
				break;
				case"!del":
					if(!msg.mentions.members){
						msg.reply("Вы не упомянули пользователя, с которым хотите провести операцию")
						return;
					}
					if(aMess[2]){
						switch(aMess[2]){
							case"admin":
								connection.query(`SELECT perm FROM admin WHERE userID = ${msg.mentions.members.first().id};`, (err,res)=>{
									if(err) console.log(err);
									msg.mentions.members.first().roles.remove(sample.roles.cache.find(role=>role.name === adminRoles[res[0].perm]))
								})
								connection.query("DELETE FROM admin WHERE userID=?;", [msg.mentions.members.first().id],(err)=>{
									if(err)console.log(err);
								})
								msg.reply("Пользователь успешно убран с поста.")
							break;
						}
					}else{
						connection.query("SELECT userID FROM admin WHERE perm = 'own';", (err,res)=>{
							if(err) console.log(err);
							own=res[0].userID;
						})
						const collector=new MessageCollector(msg.channel,m => m.author.id===own,{
							time:3600000
						})
						msg.reply("Что ж вы хотите удалить, админ?")
						collector.on("collect", m=>{
							switch(m.content){
								case"admin":
									msg.mentions.members.first().roles.remove(sample.roles.cache.find(role=>role.name === adminRoles[res[0].perm]))
									connection.query("DELETE FROM admin WHERE userID=?;", [msg.mentions.members.first().id],(err)=>{
										if(err)console.log(err);
									})
									msg.reply("Пользователь успешно убран с поста.")
								break;
							}
						})
					}
				break;
				case"!rm":
					const args = msg.content.split(' ');
					let deleteCount = 0;
					try {
						deleteCount = parseInt(args[1], 10);
					}catch(err) {
						return msg.reply('Please provide the number of messages to delete. (max 100)')
					}
					if (!deleteCount || deleteCount < 2 || deleteCount > 100)
						return msg.reply('Please provide a number between 2 and 100 for the number of messages to delete');

					msg.channel.bulkDelete(deleteCount)
						.catch(error => msg.reply(`Couldn't delete messages because of: ${error}`));
				break;
				case"!mute":
					try{
						let rolesIds=[];
						if(admins.includes(msg.author.id)){
							if (msg.mentions.users.first()) {
								sample.members.cache.get(msg.mentions.users.first().id).roles.add(mute, `Muted by ${msg.author.tag}`)
									.then(member_ => {//GuildMember
										member_.roles.cache.toJSON().forEach(role=>{
											if(role.name!=='@everyone'&&role.id!==mute.id){
												rolesIds.push(role.id);
												member_.roles.remove(role.id)
											}
										})
										connection.query(`INSERT INTO mutedPPL(userID, endMute, roles) VALUES (${msg.mentions.members.first().id}, ${msg.content[2]?(Number(msg.content[2])*1000)+Date.now():Date.now()+86400000}, "${rolesIds.join("$")}");`,err=>{
											if (err) console.log(err);
										})
									})
							} else {
								if (Number(msg.content[1])) {
									sample.members.cache.get(msg.content[1]).roles.add(mute, `Muted by ${msg.author.tag}`)
										.then(member_ => {
											member_.roles.cache.toJSON().forEach(role=>{
												if(role.name!=='@everyone'&&role.id!==mute.id){
													rolesIds.push(role.id);
													member_.roles.remove(role.id)
												}
											})
											connection.query(`INSERT INTO mutedPPL(userID, endMute, roles) VALUES (${member_.id}, ${msg.content[2]?(Number(msg.content[2])*1000)+Date.now():Date.now()+86400000});`,(err) => {
												if (err) console.log(err);
											})
										})
								} else {
									msg.reply('Вы забыли выбрать цель. Или цель указанна некорректно.')
								}
							}
						}
					}catch(err){
						logsChannel.send(`<@653202825580380193> some error with Muting Member.\nMember who try to mute: <@${msg.author.id}>\nMember: <@${msg.content[1]}>\nError message:\`\`\`${err}\`\`\``)
						console.log(err)
					}
				break;
				case"!ban":
					if(msg.mentions.members.first()||aMess[2]){
						if(msg.mentions.members.first()){
							connection.query("UPDATE users SET banned = ? WHERE userID = ?",[true,msg.mentions.members.first().id],(err)=>{
								if(err)console.log(err);
								sample.members.cache.find(u=>u.id=msg.mentions.members.first().id).kick(`Banned by <@${msg.author.id}>`)
									.send(`U've banned by ${msg.author.username}(${msg.author.id})`)
									.then(()=>{
										console.log(`\x1b[31mBAN\n\x1b[32mAdmin: \x1b[95m${msg.author.username}\x1b[39m(${msg.author.id})\n\x1b[93mBanned member: \x1b[95mm${msg.mentions.members.first().nickname}\x1b[39m(${msg.mentions.members.first().id})`)
										logsChannel.send(`#BAN\nAdmin: ${msg.author.username}(${msg.author.id})\nBanned member: ${msg.mentions.members.first().nickname}(${msg.mentions.members.first().id})`)
									})
							})
						}else{
							connection.query("UPDATE users SET banned = ? WHERE userID = ?",[true,aMess[2]],(err)=>{
								if(err)console.log(err);
								let banned=sample.members.cache.find(u=>u.id=aMess[2])
									banned.send(`U've banned by ${msg.author.username}(${msg.author.id})`)
									banned.kick(`Banned by <@${msg.author.id}>`)
									.then(()=>{
										console.log(`\x1b[31mBAN\n\x1b[32mAdmin: \x1b[95m${msg.author.username}\x1b[39m(${msg.author.id})\n\x1b[93mBanned member: \x1b[95mm${banned.username}\x1b[39m(${banned.id})`)
										logsChannel.send(`#BAN\nAdmin: ${msg.author.username}(${msg.author.id})\nBanned member: ${banned.username}(${banned.id})`)
									})
							})
						}
					}else{
						msg.reply("You didn't mention the user or didn't specify his userID")
					}
				break;
				case"!deploy":
					if (!msg.guild) return;
					msg.guild.commands.cache.forEach((com)=>{
						 msg.guild.commands.delete(com.id)
					})
					await msg.guild.commands.set([
						{
							name:'help',
							description:'Send some helpful info'
						},
						{
							name:'report',
							description:'Em... Report?',
							options:[
								{
									name:'who',
									type:'USER',
									description:'The participant for whom the report is being compiled',
									required: true
								},
								{
									name:'idk',
									type:'STRING',
									description:'Description of report',
									required: false
								}
							]
						}
					])
				break;
				case"!rp":
					// noinspection JSCheckFunctionSignatures
					const row = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId("rp_add_admin")
								.setLabel("Add rp admin")
								.setStyle("SUCCESS")
						)
					const embed = new MessageEmbed()
						.setColor('#0099ff')
						.setTitle('Select what u want')
					msg.reply({
						embeds:[embed],
						components:[row]
					})
					break;
				default:
					await userCommands(msg)
				break;
			}
		}else{
			await userCommands(msg);
		}
	}else{
		if(rpChannels.includes(msg.channel.id)){
			let indexOfRaceLine_ = getLine(msg.content)
			if(msg.content.toLowerCase().includes("рост")){
				let firstLine = msg.content.toLowerCase().split("\n")[0].split(" ");
				if(indexOfRaceLine_.includes("человек")&&firstLine.length<2){
					discusChannel.send(`<@${msg.author.id}> Вы забыли указать фамилию в анкете`)
					return;
				}
			}else{
				let firstLine = msg.content.toLowerCase().split("\n")[0].split(" ");
				if(indexOfRaceLine_.includes("человек")&&firstLine.length<=2){
					discusChannel.send(`<@${msg.author.id}> Вы забыли указать фамилию в анкете`)
					return;
				}
				discusChannel.send(`<@${msg.author.id}> Вы забыли указать рост в анкете`)
				return;
			}
			msg.react('🤔')
				.then(reaction_=>{
					const filter=(reaction, user)=>reaction.emoji.name==='✅'&&admins.includes(user.id);
					const collector_=msg.createReactionCollector({filter,max:1,time:3600000})
					collector_.on("collect",()=>{
						reaction_.remove()
						sample.members.cache.get(msg.author.id).roles.add("953734365056208936")//rp user role
						return;
					})
				})
		}
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
				connection.query(`INSERT INTO users(userID) VALUES ('${msg.author.id}');`,(err)=>{
					if(err)console.log(err);
				})
			}
		})
	}
});
bot.on('interactionCreate', inter=>{
	if(inter.isCommand()){
		let command = inter.commandName,
			args = inter.options._hoistedOptions
		switch (command) {
			case'help':
				inter.reply("Here is bot's commands:\nThere is only !report.\nReport: `!report {mention of user} {reason/channel's ID/message's ID}`\n\\>\\>\\>\\>This send report u'r report to admin chat.\n\npaparating na:D")
			break
			case'report':
				logsChannel.send(`Жалоба от <@${inter.user.id}>\nНа пользователя: ${args[0].user}\nТекст:\`${args[1].value}\``)
					.then(message => {
						report(message)
						inter.reply("Report has been sent")
					})
			break
		}
	}else if(inter.isButton()){
		let interID = inter.customId
		switch (interID) {
			case"rp_add_admin":
				inter.reply("Enter uID or mention this person")
				connection.query("SELECT userID FROM admin WHERE perm = 0;", (err,res)=>{
					if(err) console.log(err);
					own=res[0].userID;
				})
				const collector = inter.channel.createMessageCollector({
					filter:n => n.author.id===own,
					max:1,
					time:10*60*1000,
					dispose:true
				})
				collector.on("collect", ctx=>{
					if(ctx.mentions.members.first()){//here
						connection.query(`SELECT * from rp_parents;`, (err, res) => {// LIMIT 4 OFFSET 4 (+4)
							if (err) console.log(err);

							member_to_add = ctx.mentions.members.first()
							const row = new MessageActionRow()
							const menu = new MessageSelectMenu().setCustomId('select_rp_uni').setPlaceholder('Select rp universe');

							const embed = new MessageEmbed()
								.setColor("#0099ff")
								.setTitle('Select rp universe:')

							const button = new MessageButton()
								.setCustomId('next_select_uni')
								.setLabel("Next")
								.setStyle("SECONDARY")
							res.forEach((item,i) => {
								if(i<5){
									menu.addOptions([
										{
											label:item.name,
											value:item.role_id.toString()
										}
									])
								}
								if(i===5){
									row.addComponents(button)
								}
							});
							row.addComponents(menu)
							ctx.reply({
								embeds:[embed],
								components: [row]
							})
						})
					}else if(ctx.content){
						let member = sample.members.cache.find(u=>u.id=ctx.content)
						if(member){//and here
							connection.query(`SELECT * from rp_parents;`, (err, res) => {// LIMIT 4 OFFSET 4 (+4)
								if (err) console.log(err);

								member_to_add = member
								const row = new MessageActionRow()
								const menu = new MessageSelectMenu().setCustomId('select_rp_uni').setPlaceholder('Select rp universe');

								const embed = new MessageEmbed()
									.setColor("#0099ff")
									.setTitle('Select rp universe:')

								const button = new MessageButton()
									.setCustomId('next_select_uni')
									.setLabel("Next")
									.setStyle("SECONDARY")
								res.forEach((item,i) => {
									if(i<5){
										menu.addOptions([
											{
												label:item.name,
												value:item.role_id.toString()
											}
										])
									}
									if(i===5){
										row.addComponents(button)
									}
								});
								row.addComponents(menu)
								ctx.reply({
									embeds:[embed],
									components: [row]
								})
							})
						}else{
							ctx.reply("Wrong data type")
							collector.resetTimer({time: 10*60*1000})
						}
					}else{
						ctx.reply("Wrong data type")
						collector.resetTimer({time: 10*60*1000})
					}
				})
				collector.on("end", (col, reason)=>{
					if(reason==="time"){
						inter.channel.send("You'r not select any user.")
					}
				})
			break;
		}
	}else if(inter.isSelectMenu()){
		switch (inter.values[0]) {
			case"953734365056208936":
				sample.members.cache.get(member_to_add.id).roles.add(sample.roles.cache.get("953913837499842600"))
				inter.reply("Added role to user")
				member_to_add=undefined
			break;
		}
	}else return;
})
bot.on('guildMemberAdd',mbr=>{
	/*TODO:
	   Если же делать раздельные бд, то и делать систему оценки модерации. Оценка будет производиться пользователем по его тикету.
	   Если оценка ниже определённого порога, то модеру и админской команде сообщается о его успеваниях.
	   Если оценка модера ниже ещё, то бот стартует голосование на снятие с должности длиною в пол дня.
	   Если оценка на дне, то бот сам снимает роль. Можно также сделать такую ж автоматизацию и для юзеров, но фиг знает.
	   Дима, не забудь со всеми этими наказаниями сделать и систему повышения карьеры вплоть до модератора:D
	*/
	if(mbr.bot)return;
	connection.query(`SELECT * FROM users WHERE userID = '${mbr.id}';`, (err,res)=>{
		if(err)console.log(err);
		if(mbr.user.bot)return;
		if(res.length===0){
			connection.query(`INSERT INTO users(userID, msgCount, lvl, banned, leaving, perm) VALUES( '${mbr.id}', 0, 0, false, 0, 0);`, (err)=>{
				if(err)console.log(err);
			});
			mbr.roles.add(sample.roles.cache.get("897986447896895488"))//должна быть newbie's role
			if(!bot.channels.cache.find(ch=>ch.name==="for strangers")){
				sample.channels.create(`for strangers`,{
					type:'GUILD_VOICE',
					parent:sample.channels.cache.get('897986118954414100'),//ID of category
					permissionOverwrites:[
						{
							id:'897986118077788221',
							deny:['VIEW_CHANNEL']
						},
						{
							id:'897986447896895488',
							allow:['VIEW_CHANNEL']
						}
					]
				})
					.then(vch=>{
						setTimeout(delChannel,300000,sample.channels.cache.find(c=>c.id===vch.id),"Deleted by time")//300000
					})
			}
			bot.channels.cache.find(ch=>ch.name==="sample_starting")//name of start channel
				.send(`<@${mbr.id}> был создан голосовой чат "for strangers". Прошу зайти туда и Вам наш человек расскажет про жизнь на сервере!\nЭтот войс был создан на 30 мин, будьте быстры!:D`);
		}else{
			if(res[0].banned){
				mbr.kick("Banned status");
				bot.channels.cache.find(ch=>ch.name==="sample_logs")//name of log channel
					.send(`Супостат ${mbr.name} не смог проникнуть на нашу святую землю!!!`);
			}else{
				if(res[0].roles){
					mbr.roles.add(res[0].roles.split('$'))
				}
				if(res[0].trust_factor>150){
					mbr.createDM().then(dm => {
						dm.send("Мне было скучно без Вас:(")
					});
					mbr.guild.roles.cache.find(rl => rl.name===userRoles[res[0].perm]);
				}
				mbr.roles.add(sample.roles.cache.find(r => r.name===userRoles[res[0].perm]))
			}
		}
	})
});
bot.on('voiceStateUpdate',(vc1,vc2)=>{
	if(vc2.channelId==="897986118954414103"){
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
	}else if(vc2.channelId!==vc1.channelId){
		connection.query('SELECT ownID FROM voices WHERE voiceID=?;',[vc1.channelId],(err,ownID_)=>{
			if(err)console.log(err)
			if(ownID_[0])
			if(ownID_[0]&&ownID_[0].ownID===vc1.id){
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
					connection.query("UPDATE voices SET ownID=? WHERE ownID=?;",[nextMemberOwner.id, ownID_[0].ownID], (err)=>{
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
});
bot.on('guildMemberUpdate',(oldMbr,newMbr)=>{//Сделать реагирование на покидание сервера
	let rolesID=[];
	if(newMbr.bot)return;
	newMbr.roles.cache.forEach(role=>{
		if(role.id!=="897986118077788221")rolesID.push(role.id);
	})
	if(rolesID){
		connection.query('UPDATE users SET roles=? WHERE userID=?;', [rolesID.join('$'), newMbr.id], err => {
			if (err) console.log(err)
		})
	}
});
bot.on('guildMemberRemove', mbr=>{
	connection.query('SELECT leaving FROM users WHERE userID=?;',[mbr.id],(err, result) => {
		if(err)console.log(err);
		connection.query('UPDATE users SET leaving=? WHERE userID=?;',[result[0].leaving+1,mbr.id],err1 => {
			if(err1)console.log(err1);
		})
	})

});

bot.login(cfg.token);

process.on('exit',code=>console.log(`Ended with code: ${code}`));
