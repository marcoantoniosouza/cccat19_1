import axios from "axios";
import pgp from "pg-promise";

const API_URL = "http://localhost:3000/signup";
const DB_URL_STRING = "postgres://postgres:123456@localhost:5432/app";

beforeAll(async () => {
    await insertTestData();
    startSignupServer();
});

afterAll(async () => {
    cleanTestData();
});

test.each([
    "",
    "AAA",
    "9999",
])("Should return invalid car plate error code", async function (carPlate: string) {
    const requestBody = {
        name: "User Test",
        email: `userCarPlate${Date.now()}@test.com`,
        cpf: "87748248800",
        carPlate: carPlate,
        isDriver: true,
    };
    await axios.post(API_URL, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-5);
    });

});

test("Should return e-mail already exists error code", async function () {
    const requestBody = {
        name: "User Test",
        email: `test@test.com`,
        cpf: "87748248800"
    };
    await axios.post(API_URL, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-4);
    });

});

test.each([
    "",
    "1 1",
    "A 1",
    "1 A",
    "A",
    "AA",
    " A",
    " AA",
])("Should return invalid name error code", async function (name: any) {
    const requestBody = {
        name: name,
        email: `userName${Date.now()}@test.com`,
        cpf: "87748248800"
    };
    await axios.post(API_URL, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-3);
    });
});

test.each([
    "",
    "@a.com",
    "a.com",
])("Should return invalid e-mail error code", async function (email: any) {
    const requestBody = {
        name: "User test",
        email: email,
        cpf: "87748248800"
    };
    await axios.post(API_URL, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-2);
    });
});

test.each([
	null,
	undefined,
	"",
	"11111111111"
])("Should return invalid cpf error code", async function (cpf: any) {
	const requestBody = {
        name: "User test",
        email: `userCpf${Date.now()}@test.com`,
        cpf: cpf
    };
    await axios.post(API_URL, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-1);
    });
});

test("Should create new passanger", async function () {
    const requestBody = {
        name: "New Passenger",
        email: "newPassenger@test.com",
        cpf: "87748248800",
        carPlate: "",
        password: "123456",
        isPassenger: true,
        isDriver: false
    };
    await axios.post(API_URL, requestBody).then((response: any) => {
        const { status } = response;
        expect(status).toBe(200);
        expect(response.data.accountId).toBeDefined();
    });
});

test("Should create new driver", async function () {
    const requestBody = {
        name: "New Driver",
        email: "newDriver@test.com",
        cpf: "87748248800",
        carPlate: "ABC1234",
        password: "123456",
        isPassenger: false,
        isDriver: true
    };
    await axios.post(API_URL, requestBody).then((response: any) => {
        const { status } = response;
        expect(status).toBe(200);
        expect(response.data.accountId).toBeDefined();
    });
});

async function insertTestData() {
    const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
    await insertUserPassenger(connection);
    await connection.$pool.end();
}

async function insertUserPassenger(connection: any) {
    await connection.query("insert into ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) values ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (account_id) DO NOTHING", ["157c515b-8399-4b4a-ac6f-fd6f30543542", "Passenger Test", "test@test.com", "87748248800", "", true, false, "123456"]);
}

async function cleanTestData() {
    const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
    await connection.query("delete from ccca.account where email = $1", ["newPassenger@test.com"]);
    await connection.query("delete from ccca.account where email = $1", ["newDriver@test.com"]);
    await connection.$pool.end();
}

function startSignupServer () {
    require("../src/signup");
}
