import crypto from "crypto";
import pgp from "pg-promise";
import express from "express";
import { validateCpf } from "./validateCpf";

const app = express();
app.use(express.json());

app.post("/signup", async function (req, res) {
	const input = req.body;
	const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
	try {
		const validationCode = await validateNewAccount(connection, input);
		if (validationCode < 0) {
			res.status(422).json({ message: validationCode })
		} else {
			res.status(200).json(await signup(connection, input));
		}
	} finally {
		await connection.$pool.end();
	}
});

async function validateNewAccount (connection: any, input: any): Promise<number> {
	if (await emailAlreadyExists(input.email, connection)) return -4;
	if (!isNameValid(input.name)) return -3;
	if (!isEmailValid(input.email)) return -2;
	if (!validateCpf(input.cpf)) return -1;
	if (input.isDriver && !isCarPlateValid(input.carPlate)) return -5;
	return 1;
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
	const [acc] = await connection.query("select * from ccca.account where email = $1", [email]);
	return !!acc;
}

function isNameValid (name: string) {
	return name.match(/[a-zA-Z] [a-zA-Z]+/);
}

function isEmailValid (email: string) {
	return email.match(/^(.+)@(.+)$/);
}

function isCarPlateValid (carPlate: string) {
	return carPlate.match(/[A-Z]{3}[0-9]{4}/);
}

app.listen(3000);
