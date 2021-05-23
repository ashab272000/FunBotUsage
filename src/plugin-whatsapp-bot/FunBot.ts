import WAWebJS, { Client } from "whatsapp-web.js";
import { Command } from './command';
import qrcode from 'qrcode-terminal';

const fs = require('fs');

class FunBot {
    SESSION_FILE_PATH = './session.json';
    plugins : PlugIn[] ;
    client: Client;
    sessionData:any
    constructor({plugins}:{plugins: PlugIn[]}) {
        this.plugins = plugins;
        // Load the session data if it has been previously saved
        if(fs.existsSync(this.SESSION_FILE_PATH)) {
            this.sessionData = fs.readFileSync(this.SESSION_FILE_PATH,'utf-8');
            this.sessionData = JSON.parse(this.sessionData);
            console.log(this.sessionData);
        }

        this.client = new Client({ 
            puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']},
            session: this.sessionData });
    }

    init(){

        this.client.initialize();

        this.client.on('qr', (qr) =>
        {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, {small:true});
        });

        this.client.on('authenticated', (session) =>
        {
            console.log('AUTHENTICATED', session);
            this.sessionData=session;
            fs.writeFile(this.SESSION_FILE_PATH, JSON.stringify(session), function (err: any) {
                if (err)
                {
                    console.error(err);
                }
            });
        });

        this.client.on('auth_failure', (msg) =>
        {
            console.error('AUTHENTICATION FAILURE', msg);
        });

        this.client.on('ready', () =>
        {
            console.log('READY');
        });

        this.client.on('message', async (msg)  => {
            this._onMessage(msg);
        });

        this.client.on('disconnected', (reason) =>
        {
            console.log('Client was logged out', reason);
        });

    }

    async _onMessage(msg: WAWebJS.Message){
        for (const plugin of this.plugins) {
            for (const command of plugin.commands) {
                if(command.equals(msg.body)){
                    //get the input from the command
                    // and then callback
                    let input = await command.getInput(msg);
                    console.log(input);
                    command.callback(msg,input, this.client);
                    return null;
                }            
            }
        }
    }

}

class PlugIn {
    commands: Command[];

    constructor ({commands} : {commands: Command[]}){
        this.commands = commands;
    }

}

export { FunBot, PlugIn}

