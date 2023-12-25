// Topic: Streams in Practice
const fs = require("fs");
const server = require("http").createServer();

server.on("request", (req, res) => {
  // Solution 1
  // Load entire file in memory and then send that data -> slow!
  // fs.readFile("test-file.txt", (err, data) => {
  //   if (err) console.log(err);
  //   res.end(data);
  // });

  // Solution 2: Streams
  // const readable = fs.createReadStream("test-file.txt");
  // readable.on("data", (chunk) => {
  //   res.write(chunk); // NOTE This response is writable stream. We use write method to send every single piece of data into that stream. -> Send data back to the client
  // });
  // readable.on("end", () => {
  //   res.end(); // IMPT If we don't have the end method, the response will actually never really be sent to the client.
  // });
  // readable.on("error", (err) => {
  //   console.log(err);
  //   res.statusCode = 500;
  //   res.end("File not found!");
  // });

  // Solution 3
  // NOTE Backpressure happen when the response cannot send the data nearly as fast as it is receiving it from the file. -> fix with pipe
  // NOTE Pipe operator allows us to pipe the readable stream right into the input of a writable stream bcs it will automatically handle the speed basically of the data coming in, and the speed of the data going out.
  const readable = fs.createReadStream("test-file.txt");
  readable.pipe(res); // put in writable stream (res)
  // readableSource.pipe(writableDestination) // This stream can be a duplex or transform as well
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Listening...");
});
