import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { configs } from "./configs";
import apiRoutes from "./routes";
dotenv.config();

const app = express();
const allowedOrigins = [configs.CLIENT_URL, configs.LOCALHOST_URL];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const port = configs.PORT || 7868;

app.use("/api/", apiRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
