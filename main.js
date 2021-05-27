const Discord = require('discord.js');
const moment = require('moment');
const mysql = require('mysql2');
const cfg = require('./config.json')
const bot = new Discord.Client();

const connection = mysql.createConnection({
	host:"localhost",
	user:cfg.dbLogin,
	database:"gth_db",
	password:cfg.dbPass
});
const adminRoles = {
	0:"sample own",
	1:"sample admin",
	2:"sample mod",
	3:"sample observer",
	4:"sample bots"
}
const userRoles  = {//0 - нет каких-либо разрешений, +∞ - какие-либо доп плюшки
	0:"sample newbie",
	1:"sample user",
	2:"sample junior"
}
const adminNums  = {
	"own"   :0,
	"admin" :1,
	"mod"   :2,
	"obs"   :3,
	"bot"   :4
}

//TODO: поиграться с API pixiv'а

let own;
let sample;
let admins=[];

function delChannel(ch){
	ch.delete("test")
}
async function userCommands(msg){
	let mess=msg.content.split(" ")
	switch(mess[0]){
		case"!help":
			if(!msg[1]){
				//TODO: Всё-таки, придумать что написать в хелпе
				msg.channel.send("")
			}else{
				switch(msg[1]){
					case"":

					break;
				}
			}
		break;
		case"!play":
			//TODO: адаптировать код с https://github.com/TannerGabriel/discord-bot к работе здесь.
		break;
		default:
			msg.reply(`Комманды "${msg.content}" не существует. Прошу Вас ознакомиться с нашим справочником комманд(!hellp).`)
		break;
	}
}

bot.on('ready',()=>{
	connection.query('SELECT uID from admin;', (err,data)=>{
		data.forEach(it=>{
			admins.push(it.uID)
		})
	})
	sample=bot.guilds.cache.find(g=>g.id==='845744837315133450')
	console.log(`${bot.user.username} is started at ${moment().format('HH:mm:ss')}`)
})
bot.on('message',async(msg)=>{
	if(msg.author.bot)return;
	if(!msg.author.bot&&msg.content.startsWith("!")){
		if(admins.includes(msg.author.id)){
			let aMess=msg.content.split(" ")
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
									connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[aMess[3]]})`,(err)=>{
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
										connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]})`,(err)=>{
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
									if(msg.mentions.members.first().id){
										if(m.content[1]){
											connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[m.content[1]]});`,(err) => {
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
												connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]}) `,(err) => {
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
				default:
					await userCommands(msg)
				break;
			}
		}else{
			await userCommands(msg);
		}
	}else{
		//TODO: сделать функцию обработки сообщений
		connection.query(`SELECT * FROM users WHERE uID = ${msg.author.id}`,(err,res)=>{
			if(err)console.log(err)
			if(res.length!=0){
				if(res[0].msgCount%res[0].divisor!==0){
					connection.query(`UPDATE users SET msgCount = ${res[0].msgCount+=1} WHERE uID = ${msg.author.id}`,(err)=>{
						if(err)console.log(err)
					})
				}else{
					connection.query('UPDATE users SET msgCount=?, lvl=?, divisor=? WHERE uID=?',[res[0].msgCount+1,res[0].lvl+1,res[0].divisor+25,msg.author.id],(err)=>{
						if(err) console.log(err);
					})
				}
			}else{
				connection.query(`INSERT INTO users(uID) VALUES ('${msg.author.id}')`,(err)=>{
					if(err)console.log(err)
				})
			}
		})
	}
})
bot.on("guildMemberAdd", mbr=>{
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
			mbr.roles.add(sample.roles.cache.get("846738135798251540"))
			if(!bot.channels.cache.find(ch=>ch.name==="for strangers")){
				sample.channels.create(`for strangers`,{
					type:'voice',
					parent:sample.channels.cache.get('846476470565077062'),
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
						setTimeout(delChannel,300000,sample.channels.cache.find(c=>c.id===vch.id))//300000
					})
			}
			bot.channels.cache.find(ch=>ch.name==="sample-starting").send(`<@${mbr.id}> был создан голосовой чат "for strangers". Прошу зайти туда и Вам наш человек расскажет про жизнь на сервере!\nЭтот войс был создан на 30 мин, будьте быстры!:D`);
		}else{
			if(res[0].banned){
				mbr.kick("Banned status");
				bot.channels.cache.find(ch=>ch.name==="sample-logs").send(`Супостат ${mbr.name} не смог проникнуть на нашу святую землю!!!`);
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
})
bot.on("voiceStateUpdate", (vc1,vc2)=>{
	if(vc2.channelID==="845745906745868289"){
		sample.channels.create(`${sample.members.cache.find(m=>m.id===vc2.id).user.username}'s channel`,{
			type:'voice',
			parent:sample.channels.cache.get('845745372814114846'),
			permissionOverwrites:[
				{
					id: vc2.id,
					allow: ['MANAGE_CHANNELS','MANAGE_ROLES']
				}
			]
		})
			.then(ch=>{
				vc2.setChannel(ch)
			})
	}else{
		if(vc1.channelID!=="845745906745868289"&&vc1!=="846508958122639370"){
			sample.channels.cache.get(vc1.channelID).delete()
		}
	}
})

bot.login(cfg.token)