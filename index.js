const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var busboy = require("connect-busboy");
var crypto = require("crypto");

const app = express();

const defaultBoonWeights = {
	trivial: 30,
	minor: 40,
	moderate: 20,
	major: 10,
	life: 0,
	amount: 0,
};

const defaultConnectionWeights = {
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
	res.send({ boons: defaultBoonWeights, connections: defaultConnectionWeights });
});

app.get("/api/boon-weights", (req, res) => {
	res.send(defaultBoonWeights);
});

app.get("/api/connection-weights", (req, res) => {
	res.send(defaultConnectionWeights);
});

app.post("/api/file-upload", (req, res) => {
	let data = req.body;
	csv = distributeBoons(data.file, data.weights, data.newConnection);
	res.send({ json: data.file, csv: csv });
});

// https://kumu.io/RiggaTony/v5-relationship-map-template Template we are working off
function distributeBoons(file, weights = undefinedt, newConnection) {
	let boonsCSV;
	let characters = file.elements.filter(
		(x) =>
			(x.attributes["element type"] === "Kindred" || x.attributes["element type"] === "Coterie") &&
			!(x.attributes.tags?.includes("Player") || x.attributes.tags?.includes("Player Character"))
	);
	charIds = characters.map((x) => x._id);
	let connections = file.connections.filter((x) => charIds.includes(x.from) && charIds.includes(x.to));

	weights.boons.minor += weights.boons.trivial;
	weights.boons.moderate += weights.boons.minor;
	weights.boons.major += weights.boons.moderate;
	weights.boons.life += weights.boons.major;

	if (weights.connections === undefined) {
		weights.connections = defaultConnectionWeights;
	}

	if (weights.boons.amount === undefined || weights.boons.amount === 0) {
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
			if (!(getRandomInt(100) < 50 + weights.connections[con.attributes["element type"]])) continue;

			boonsCSV += aquireBoonWeight(con, creditor, debtor, weights.boons);
		} else if (!newConnection) {
			continue;
		} else {
			if (!(getRandomInt(100) < 10)) continue;
			con = connections.find((x) => debtor._id.includes(x.from) && creditor._id.includes(x.to));
			if (con) {
				boonsCSV += aquireBoonWeight(con, creditor, debtor, weights.boons);
			} else {
				boonsCSV += aquireBoonWeight(creatCon(file, connections, creditor._id, debtor._id), creditor, debtor, weights.boons);
			}
		}

		amount--;
	}
	return boonsCSV;
}

function creatCon(file, connections, creditorId, debtorId) {
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

	file.connections.push(con);

	edge = {
		_id: `edge-${newConId}`,
		style: {},
		curvature: 0,
		connection: con._id,
	};

	file.maps[0].connections.push(edge); //figure something out if multiple maps exist

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

	return `${debtor.attributes.label} owes 1 ${weight} boon to ${creditor.attributes.label}.,\n`;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

app.listen(3000, () => {
	console.log("Boons by Night listening on port 3000!");
});

module.exports = app;
