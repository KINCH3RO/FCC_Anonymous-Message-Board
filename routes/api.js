'use strict';
const { response } = require('express');
const mongoose = require('mongoose')

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("connected succesfully");
});




let replySchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  created_on: Date,
  reported: Boolean

})

let threadSchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [replySchema],
  replycount: Number


})

function getThreadModel(board) {
  return mongoose.model(board, threadSchema)
}



module.exports = function (app) {

  app.route('/api/threads/:board')
    .get((req, res) => {
      let board = req.params.board;
      console.log(board);
      let collection = getThreadModel(board)
      collection.find()
        .limit(10)
        .sort('-bumped_on')
        .slice('replies', -3)
        //selecting subdocument keys and slicing subdocument causes error 
        //alternative using arraymap 
        //.select({ reported: 0, delete_password: 0, "replies.reported": 0, "replies.delete_password": 0 })
        .select({ reported: 0, delete_password: 0 })
        .exec((err, doc) => {
          if (err) console.log(err);
          let response = doc;
          response = response.map(thread => {

            thread.replies = thread.replies.map(y => {
              let reply = JSON.parse(JSON.stringify(y))
              delete reply["reported"];
              delete reply["delete_password"]
              return reply

            })
            return thread

          })

          res.json(response)

        })



    })
    .post(async (req, res) => {
     
     
      let board = req.params.board;
      console.log(board);
      let body = req.body
      delete body.board

      if (!body.text || !body.delete_password || !board) {
        return
      }

      body.created_on = new Date()
      body.bumped_on = new Date();
      body.reported = false;
      body.replies = []
      body.replycount = 0
      let ourThread = new getThreadModel(board)(body)

      let record = await ourThread.save()
      if(record){
        res.json(record)
        res.redirect("/b/" + board + "/")
        return
      }
      res.status(400)
      res.end("error")
    
     

    }).delete((req, res) => {

      let board = req.params.board;
      let password = req.body.delete_password;
      let threadId = req.body.thread_id;

      if (!board || !password || !threadId) {
        res.end("incorrect password")
        return;
      }

      let collection = getThreadModel(board)
      collection.findById(threadId, (err, doc) => {
        if (doc.delete_password != password) {
          res.end("incorrect password")

        } else {
          doc.remove()
          res.end("success")
        }
      })



    }).put((req, res) => {

      let board = req.params.board;
      let threadid = req.body.thread_id;


      if (!board || !threadid) {
        console.log("yes");
        res.end("error")
        return
      }

      let collection = getThreadModel(board);
      collection.findByIdAndUpdate(threadid, {
        "$set": {
          reported: true
        }
      }, (err, doc) => {
        if (doc) {
          res.end("success")
          return;
        }
        res.end("error")

      })


    })

  app.route('/api/replies/:board')
    .get((req, res) => {

      let board = req.params.board;
      let threadid = req.query.thread_id;
      if (!board || !threadid) {
        return
      }

      let collection = getThreadModel(board)
      collection.findOne({ _id: threadid })
        .select({ reported: 0, delete_password: 0, "replies.reported": 0, "replies.delete_password": 0 })
        .exec((err, doc) => {
          res.json(doc)
        })





    })
    .post((req, res) => {

      let board = req.params.board;
      let body = req.body;
      let collection = getThreadModel(board)




      collection.findById(body.thread_id, async (err, doc) => {
        if (err) console.log(err);
        doc.replies.push({
          text: body.text,
          delete_password: body.delete_password,
          created_on: new Date(),
          reported: false
        })
        doc.bumped_on = new Date()
        doc.replycount = doc.replies.length;
        let result = await doc.save()
        if(result){
          res.json(result)
          res.redirect('/b/' + board + "/" + body.thread_id);
          return
        }
        res.status(400)
        res.end("error")
      

      })



    })
    .delete((req, res) => {
      let board = req.params.board;
      let threadId = req.body.thread_id;
      let deletedPassword = req.body.delete_password;
      let replyId = req.body.reply_id;


      if (!board || !threadId || !deletedPassword || !replyId) {
        res.end("incorrect password");
        return;
      }

      let collection = getThreadModel(board);

      collection.findOneAndUpdate({ _id: threadId, "replies._id": replyId, "replies.delete_password": deletedPassword }, {
        "$set": {
          "replies.$.text": "[deleted]"
        }
      }, (err, doc) => {
        if (doc) {
          res.end("success")
          return
        }
        res.end("incorrect password")


      })



    }).put((req, res) => {
      let board = req.params.board;
      let threadId = req.body.thread_id;
      let replyId = req.body.reply_id;
      console.log(req.body);

      if (!board || !threadId || !replyId) {
 
        res.end("error");
        return;
      }

      let collection = getThreadModel(board);

      collection.findOneAndUpdate({ _id: threadId, "replies._id": replyId }, {
        "$set": {
          "replies.$.reported": true
        }
      }, (err, doc) => {
        if (doc) {
          res.end("success")
          return
        }
        res.end("error")

      })
    })



};
