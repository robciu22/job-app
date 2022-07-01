const { Schema, model } = require("mongoose");
const Job = require("./Job.model");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },

    password: String,
    applyJobs: [{ type: Schema.Types.ObjectId, ref: Job }],
    imageUrl: String,
    email: String,
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
