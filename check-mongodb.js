/*
 * Quick local/Render diagnostic for the MongoDB connection.
 * Usage: node check-mongodb.js
 * Override the URI without editing config.json: MONGODB_URI="mongodb+srv://..." node check-mongodb.js
 */
const config = require("./config.json");

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || config.database.uriMongodb;
const masked = String(uri || "").replace(/:\/\/[^:@]+:[^@]+@/, "://***:***@");

if (!uri) {
	console.error("No MongoDB URI found. Set database.uriMongodb in config.json or MONGODB_URI in the environment.");
	process.exit(1);
}

console.log("Testing:", masked);

let MongoClient;
try {
	({ MongoClient } = require("mongodb"));
}
catch (error) {
	console.error("mongodb driver is missing. Run: npm install");
	process.exit(1);
}

MongoClient.connect(uri, { serverSelectionTimeoutMS: 15000 })
	.then(async (client) => {
		try {
			await client.db().admin().ping();
			console.log("MongoDB connected OK");
		}
		finally {
			await client.close();
		}
	})
	.catch((error) => {
		const message = String(error && error.message || error);
		if (/bad auth|authentication failed/i.test(message)) {
			console.error("MongoDB FAILED: bad auth - the Atlas username/password (or authSource) is wrong.");
			console.error("Create a valid Atlas DB user or set MONGODB_URI to a working connection string.");
		}
		else {
			console.error("MongoDB FAILED:", message.split("\n")[0]);
		}
		process.exit(1);
	});
