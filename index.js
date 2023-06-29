const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var busboy = require("connect-busboy");
var crypto = require("crypto");

const app = express();

const defaultWeights = {
	trivial: 30,
	minor: 40,
	moderate: 20,
	major: 10,
	life: 0,
	amount: 0,
};

var connectionTypes = {
	"Positive": 20,
	"Friends": 20,
	"Dating/Lovers": 20,
	"Allies": 20,
	"Mawla/Mentor": 20,
	"Neutral": 0,
	"Sire": 0,
	"Descendant": 0,
	"Barony": 0,
	"Unclassified Connection": 0,
	"Associates": 10,
	"Indebted": -35,
	"Negativ": -35,
	"Enemies": -35,
	"Strained": -5,
};

app.use(busboy());

app.use(
	cors({
		origin: "http://95.111.232.136:4200",
	})
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/api/default-weights", (req, res) => {
	res.send(defaultWeights);
});

let data;
let boonsCSV = "";

app.post("/api/file-upload", (req, res) => {
	data = req.body;
	distributeBoons(data.file?.connections, data.file?.elements, data?.weights, data?.weights?.amount);
	res.send({ json: data.file, csv: boonsCSV });
	data = null;
	boonsCSV = "";
});

// https://kumu.io/RiggaTony/v5-relationship-map-template Template we are working off
function distributeBoons(connections, characters, weights = undefined, amount = undefined) {
	characters = characters.filter(
		(x) =>
			(x.attributes["element type"] === "Kindred" || x.attributes["element type"] === "Coterie") &&
			!(x.attributes.tags?.includes("Player") || x.attributes.tags?.includes("Player Character"))
	);
	charIds = characters.map((x) => x._id);
	connections = connections.filter((x) => charIds.includes(x.from) && charIds.includes(x.to));

	weights.minor += weights.trivial;
	weights.moderate += weights.minor;
	weights.major += weights.moderate;
	weights.life += weights.major;

	if (amount === undefined || amount === 0) {
		amount = characters.length * 1.3; //TODO: adjust factor for amount
	}

	let creditor;
	let debtor;
	while (amount > 0) {
		creditor = characters[getRandomInt(characters.length)];
		debtor = characters[getRandomInt(characters.length)];

		if (creditor === debtor) continue;

		con = connections.find((x) => creditor._id.includes(x.from) && debtor._id.includes(x.to));

		if (con) {
			if (!(getRandomInt(100) < 50 + connectionTypes[con.attributes["element type"]])) continue;

			aquireBoonWeight(con, creditor, debtor, weights);
		} else {
			if (!(getRandomInt(100) < 10)) continue;
			con = connections.find((x) => debtor._id.includes(x.from) && creditor._id.includes(x.to));
			if (con) {
				aquireBoonWeight(con, creditor, debtor, weights);
			} else {
				aquireBoonWeight(creatCon(connections, creditor._id, debtor._id), creditor, debtor, weights);
			}
		}

		amount--;
	}
}

function creatCon(connections, creditorId, debtorId) {
	var newConId = crypto.randomBytes(4).toString("hex");
	while (connections.find((x) => x._id === `conn-${newConId}`)) {
		newConId = crypto.randomBytes(8).toString("hex");
	}

	con = {
		_id: `conn-${newConId}`,
		direction: "directed",
		delayed: false,
		reversed: false,
		attributes: {
			"element type": "Unclassified Connection",
		},
		from: creditorId,
		to: debtorId,
	};

	data.file.connections.push(con);

	edge = {
		_id: `edge-${newConId}`,
		style: {},
		curvature: 0,
		connection: con._id,
	};

	data.file.maps[0].connections.push(edge); //figure something out if multiple maps exist

	return con;
}

function aquireBoonWeight(con, creditor, debtor, weights) {
	let weight;
	let ran = getRandomInt(100);
	if (ran < weights.trivial) {
		weight = "trivial";
	} else if (ran < weights.minor) {
		weight = "minor";
	} else if (ran < weights.moderate) {
		weight = "moderate";
	} else if (ran < weights.major) {
		weight = "major";
	} else if (ran < weights.life) {
		weight = "life";
	}

	con.attributes.description += `\n${debtor.attributes.label} owes 1 ${weight} boon to ${creditor.attributes.label}.`;

	boonsCSV += `${debtor.attributes.label} owes 1 ${weight} boon to ${creditor.attributes.label}.,\n`;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

app.listen(3000, () => {
	console.log("Example app listening on port 3000!");
});

module.exports = app;
