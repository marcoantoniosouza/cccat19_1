import pgp from "pg-promise";

export class Database {
    dbString: string = process.env.DB_STRING || "";
    connection: any;

    constructor() {
        this.connection = pgp()(this.dbString);
    }

    getConnection() { 
        return this.connection;
    }

    async closeConnection() {
        await this.connection.$pool.end()
    }
}