import { onRequest } from "firebase-functions/v2/https";
import express from "express";
const app = express();
export const testApi = onRequest({ invoker: "public" }, app);
