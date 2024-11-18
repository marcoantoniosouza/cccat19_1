import crypto from "crypto";
import { Router } from "express";
import { validateCpf } from "../validateCpf";
import "dotenv/config";
import { Database } from "../infrastructure/db";

const signupRouter = Router();

signupRouter.post("/", async function (req, res) {
	const input = req.body;
	const db = new Database();
	try {
		await validateNewAccount(db.getConnection(), input);
		res.json(await signup(db.getConnection(), input));
	} catch (error: any) {
		res.status(422).json({ message: error.message });
	} finally {
		await db.closeConnection();
	}
});

async function validateNewAccount (connection: any, input: any): Promise<void> {
	if (await emailAlreadyExists(input.email, connection)) throw new Error("E-mail already exists");
	if (!input.name.match(/[a-zA-Z] [a-zA-Z]+/)) throw new Error("Name is invalid");
	if (!input.email.match(/^(.+)@(.+)$/)) throw new Error("E-mail is invalid");
	if (!validateCpf(input.cpf)) throw new Error("CPF is invalid");
	if (input.isDriver && !input.carPlate.match(/[A-Z]{3}[0-9]{4}/)) throw new Error("Car plate is invalid");
}

async function signup (connection: any, input: any) {
	return await insertNewAccount(connection, input);
}

async function insertNewAccount (connection: any, input: any) {
	const id = crypto.randomUUID();
	await connection.query("insert into ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) values ($1, $2, $3, $4, $5, $6, $7, $8)", [id, input.name, input.email, input.cpf, input.carPlate, !!input.isPassenger, !!input.isDriver, input.password]);
	return { accountId: id }
}

async function emailAlreadyExists (email: string, connection: any) {
	const [account] = await connection.query("select * from ccca.account where email = $1", [email]);
	return !!account;
}

export default signupRouter;
