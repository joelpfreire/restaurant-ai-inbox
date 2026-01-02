import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Railway is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
