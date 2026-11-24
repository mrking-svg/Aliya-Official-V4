module.exports = async function (uriConnect) {
	const mongoose = require("mongoose");

	if (!uriConnect || typeof uriConnect !== "string" || !/^mongodb(\+srv)?:\/\//.test(uriConnect.trim()))
		throw new Error("MongoDB: config.database.uriMongodb is empty or not a valid mongodb:// or mongodb+srv:// link");

	const threadModel = require("../models/mongodb/thread.js");
	const userModel = require("../models/mongodb/user.js");
	const dashBoardModel = require("../models/mongodb/userDashBoard.js");
	const globalModel = require("../models/mongodb/global.js");

	mongoose.set("strictQuery", false);
	mongoose.connection.on("error", err => console.error("[MONGODB] connection error:", err.message));
	mongoose.connection.on("disconnected", () => console.warn("[MONGODB] disconnected, the driver will retry automatically"));

	try {
		await mongoose.connect(uriConnect.trim(), {
			serverSelectionTimeoutMS: 15000,
			connectTimeoutMS: 15000,
			socketTimeoutMS: 45000,
			maxPoolSize: 5
		});
	}
	catch (err) {
		let hint = "";
		const msg = String(err && err.message || err);
		if (/ENOTFOUND|querySrv|ECONNREFUSED/i.test(msg)) hint = " (DNS/network problem: check the cluster link)";
		else if (/auth|bad auth|not authorized/i.test(msg)) hint = " (wrong database username or password)";
		else if (/ReplicaSetNoPrimary|Server selection timed out|ETIMEDOUT|whitelist|IP/i.test(msg)) hint = " (Atlas Network Access: allow 0.0.0.0/0 so Render can connect)";
		const e = new Error(`MongoDB connect failed: ${msg}${hint}`);
		e.name = "MONGODB_CONNECT_FAILED";
		throw e;
	}

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel
	};
};
