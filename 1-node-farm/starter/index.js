// Topic: Using Modules 1: Core Modules
const fs = require('fs'); // Read and write data to the 'file system'
const http = require('http'); // Building http server
const url = require('url');
// 1. function that we can use to create slug
// 2. slug is the last part of a URL that contains a unique string that identifies the resource that the website is displaying
const slugify = require('slugify');
const replaceTemplate = require('./modules/replaceTemplate'); // ./ is point to the location where this module is in
// dirname points to the folder where this module is in

//////////////////////////////////
// FILES

// const hello = "Hello world";
// console.log(hello);

/*
// Topic: Reading and Writing Files
// NOTE Blocking, synchronous way
const textIn = fs.readFileSync("./txt/input.txt", "utf-8"); // english
console.log(textIn);

const textOut = `This is what we know about the avocado: ${textIn}.\nCreated on ${Date.now()}`;
fs.writeFileSync("./txt/output.txt", textOut);
console.log("File written!");

// Topic: Reading and Writing Files Asynchronously
// NOTE Non-blocking, asynchronous way
fs.readFile("./txt/start.txt", "utf-8", (err, data1) => {
  if (err) return console.log("ERROR! 💥");

  fs.readFile(`./txt/${data1}.txt`, "utf-8", (err, data2) => {
    console.log(data2);
    fs.readFile("./txt/append.txt", "utf-8", (err, data3) => {
      console.log(data3);

      fs.writeFile("./txt/final.txt", `${data2}\n${data3}`, "utf-8", (err) => {
        console.log("Your file has been written 😁");
      });
    });
  });
});
console.log("Will read file");
*/

//////////////////////////////////
// SERVER

const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);

// Topic: Building a (Very) Simple API
// execute once we will put outside
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

// Topic: Using Modules 3: 3rd Party Modules
const slugs = dataObj.map((el) => slugify(el.productName, { lower: true }));
console.log(slugs);

// Topic: Creating a Simple Web Server
// 1. create
const server = http.createServer((req, res) => {
  // Topic: Parsing Variables from URLs
  // console.log(req.url); // /product?id=0
  const { query, pathname } = url.parse(req.url, true); // true means part the query(id=0) into an obj

  // Topic: Routing
  // Overview page
  if (pathname === '/' || pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    const cardsHtml = dataObj
      .map((el) => replaceTemplate(tempCard, el))
      .join('');
    const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
    res.end(output);

    // Product page
  } else if (pathname === '/product') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    const product = dataObj[query.id];
    const output = replaceTemplate(tempProduct, product);
    res.end(output);

    // API
  } else if (pathname === '/api') {
    res.writeHead(200, {
      'Content-type': 'application/json',
    });
    res.end(data);

    // Not found
  } else {
    // Need to set before we send the res.end
    res.writeHead(404, {
      // HTTP header is basically a piece of information about the response that we are sending back.
      'Content-type': 'text/html',
      'my-own-header': 'hello-world',
    });
    res.end('<h1>Page not found!</h1>');
  }

  // res.end("Hello from the server!"); // 2. execute each time that a new request hits the server
});

// 3. Listen incoming request
// NOTE localhost means the current computer, so that the program is currently running in.
server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
}); // port, standard IP address for localhost

// Topic: HTML Templating: Filling the templates
// In template folder

// Topic: Package Versioning and Updating
// npm init
// 1.6.6 -> major (break when changing).minor (add a new feature).patch (solve bug)
// npm outdated
// npm update (package)
// npm uninstall (package)
// ^ means accept patch and minor releases
// ~ accepts only patch releases (NOTE safe)
// * includes all version
// Can delete node_modules and install again (npm install)
