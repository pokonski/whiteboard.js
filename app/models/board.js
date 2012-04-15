var BoardSchema = new Schema({
  name: {
    "type": String,
    "default": "",
    "required": true
  },
  "updated_at": {
    "type": Date,
    "required": true
  }
});

conn.model('Board', BoardSchema);