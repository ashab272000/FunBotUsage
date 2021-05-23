import { GroupChat } from "whatsapp-web.js";
import {Command} from "./plugin-whatsapp-bot/command";
import { FunBot, PlugIn } from "./plugin-whatsapp-bot/FunBot";
import DataStore from 'nedb';
import { Group } from "./db";


const db = new DataStore('database.db');
db.loadDatabase();


const plugin1 = new PlugIn({
    commands:[
        new Command({
            command: '(s+h+i+t+|f+u*c+k+|ass+h+o+l+e+|d+i+c+k+|b+i+t+c+h+|c+u+n+t+|scre+w+|pi+ss+|ja+c+k+a+ss+|\bw?tf|\bmf|bh?ench?o[td]|bo+ll+o+c+k*|gh?andu|fuq|ha[iy]+wa+n+|kh?ara)',
            callback: async (message, input,client) => {
                const chat = await message.getChat();
                // Check if the message is from a group
                if(chat.isGroup){

                    const groupChat = chat as GroupChat;
                    //Check if I am an Admin
                    const me = groupChat.participants.find((p) => p.id._serialized == '971566754936@c.us');
                    // remove the user if the author of the message is not the owner of the group
                    if(me!.isAdmin && message.author! != groupChat.owner._serialized)
                    {
                        db.findOne({id: groupChat.id._serialized, name: groupChat.name}, async (err, doc: any) => {
                            // if there is a doc
                            const toBeKicked = groupChat.participants.find((p) => p.id._serialized == message.author!);
                            if(doc != null)
                            {
                                //find the user to be kicked
                                let index = doc.participants.findIndex((p:any) => p.id == message.author!);
                                if(index == -1)
                                {
                                    const contact = await client.getContactById(message.author!);
                                    const name = contact.pushname;
                                    doc.participants.push({
                                        id:message.author,
                                        name: name,
                                        kicked:0,
                                        points:0,
                                        isAdmin: toBeKicked!.isAdmin,
                                    });                                
                                    index = doc.participants.length - 1;
                                }
                                doc.participants[index].isAdmin = toBeKicked!.isAdmin;
                                //add 1 to the user kicked value 
                                doc.participants[index].kicked++;
                                // add the user to the kicked array
                                doc.kicked.push(doc.participants[index].id);
                                //update the database
                                db.update({id: groupChat.id._serialized, name: groupChat.name}, 
                                    doc, 
                                    {}, ()=> {});

                            } else {
                                //get all the participants from the group
                                const parts = groupChat.participants;
                                let users = [];

                                // get the user details and save them in the users array
                                for (let index = 0; index < parts.length; index++) {
                                    const contact = await client.getContactById(parts[index].id._serialized);
                                    const name = contact.pushname;
                        
                                    const user = {
                                        id: parts[index].id._serialized,
                                        name: name,
                                        kicked: 0,
                                        points: 0,
                                        isAdmin: parts[index].isAdmin,
                                    };
                                    users.push(user);                                 
                                }
                                
                                db.insert(new Group(
                                    groupChat.id._serialized,
                                    groupChat.name,
                                    users,
                                    [message.author!]
                                ),(err, doc) =>{});

                            }
                            groupChat.removeParticipants([message.author!]).then(() => {
                                client.sendMessage(message.author!, `You are very naughty naughty boiii`);
                                client.sendMessage(message.author!, `To join the group *${groupChat.name}*, please send me the following Message`);
                                client.sendMessage(message.author!, `I will not swear and let me join the "${groupChat.name}" group`);
                            });
                        });


                    }
                }
            },
            requireMedia: false,
            regex: true
        }),
        new Command({
            command: 'I will not swear and let me join the <group-name> group',
            callback: async (message, input, client) => {
                db.findOne({name: input.get('group-name')}, async (err, doc: any) => {
                    if(doc != null){
                        //check if the user was kicked due to swearing
                        if(doc.kicked.includes(message.from)){
                            //get the chat to be added to
                            let chat = await client.getChatById(doc.id);
                            if(chat.isGroup){
                                let groupChat = chat as GroupChat;
                                //add the participant
                                await groupChat.addParticipants([message.from]);
                                let user = doc.participants.find((p:any) => p.id == message.from);
                                if(user.isAdmin)
                                {
                                    setTimeout(() => {
                                        groupChat.promoteParticipants([user.id]).then((f) => {console.log(f)}).catch((e) => {console.log(e)});
                                    }, 2000);
                                }
                                
                                //delete the user from the kicked array
                                let index = doc.kicked.indexOf(message.from);
                                doc.kicked.splice(index,1);
                                db.update({id: groupChat.id._serialized, name: groupChat.name}, 
                                    doc, 
                                    {}, ()=> {});
                                return;
                            }
                        } 
                    }
                    client.sendMessage(message.from, `You were never kicked from a group in that name, while I was active in that group`);

                });
                
            },
            requireMedia: false,
            regex: false,
        }),
    ]
});

const bot = new FunBot({
    plugins:[
        plugin1
    ] 
});

bot.init();