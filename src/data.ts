const mongoose = require('mongoose');

// const Data = mongoose.Schema({
//     _id: String,
//     serverID: String,
//     userName: String,
//     userID: String,
//     chair_count: String,
// });

const profileSchema = new mongoose.Schema({
    userID: { type: String, require: true },
    serverID: { type: String, require: true },
    userName: { type: String },
    serverName: { type: String },
    serverPFP: { type: String },
    pfp: { type: String },
    chair_count: { type: Number, default: 0 },
  });

const model = mongoose.model("ProfileModels", profileSchema);

module.exports = model;