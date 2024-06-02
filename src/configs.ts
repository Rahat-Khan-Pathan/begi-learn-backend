import * as dotenv from "dotenv";
dotenv.config();

export const configs = {
  PORT: process.env.PORT!,
  JWT_SECRET: process.env.JWT_SECRET!,
  MAILGUN_API_SECRET: process.env.MAILGUN_API_SECRET!,
  MAILGUN_URL: process.env.MAILGUN_URL!,
  MAILGUN_USERNAME: process.env.MAILGUN_USERNAME!,
  CLIENT_URL: process.env.CLIENT_URL!,
  LOCALHOST_URL: process.env.LOCALHOST_URL!
};
