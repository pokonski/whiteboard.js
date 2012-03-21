var BoardSchema = new Schema({
  name: {type: String, default: 'default title'}
});

conn.model('Board', BoardSchema);