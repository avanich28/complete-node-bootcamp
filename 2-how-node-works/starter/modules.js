// Topic: Requiring Modules in Practice
console.log(arguments);
console.log(require("module").wrapper);

// module.exports
const C = require("./test-module-1");
const calc1 = new C();
console.log(calc1.add(2, 5));

// exports
// const calc2 = require("./test-module-2");
// console.log(calc2.multiply(2, 5));
const { add, multiply, divide } = require("./test-module-2");
console.log(multiply(2, 5));

// caching
require("./test-module-3")();
require("./test-module-3")();
require("./test-module-3")();
// Hello from the module // NOTE Have only once bcs the module was only loaded and executed once
// Log this beautiful text 😍
// Log this beautiful text 😍 // NOTE Came from cache, so they were stored somewhere in the Node's processes cache
// Log this beautiful text 😍
