import * as mongoose from "mongoose";

// const Data = mongoose.Schema({
//     _id: String,
//     serverID: String,
//     userName: String,
//     userID: String,
//     chair_count: String,
// });

type Profile = {
  userID: string;
  serverID: string;
  userName: string;
  serverName: string;
  serverPFP: string;
  pfp: string;
  chair_count: number;
};

const profileSchema = new mongoose.Schema({
  userID: { type: String, require: true },
  serverID: { type: String, require: true },
  userName: { type: String },
  serverName: { type: String },
  serverPFP: { type: String },
  pfp: { type: String },
  chair_count: { type: Number, default: 0 },
});

export const profileModel = mongoose.model("ProfileModels", profileSchema);
