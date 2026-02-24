import mongoose, { Schema, model, models } from "mongoose";

export interface IHotspot {
  productId: mongoose.Types.ObjectId;
  startTime: number;
  endTime:   number;
  x?:        number;
  y?:        number;
  label?:    string;
}

export interface IReel {
  _id?:           string;
  storeId:        mongoose.Types.ObjectId;
  productId:      mongoose.Types.ObjectId;
  videoUrl:       string;
  thumbnailUrl:   string;
  isMultiProduct: boolean;
  hotspots:       IHotspot[];
  likesCount:     number;
  viewsCount:     number;
  score:          number;
  // Extra fields stored via strict:false from PATCH route
  title?:       string;
  description?: string;
  isPublished?: boolean;
}

const HotspotSchema = new Schema<IHotspot>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  startTime: { type: Number, required: true, min: 0 },
  endTime:   { type: Number, required: true },
  x:         { type: Number, min: 0, max: 100, default: 50 },
  y:         { type: Number, min: 0, max: 100, default: 50 },
  label:     { type: String, trim: true },
});

const ReelSchema = new Schema<IReel>(
  {
    storeId:        { type: Schema.Types.ObjectId, ref: "Store",   required: true, index: true },
    productId:      { type: Schema.Types.ObjectId, ref: "Product", required: true },
    videoUrl:       { type: String, required: true },
    thumbnailUrl:   { type: String, required: true },
    isMultiProduct: { type: Boolean, default: false },
    hotspots:       { type: [HotspotSchema], default: [] },
    likesCount:     { type: Number, default: 0 },
    viewsCount:     { type: Number, default: 0 },
    score:          { type: Number, default: 0, index: true },
    // Optional soft fields — written by PATCH via strict:false
    title:          { type: String, default: "" },
    description:    { type: String, default: "" },
    isPublished:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReelSchema.index({ "hotspots.startTime": 1 });

const Reel = models?.Reel || model<IReel>("Reel", ReelSchema);
export default Reel;