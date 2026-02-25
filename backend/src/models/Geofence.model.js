// models/Geofence.model.js
import mongoose from "mongoose";

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  
  radius: { type: Number, required: true, default: 100 }, // in meters
  
  address: {
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  
  // Which classrooms/employees this applies to
  applicableTo: {
    allTeachers: { type: Boolean, default: true },
    allFacultyAdmins: { type: Boolean, default: true },
    specificEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    specificClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
  },
  
  // Time restrictions
  timeRestrictions: [{
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    startTime: String, // e.g., "09:00"
    endTime: String, // e.g., "17:00"
  }],
  
  isActive: { type: Boolean, default: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

geofenceSchema.index({ location: "2dsphere" });

export default mongoose.model("Geofence", geofenceSchema);