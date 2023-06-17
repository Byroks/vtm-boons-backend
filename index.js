const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var fs = require("fs");
var busboy = require("connect-busboy");

const app = express();

const defaultWeights = {
	trivial: 35,
	minor: 85,
	moderate: 95,
	major: 100,
	life: 0,
};

const connectionTypes = [
	"Friends",
	"Dating/Lovers",
	"Allies",
	"Positive",
	"Mawla/Mentor",
	"Neutral",
	"Sire",
	"Descendant",
	"Barony",
	"Unclassified Connection",
	"Associates",
	"Indebted",
	"Negativ",
	"Enemies",
];

app.use(busboy());

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

let data;

app.post("/api/file-upload", (req, res) => {
	data = req.body;
	// distributeBoons(data.connections, data.elements, weights);
	distributeBoons(data.connections, data.elements);
	res.send(data);
});

// https://kumu.io/Byroks/v5-relationship-map-template Template we are working off
function distributeBoons(connections, characters, weights = undefined, amount = undefined) {
	characters = characters.filter(
		(x) =>
			(x.attributes["element type"] === "Vampir" || x.attributes["element type"] === "Kindred") && !(x.attributes.label.includes("Player") || x.attributes.label.includes("Player Character"))
	);
	charIds = characters.map((x) => x._id);

	connections = connections.filter((x) => charIds.includes(x.from) && charIds.includes(x.to));

	if (weights === undefined) {
		weights = defaultWeights;
	} //TODO: add else{}
	if (amount === undefined) {
		amount = characters.length * 1; //TODO: adjust factor for amount
	}

	let creditor;
	let debtor;

	while (amount > 0) {
		creditor = characters[getRandomInt(characters.length)];
		debtor = characters[getRandomInt(characters.length)];

		if (creditor === debtor) continue;

		con = connections.find((x) => creditor._id.includes(x.from) && debtor._id.includes(x.to));

		if (con) {
			if (!(getRandomInt(100) < 50 + checkConnectionType(con))) continue;

			aquireBoonWeight(con, debtor, weights);
		} else {
			if (!(getRandomInt(100) < 10)) continue;
			con = connections.find((x) => debtor._id.includes(x.from) && creditor._id.includes(x.to));
			if (con) {
				console.log(con);
				aquireBoonWeight(con, debtor, weights);
			}
			aquireBoonWeight(creatCon(connections, creditor._id, debtor._id), debtor, weights);
		}

		amount--;
	}
}

newConId = 11111111;

function creatCon(connections, creditorId, debtorId) {
	newConId++;

	con = {
		_id: connections.find(`conn-${newConId}`) ? `conn-${newConId}` : creatConId(creditorId, debtorId),
		direction: "directed",
		delayed: false,
		reversed: false,
		attributes: {
			"element type": "Unclassified Connection",
		},
		from: creditorId,
		to: debtorId,
	};
	connections.push(con);

	edge = {
		_id: `edge-${newConId}`,
		style: {},
		connection: con._id,
	};
	data.map[0].connections.push(edge); //figure something about if multiple maps exist

	return con;
}

function aquireBoonWeight(con, debtor, weights) {
	let weight = "";
	ran = getRandomInt(100);
	switch (ran) {
		case ran < weights.trivial:
			weight = "trivial";
			break;
		case weights.trivial < ran < weights.minor:
			weight = "minor";
			break;
		case weights.minor < ran < weights.moderate:
			weight = "moderate";
			break;
		case weights.moderate < ran < weights.major:
			weight = "major";
			break;
		case weights.major < ran < weights.life:
			weight = "life";
			break;
	}

	if (con.attributes.description) {
		con.attributes.description = con.attributes.description + `\n ${debtor.attributes.label} owes 1 ${weight} boon.`;
	} else {
		con.attributes.description = debtor.attributes.label + " owes 1 " + weight + " boon";
	}
}

function checkConnectionType(con) {
	switch (con.attributes) {
		case con.attributes["element type"] === "Friends" || con.attributes.tags?.includes("Friends"):
			mod = 20; //TODO: add variables to get user input
			break;
		case con.attributes["element type"] === "Dating/Lovers" || con.attributes.tags?.includes("Dating/Lovers"):
			mod = 20;
			break;
		case con.attributes["element type"] === "Allies" || con.attributes.tags?.includes("Allies"):
			mod = 20;
			break;
		case con.attributes["element type"] === "Positiv" || con.attributes.tags?.includes("Positiv"):
			mod = 20;
			break;
		case con.attributes["element type"] === "Mawla/Mentor" || con.attributes.tags?.includes("Mawla/Mentor"):
			mod = 20;
			break;
		case con.attributes["element type"] === "Neutral" || con.attributes.tags?.includes("Neutral"):
			mod = 0;
			break;
		case con.attributes["element type"] === "Sire" || con.attributes.tags?.includes("Sire"):
			mod = 0;
			break;
		case con.attributes["element type"] === "Descendant" || con.attributes.tags?.includes("Descendant"):
			mod = 0;
			break;
		case con.attributes["element type"] === "Barony" || con.attributes.tags?.includes("Barony"):
			mod = 0;
			break;
		case con.attributes["element type"] === "Unclassified Connection" || con.attributes.tags?.includes("Unclassified Connection"):
			mod = 0;
			break;
		case con.attributes["element type"] === "Associates" || con.attributes.tags?.includes("Associates"):
			mod = 10;
			break;
		case con.attributes["element type"] === "Indebted" || con.attributes.tags?.includes("Indebted"):
			mod = -35;
			break;
		case con.attributes["element type"] === "Negativ" || con.attributes.tags?.includes("Negativ"):
			mod = -35;
			break;
		case con.attributes["element type"] === "Enemies" || con.attributes.tags?.includes("Enemies"):
			mod = -35;
			break;
		default:
			mod = 0;
	}
	return mod;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

app.listen(3000, () => {
	console.log("Example app listening on port 3000!");
});

module.exports = app;
