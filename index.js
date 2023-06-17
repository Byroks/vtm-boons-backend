const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const defaultWeights = {
	trivial: 35,
	minor: 50,
	moderate: 10,
	major: 5,
	life: 0,
};

app.use(
	cors({
		origin: "http://localhost:4200",
	})
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/api/default-weights", (req, res) => {
	res.send(defaultWeights);
});

app.post("/api/file-upload", (req, res) => {
	let data = req.body;
	console.log(data);
	res.send(JSON.stringify(data));
});

app.listen(3000, () => {
	console.log("Example app listening on port 3000!");
});

module.exports = app;
