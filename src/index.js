import express from "express";
import matchesRoutes from "./routes/matches.js";

const app = express();
const PORT = 8000;

app.use(express.json());

app.use("/matches", matchesRoutes);


app.get("/", (req, res) => {
  res.send("Sportz API is running");
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
