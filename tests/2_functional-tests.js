const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testBoard = "boardyy"
let threadID = null
let threadPassword = null
let invalidPass = "qsdqsofgs"
let replyID = null
let replyPass = null

suite('Functional Tests', function () {

    //threads
    test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
        chai.request(server)
            .post("/api/threads/" + testBoard)
            .send({
                text: "125585",
                delete_password: 123
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                threadID = res.body._id;
                threadPassword = res.body.delete_password;
                done();
            })

    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
        chai.request(server)
            .get("/api/threads/" + testBoard)
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.equal(res.type, "application/json");
                assert.isAbove(res.body.length, 0)
                assert.isBelow(res.body.length, 11)
                done();
            })

    });

    test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
        chai.request(server)
            .post("/api/replies/" + testBoard).
            send({
                thread_id: threadID,
                text: "125585",
                delete_password: 123
            })

            .end((err, res) => {

                assert.equal(res.status, 200)
                assert.equal(res.type, "application/json");
                assert.isObject(res.body)
                replyID = res.body.replies[0]._id;
                replyPass=res.body.replies[0].delete_password;
                done();
            })

    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
        chai.request(server)
            .get("/api/replies/" + testBoard + "?thread_id=" + threadID)
            .end((err, res) => {

                assert.equal(res.status, 200)
                assert.equal(res.type, "application/json");
                assert.isObject(res.body)
                assert.isArray(res.body.replies)
                assert.isAbove(res.body.replies.length, 0)


                done();
            })

    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
        chai.request(server)
            .put("/api/replies/" + testBoard)
            .send({
                thread_id: threadID,
                reply_id: replyID
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "success")
                done();
            })

    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
        chai.request(server)
            .put("/api/threads/" + testBoard)
            .send({
                thread_id: threadID,
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "success")
                done();
            })

    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function (done) {
        chai.request(server)
            .delete("/api/replies/" + testBoard)
            .send({
                thread_id: threadID,
                reply_id: replyID,
                delete_password: invalidPass
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "incorrect password")
                done();
            })

    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function (done) {
        chai.request(server)
            .delete("/api/replies/" + testBoard)
            .send({
                thread_id: threadID,
                reply_id: replyID,
                delete_password: replyPass
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "success")
                done();
            })

    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function (done) {
        chai.request(server)
            .delete("/api/threads/" + testBoard)
            .send({
                thread_id: threadID,
                delete_password: invalidPass
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "incorrect password")
                done();
            })

    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
        chai.request(server)
            .delete("/api/threads/" + testBoard)
            .send({
                thread_id: threadID,
                delete_password: threadPassword
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, "success")
                done();
            })

    });







});


