// model-pilot.js
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const pilotSchema = new mongoose.Schema({
  callSign: {
    type: String,
    required: true,
    trim: true,
    minLength: 6,
    maxLength: 50,
  },
  rank:{
    type: String,
    required : true,
    enum: ['Second  Lieutenant','First Lieutenant','Captain','Major',' Lieutenant Colonel','Colonel'],
  },
  platForm: {
    type: String,
    required: true,
    trim : true,
    enum : ['F15','F16','F18','F22','F35','EFA','GRIPEN','MIG29','RAFALE','SU27','SU35','SU57'],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    trim: true,
  },
   messages: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "wall",
    },
  ],
  admin: {
    type: Boolean,
    required: true,
    default: false,
   },
});

pilotSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Pilot", pilotSchema);
