var ShapeSchema = new Schema({
  data:{
    type: Schema.Types.Mixed
  }
});

conn.model('Shape', ShapeSchema);

var BoardSchema = new Schema({
  name: {
    "type": String,
    "default": "",
    "required": true
  },
  "updated_at": {
    "type": Date,
    "required": true
  },
  "shapes": [ShapeSchema]
});

conn.model('Board', BoardSchema);