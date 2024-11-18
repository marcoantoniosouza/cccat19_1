import { Router } from "express";
import "dotenv/config";
import { Database } from "../infrastructure/db";

const getAccountRouter = Router();

getAccountRouter.get("/:accountId", async (req, res) => {
    const { accountId } = req.params;
    const db = new Database();
	try {
        res.json(mapper(await getAccount(db.getConnection(), accountId)));
    } finally {
		await db.closeConnection();
	}
});

async function getAccount(connection: any, accountId: string) {
    const [acc] = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    return acc;
}

function mapper(queryResponse: any) {
    return {
        accountId: queryResponse.account_id,
        name: queryResponse.name,
        email: queryResponse.email,
        cpf: queryResponse.cpf,
        carPlate: queryResponse.car_plate,
        isPassenger: queryResponse.is_passenger,
        isDriver: queryResponse.is_driver,
        password: queryResponse.password,
    };
}

export default getAccountRouter;