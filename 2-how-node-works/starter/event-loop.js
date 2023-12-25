// Topic: The Event Loop in Practice
const fs = require("fs");
// NOTE All the functions from this package they will be offloaded automatically by the event loop to the thread pool
const crypto = require("crypto");

const start = Date.now();
process.env.UV_THREADPOOL_SIZE = 4; // Have only 1 (size = 1) thread in our thread pool

setTimeout(() => console.log("Timer 1 finished"), 0);
setImmediate(() => console.log("Immediate 1 finished"));

fs.readFile("test-file.txt", () => {
  console.log("I/O finished");
  console.log("------------------");

  setTimeout(() => console.log("Timer 2 finished"), 0);
  setTimeout(() => console.log("Timer 3 finished"), 3000);
  // IMPT execute before timer bcs I/O polling phase
  setImmediate(() => console.log("Immediate 2 finished"));

  // IMPT execute before setImmediate
  process.nextTick(() => console.log("Process.nextTick"));

  // Blocking code and not running inside event loop, so it execute first
  // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  // console.log(Date.now() - start, "Password encrypted");

  // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  // console.log(Date.now() - start, "Password encrypted");

  // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  // console.log(Date.now() - start, "Password encrypted");

  // crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  // console.log(Date.now() - start, "Password encrypted");

  // 4 threads
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "Password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "Password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "Password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "Password encrypted");
  });
});

console.log("Hello from the top-level code");
