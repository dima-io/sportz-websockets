import express from "express";
import matchesRoutes from "./routes/matches.js";
import http from 'http'
import { attachWebSocketServer } from "./ws/server.js";



const PORT = Number(process.env.PORT);
const HOST = process.env.HOST || '0.0.0.0'

const app = express()
const server = http.createServer(app)

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sportz API is running");
});

app.use("/matches", matchesRoutes);
const { broadcastMatchCreated } = attachWebSocketServer(server)

app.locals.broadcastMatchCreated = broadcastMatchCreated

console.log('broadcastMatchCreated type at startup:', typeof app.locals.broadcastMatchCreated)


server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}/${PORT}`
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocketServer is running on ${baseUrl.replace('http', 'ws' )}/ws`)
});
