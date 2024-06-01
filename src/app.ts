import express from "express";
import cors, { CorsOptions } from "cors";
import * as dotenv from "dotenv";
import { configs } from "./configs";
import apiRoutes from "./routes";
dotenv.config();

const app = express();
app.use(cors());
const allowedOrigins = [configs.CLIENT_URL];
const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
};
app.use(cors(corsOptions));
app.use(express.json());

const port = configs.PORT || 7868;

app.use("/api/", apiRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
