import express from "express";
import signupRouter from "./routes/signup";
import getAccountRouter from "./routes/getAccount";

const app = express();
app.use(express.json());

app.use("/signup", signupRouter);
app.use("/get-account", getAccountRouter);

app.listen(process.env.PORT || 3000);
