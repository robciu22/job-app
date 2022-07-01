const { Schema, model } = require("mongoose");
const Job = require("./Job.model");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const employerSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    name: String,
    email: { type: String, trim: true },
    password: String,
    imageUrl: String,
    createJobs: [{ type: Schema.Types.ObjectId, ref: Job }],
  },

  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Employer = model("Employer", employerSchema);

module.exports = Employer;
