import axios, { AxiosResponse, ResponseType } from "axios";
import "dotenv/config";
import { Database } from "../src/infrastructure/db";

const API_URL = `http://localhost:${process.env.PORT}`;
const API_URL_SIGNUP = `${API_URL}/signup`;
const API_URL_GET_ACCOUNT = `${API_URL}/get-account`;

beforeAll(async () => {
    startServer();
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
    await axios.post(API_URL_SIGNUP, requestBody).catch((err: any) => {
        const { response } = err;
        const { status } = response;
        expect(status).toBe(422);
        expect(response.data.message).toBe(-5);
    });

});

test("Should return e-mail already exists error code", async function () {
    const requestBody = {
        name: "New Passenger",
        email: "test@test.com",
        cpf: "87748248800",
        carPlate: "",
        password: "123456",
        isPassenger: true,
        isDriver: false
    };
    await axios.post(API_URL_SIGNUP, requestBody).then(async (response: any) => {
        const { status } = response;
        expect(status).toBe(200);
        expect(response.data.accountId).toBeDefined();
        const { accountId } = response.data;
        await checkNewAccount(requestBody, accountId);
    });
    await axios.post(API_URL_SIGNUP, requestBody).catch((err: any) => {
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
    await axios.post(API_URL_SIGNUP, requestBody).catch((err: any) => {
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
    await axios.post(API_URL_SIGNUP, requestBody).catch((err: any) => {
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
	"1",
	"11111111111"
])("Should return invalid cpf error code", async function (cpf: any) {
	const requestBody = {
        name: "User test",
        email: `userCpf${Date.now()}@test.com`,
        cpf: cpf
    };
    await axios.post(API_URL_SIGNUP, requestBody).catch((err: any) => {
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
    await axios.post(API_URL_SIGNUP, requestBody).then(async (response: any) => {
        const { status } = response;
        expect(status).toBe(200);
        expect(response.data.accountId).toBeDefined();
        const { accountId } = response.data;
        await checkNewAccount(requestBody, accountId);
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
    await axios.post(API_URL_SIGNUP, requestBody).then(async (response: any) => {
        const { status } = response;
        expect(status).toBe(200);
        expect(response.data.accountId).toBeDefined();
        const { accountId } = response.data;
        await checkNewAccount(requestBody, accountId);
    });
});

async function checkNewAccount(requestBody: any, accountId: string) {
    await axios.get(`${API_URL_GET_ACCOUNT}/${accountId}`).then((response: AxiosResponse) => {
        const account = response.data;
        expect(account.accountId).toBe(accountId);
        expect(account.name).toBe(requestBody.name);
        expect(account.email).toBe(requestBody.email);
        expect(account.cpf).toBe(requestBody.cpf);
        expect(account.carPlate).toBe(requestBody.carPlate);
        expect(account.password).toBe(requestBody.password);
        expect(account.isPassenger).toBe(requestBody.isPassenger);
        expect(account.isDriver).toBe(requestBody.isDriver);
    })
}

async function cleanTestData() {
    const db = new Database();
    await db.getConnection().query("delete from ccca.account where email = $1", ["test@test.com"]);
    await db.getConnection().query("delete from ccca.account where email = $1", ["newPassenger@test.com"]);
    await db.getConnection().query("delete from ccca.account where email = $1", ["newDriver@test.com"]);
    await db.closeConnection();
}

function startServer () {
    require("../src/server");
}
