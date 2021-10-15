const Discord = require('discord.js');
const moment  = require('moment');
const mysql   = require('mysql2');
const cfg     = require('./config.json');
const bot     = new Discord.Client({
	intents:
		[
			Discord.Intents.FLAGS.GUILDS,
			Discord.Intents.FLAGS.GUILD_MEMBERS,
			Discord.Intents.FLAGS.GUILD_MESSAGES,
			Discord.Intents.FLAGS.DIRECT_MESSAGES,
			Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		],
	partials: ['USER','CHANNEL','GUILD_MEMBER','MESSAGE','REACTION']
});

const connection =mysql.createConnection({
	host:cfg.dbHost,
	user:cfg.dbLogin,
	database:"gth_db",
	password:cfg.dbPass
});
const adminRoles ={
	0:"sample_own",
	1:"sample_admin",
	2:"sample_mod",
	3:"sample_observer",
	4:"sample_bots"
},
	userRoles  ={//0 - нет каких-либо разрешений, +∞ - какие-либо доп плюшки
	0:"sample_newbie",
	1:"sample_user",
	2:"sample_junior"
},
	adminNums  ={
	"own"   :0,
	"admin" :1,
	"mod"   :2,
	"obs"   :3,
	"bot"   :4
},
	answer     ={
	"нет":false,
	"yes":false,
	"да":true,
	"no":true,
}
let own,
	sample,
	admins=[];

function delChannel(ch,text){
	ch.delete(text)
}
function userCommands(msg){
	let mess=msg.content.split(" ")
	mess[0]=mess[0].toLowerCase()
	switch(mess[0]){
		/*
		TODO:!bagrep, !question, !faq(создавать на основе вопроса-ответа, полученных в !question) и
			!helpme(помощь людям с их личными проблемами). Хочу сделать утопическую инфраструктуру,
			которую будет ОЧЕНЬ сложно обмануть
		*/
		case"!help":
			if(!mess[1]){
				//TODO: Всё-таки, придумать что написать в хелпе
				msg.channel.send(`Here is bot's commands:\ncoming soon:D`)
			}else{
				switch(mess[1]){
					case"admin":
						connection.query(`SELECT * FROM admin WHERE uID = ${msg.author.id}`,(err,res)=>{
							if(res.length!==0){
								msg.reply(
`Here is all admins commands:
!add {mention} {somewhere} (perms) - adds a user to somewhere
!del {mention} {somewhere} - removes the user from anywhere
coming soon:D`
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
			if(mess[1]&&mess[2]&&mess[3]){
				mess.shift()
				bot.channels.cache.find(ch=>ch.id==="852608455352909834")//ID of log(?) channel
					.send(`Жалоба получена от <@${msg.author.id}>`)
					.then(message=>{
						message.react('❌');message.react('✔');
						const filter = (reaction, user) => {
							return ['❌', '✔'].includes(reaction.emoji.name) && !user.bot;
						};
						const reactColl = message.createReactionCollector(filter,{
							max: 3,
							time:18000000,
						});

						reactColl.on("collect",react=>{
							console.log(react)
							if(react.emoji.name==="✔"){

							}else if(react.emoji.name==="❌"){
								/*
								TODO:Дима, тебе пизда. Зря ты решил это делать. Надо создать ещё один коллектор реакций и
									ещё один then для работы всего ЭТОГО. Земля тебе пухом.
								*/
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
							}else{
								connection.query(`select * from admin where uID = ${react.author.id}`,(err,res)=>{
									if(err)console.log(err);
									connection.query(`insert into admin(trust_factor, violations) values (${res.trust_factor-100}, ${res.violations+1})`,(err)=>{
										if(err) return console.log(err)
										console.log(`Фактор доверия ${react.author.id} был понижен из-за пренебрежительного отношения к боту.`)
									})
								})
							}
						})
					})
			}else{
				msg.reply("Вы забыли указать, как минимум пользователя, правило и айди сообщения/канал, в котором это произошло.")
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

bot.once('ready',()=>{
	connection.query('SELECT uID from admin;', (err,data)=>{
		data.forEach(it=>{
			admins.push(it.uID)
		})
	})
	sample=bot.guilds.cache.find(g=>g.id==='897986118077788221')//ID of guild
	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`)
});
bot.on('messageCreate',async(msg)=>{
	if(msg.author.bot)return;
	if(!msg.author.bot&&msg.content.startsWith("!")){
		if(admins.includes(msg.author.id)){
			let aMess=msg.content.toLowerCase().split(" ")
			switch(aMess[0]){
				case"!add":
					if(!msg.mentions.members){
						msg.reply("Вы не упомянули пользователя, с которым хотите провести опеfрацию")
						return;
					}
					if(aMess[2]){
						switch(aMess[2]){
							case"admin":
								if(aMess[3]){
									connection.query(`INSERT INTO admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[aMess[3]]});`,(err)=>{
										if(err)console.log(err);
									})
									msg.mentions.members.first().roles.add(sample.roles.cache.find(role=>role.name === adminRoles[adminNums[aMess[3]]]))
									msg.reply("Пользователь успешно поставлен на пост!")
								}else{
									connection.query("SELECT uID FROM admin WHERE perm = 'own';", (err,res)=>{
										if(err) console.log(err);
										own=res[0].uID;
									})
									const col=new Discord.MessageCollector(msg.channel,n => n.author.id===own,{
										time:3600000
									})
									msg.reply("own|admin|mod|obs|bot")
									col.on("collect",n => {
										connection.query(`INSERT INTO admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]});`,(err)=>{
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
						const collector=new Discord.MessageCollector(msg.channel,m=>admins.includes(m.author.id),{
							time: 3600000
						})
						collector.on("collect",m=>{
							m.content=m.content.split(" ")
							switch(m.content[0]){
								case"admin":
									connection.query("SELECT uID FROM admin WHERE perm = 'own';", (err,res)=>{
										if(err) console.log(err);
										own=res[0].uID;
									})
									if(msg.mentions.members.id){
										if(m.content[1]){
											connection.query(`INSERT INTO admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[m.content[1]]});`,(err) => {
												if(err) console.log(err);
											})
											msg.mentions.members.first().roles.add(sample.roles.cache.find(role => role.name===adminRoles[adminNums[m.content]]))
											msg.reply("Пользователь успешно поставлен на пост!")
										}else{
											msg.reply("own|admin|mod|obs|bot")
											const col=new Discord.MessageCollector(m.channel,n => n.author.id===own,{
												time:3600000
											})
											col.on("collect",n => {
												connection.query(`INSERT INTO admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]});`,(err) => {
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
								connection.query(`SELECT perm FROM admin WHERE uID = ${msg.mentions.members.first().id};`, (err,res)=>{
									if(err) console.log(err);
									msg.mentions.members.first().roles.remove(sample.roles.cache.find(role=>role.name === adminRoles[res[0].perm]))
								})
								connection.query("DELETE FROM admin WHERE uID=?", msg.mentions.members.first().id,(err)=>{
									if(err)console.log(err);
								})
								msg.reply("Пользователь успешно убран с поста.")
							break;
						}
					}else{
						connection.query("SELECT uID FROM admin WHERE perm = 'own';", (err,res)=>{
							if(err) console.log(err);
							own=res[0].uID;
						})
						const collector=new Discord.MessageCollector(msg.channel,m => m.author.id===own,{
							time:3600000
						})
						msg.reply("Что ж вы хотите удалить, админ?")
						collector.on("collect", m=>{
							switch(m.content){
								case"admin":
									msg.mentions.members.first().roles.remove(sample.roles.cache.find(role=>role.name === adminRoles[res[0].perm]))
									connection.query("DELETE FROM admin WHERE uID=?", msg.mentions.members.first().id,(err)=>{
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

					const fetched = await msg.channel.messages.fetch({
						limit: deleteCount,
					});
					msg.channel.bulkDelete(fetched)
						.catch(error => msg.reply(`Couldn't delete messages because of: ${error}`));
				break;
				default:
					userCommands(msg)
				break;
			}
		}else{
			userCommands(msg);
		}
	}else{
		console.log(`${msg.author.id}-${msg.channel.name}:\n${msg.content}`)
		connection.query(`SELECT * FROM users WHERE uID = ${msg.author.id}`,(err,res)=>{
			if(err)console.log(err);
			if(res.length!==0){
				if(res[0].msgCount%res[0].divisor!==0){
					connection.query(`UPDATE users SET msgCount = ${res[0].msgCount+=1} WHERE uID = ${msg.author.id}`,(err)=>{
						if(err)console.log(err);
					})
				}else{
					connection.query('UPDATE users SET msgCount=?, lvl=?, divisor=? WHERE uID=?',[res[0].msgCount+1,res[0].lvl+1,res[0].divisor+25*(res[0].lvl+1),msg.author.id],(err)=>{
						if(err) console.log(err);
					})
				}
			}else{
				connection.query(`INSERT INTO users(uID) VALUES ('${msg.author.id}')`,(err)=>{
					if(err)console.log(err);
				})
			}
		})
	}
});
bot.on('guildMemberAdd',mbr=>{
	/*
	Если же делать раздельные бд, то и делать систему оценки модерации. Оценка будет производиться пользователем по его тикету.
	Если оценка ниже определённого порога, то модеру и админской команде сообщается о его успеваниях.
	Если оценка модера ниже ещё, то бот стартует голосование на снятие с должности длиною в пол дня.
	Если оценка на дне, то бот сам снимает роль. Можно также сделать такую ж автоматизацию и для юзеров, но фиг знает.
	Дима, не забудь со всеми этими наказаниями сделать и систему повышения карьеры вплоть до модератора:D
	*/
	connection.query(`SELECT * FROM users WHERE uID = '${mbr.id}'`, (err,res)=>{
		if(err)console.log(err);
		if(res.length===0){
			connection.query(`INSERT INTO users(uID, msgCount, lvl, banned, leaving, perm) VALUES( '${mbr.id}', 0, 0, false, 0, 0)`, (err)=>{
				if(err)console.log(err);
			});
			mbr.roles.add(sample.roles.cache.get("846738135798251540"))//Newbie's role
			if(!bot.channels.cache.find(ch=>ch.name==="for strangers")){
				sample.channels.create(`for strangers`,{
					type:'voice',
					parent:sample.channels.cache.get('897986118954414100'),//ID of category
					permissionOverwrites:[
						{
							id:'845744837315133450',
							deny:['VIEW_CHANNEL']
						},
						{
							id:'846738135798251540',
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
	if(vc2.channelID==="897986118954414103"){
		sample.channels.create(`${sample.members.cache.find(m=>m.id===vc2.id).user.username}'s channel`,{
			type:'voice',
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
				connection.query(`INSERT INTO voices(voiceID,ownID) VALUES(${ch.id},${vc2.id})`,err => {
					if(err)console.log(err)
				})
				/*sample.members.cache.find(m=>m.id===vc2.id).createDM()
					.then(DMchat=>{
						const collector=new Discord.MessageCollector(DMchat,m=>(m.channel.type==="dm"&&m.author.id===vc2.id),{
							time:120000,
						})
						DMchat.send("Хотите ли вы создать текстовый канал?(да|нет)")
						collector.on("collect", msg=>{

							if(answer[msg.content.toLowerCase()]){//Шняга рабочая
								sample.channels.create(`${sample.members.cache.find(m=>m.id===vc2.id).user.username}'s text_channel`,{
									type:'text',
									parent:sample.channels.cache.get('845745372814114846'),//ID of voice category
									permissionOverwrites:[
										{
											id: msg.author.id,
											allow: ['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_MESSAGES ','ADMINISTRATOR']
										},
										{
											id: "845744837315133450",
											deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
										}
									]
								})
							}else{
								DMchat.send("Хотите ли вы, чтобы я задавал этот вопрос в дальнейшем?(да|нет)")
								//TODO: Создать коллектор внутри коллектора дабы проверить
								collector.stop("No one reason to be here")
							}
						})
					})*/
			})
	}else{
		connection.query('SELECT ownID FROM voices WHERE voiceID=?',[vc1.channelID],(err,ownID_)=>{
			if(err)console.log(err)
			if(ownID_[0])
			if(ownID_[0]&&ownID_[0].ownID===vc1.id){
				try{
					sample.channels.cache.get(vc1.channelID).delete()
						.then(()=>{
							connection.query('DELETE FROM voices WHERE ownID=?',[vc1.id],err1 => {
								if(err)console.log(err)
							})
					})
				}catch(e){
					console.log(`Аэм.... Чё за? Я не могу удалити канал. памагити!!!\n ${e}`)
					//TODO: логгирование в чат sample_logs
				}
			}
		})
	}
});
bot.on('guildMemberUpdate',(oldMbr,newMbr)=>{//Сделать реагирование на покидание сервера
	let rolesID=[];
	newMbr.roles.cache.forEach(role=>{
		rolesID.push(role.id)
	})
	if(rolesID){
		connection.query('UPDATE users SET roles=? WHERE uID=?', [rolesID.join("$"), newMbr.id], err => {
			if (err) console.log(err)
		})
	}
})

bot.login(cfg.token);

process.on('exit',code=>console.log(code));