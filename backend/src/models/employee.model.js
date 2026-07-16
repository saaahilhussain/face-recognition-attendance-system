import mongoose from 'mongoose'

const registeredImageSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ['front', 'left', 'right', 'other'],
      required: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    faceEmbedding: {
      type: [Number],
      default: [],
      select: false,
    },
    registeredImages: {
      type: [registeredImageSchema],
      default: [],
    },
    attendanceReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
      },
    ],
  },
  {
    timestamps: true,
  },
)

employeeSchema.index({ fullName: 'text', employeeCode: 'text', department: 'text' })

export const Employee = mongoose.model('Employee', employeeSchema)
