

class Group {
    id: string;
    name: string;
    participants: {
        id: string,
        name: string,
        kicked: number,
        points: number,
    }[];
    //currently kicked
    kicked:string[];

    constructor(id: string, name: string, 
        participants: {
        id: string,
        name: string,
        kicked: number,
        points: number,
        }[], 
        kicked: string[]){
        this.id = id;
        this.name = name;
        this.participants = participants;
        this.kicked = kicked;
    }
}

export {Group};