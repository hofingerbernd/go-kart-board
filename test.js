const fs = require("fs"); 
const { JSDOM } = require("jsdom"); 
const html = fs.readFileSync("index.html", "utf8"); 
const dom = new JSDOM(html); 
const document = dom.window.document; 
console.log(!!document.querySelector("#edit-kart")); 
console.log(!!document.querySelector("#save-driver-btn"));

