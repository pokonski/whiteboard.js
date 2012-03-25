var BoardSchema = new Schema({
  name: {
    type: String,
    default: ""
  }
});

conn.model('Board', BoardSchema);