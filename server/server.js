const mongoose = require("mongoose")
const Document = require('./Document')
mongoose.connect('mongodb://localhost/my_database_1');

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const defaultValue = ""

io.on("connection", (socket) => {
  socket.on("get-document", async documentId => {
    const doc = await FindOrCreateDoc(documentId);
    console.log(doc)
    socket.join(documentId);
    socket.emit("load-document", doc.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      console.log(data)
      await Document.findByIdAndUpdate(documentId, {data})
    })
  });
});

async function FindOrCreateDoc(id){
  if (id == null) return

  const document = await Document.findById(id)
  console.log(document)
  if (document) return document
  return await Document.create({_id: id, data: defaultValue})
}
