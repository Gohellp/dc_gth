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
const userRoles  = {//TODO: 0 - нет каких-либо разрешений, +∞ - какие-либо доп плюшки

}
const adminNums  = {
	"own"   :0,
	"admin" :1,
	"mod"   :2,
	"obs"   :3,
	"bot"   :4
}

let own;
let sample;
let admins=[];

function userCommands(msg){
	let mess=msg.content.split(" ")
	switch(mess[0]){
		case"":

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
bot.on('message',msg=>{
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
									if(m.content[1]){
										connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[m.content[1]]});`,(err)=>{
											if(err)console.log(err);
										})
										msg.mentions.members.first().roles.add(sample.roles.cache.find(role=>role.name === adminRoles[adminNums[m.content]]))
										msg.reply("Пользователь успешно поставлен на пост!")
									}else{
										msg.reply("own|admin|mod|obs|bot")
										const col=new Discord.MessageCollector(m.channel,n => n.author.id===own,{
											time:3600000
										})
										col.on("collect",n => {
											connection.query(`INSERT admin(uID, perm) VALUES (${msg.mentions.members.first().id}, ${adminNums[n.content]}) `,(err)=>{
												if(err)console.log(err);
											})
											msg.mentions.members.first().roles.add(sample.roles.cache.find(role=>role.name === adminRoles[adminNums[n.content]]))
											msg.reply("Пользователь успешно поставлен на пост!")
										});
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
			}
		}else{
			userCommands(msg);
		}
	}
})
bot.on("guildMemberAdd", mbr=>{
	/*
	TODO:
    сделать создание голосового канала с названием "for strangers" и отправкой в лс сообщения "Зайди в войс "for strangers""
	*/
	/*
	Если же делать раздельные бд, то и делать систему оценки модерации. Оценка будет производиться пользователем по его тикету.
	Если оценка ниже определённого порога, то модеру и админской команде сообщается о его успеваниях.
	Если оценка модера ниже ещё, то бот стартует голосование на снятие с должности длиною в пол дня.
	Если оценка на дне, то бот сам снимает роль. Можно также сделать такую ж автоматизацию и для юзеров, но фиг знает.
	Дима, не забудь со всеми этими наказаниями сделать и систему повышения карьеры вплоть до модератора:D
	*/
	connection.query(`SELECT * WHERE uID = ${mbr.id} from user`, (err,res)=>{
		if(err){
			connection.query(`INSERT INTO users(uID, msgCount, lvl, banned, leaving, perm) VALUES( '${mbr.id}', 0, 0, false, 0, 0)`, (err)=>{
				if(err)console.log(err);
			});
			//создание голосового чата в категории sample start

			bot.channels.cache.find(ch=>ch.name==="sample-starting").send(`Был создан голосовой чат "for strangers". Прошу зайти туда и Вам наш человек расскажет про жизнь на сервере!\nЭтот войс был создан на 30 мин, будьте быстры!:D`);
		}else{
			if(res[0].banned){
				mbr.kick("Banned status");
				bot.channels.cache.find(ch=>ch.name==="sample-logs").send(`Супостат ${mbr.name} не смог проникнуть на нашу святую землю!!!`);
			}else{
				if(res[0].trust_factor>150){
					mbr.createDM().then(dm=>{dm.send("Мне было скучно без Вас:(")});
					mbr.guild.roles.cache.find(rl=>rl.name===userRoles[res[0].perm]);
				}
			}
		}
	})
})
bot.on("voiceStateUpdate", (vc1,vc2)=>{
	//console.log(vc1)
	//console.log(vc2.guild.channels)
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