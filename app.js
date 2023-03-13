// Import Libraries and Setup

//simple server
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const open = require("open");//local dev helper

//web sockets
const { Server } = require("socket.io");
const io = new Server(server);

//osc 
const osc = require("osc");
const os = require("os");//for use with osc


let printEveryMessage = true; 
let oscPort = "3000";//port to listen on
let webServerPort = "3000";

// Tell our Node.js Server to host our P5.JS sketch from the public folder.
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections from chrome, and open chrome when it is ready
// 设置我们的Node.js服务器以监听来自chrome的连接，并在准备好后打开chrome
server.listen(webServerPort, () => {
  console.log(`listening on *: ${webServerPort}`);
  open("http://localhost:"+webServerPort, { app: "chrome" });
});

// Callback function for what to do when our P5.JS sketch connects and sends us messages
io.on("connection", (socket) => {
  console.log("a user connected");
});

//Osc helper function to get IP Addresses
function getIPAddresses() {
  let interfaces = os.networkInterfaces(),
    ipAddresses = [];

  for (let deviceName in interfaces) {
      let addresses = interfaces[deviceName];
      for (let i = 0; i < addresses.length; i++) {
          let addressInfo = addresses[i];
          if (addressInfo.family === "IPv4" && !addressInfo.internal) {
              ipAddresses.push(addressInfo.address);
          }
      }
  }

  return ipAddresses;
};

// set up our OSC udp port
// 设置我们的OSC udp端口
let udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: oscPort
});

// run the following callback when ready showing what IP Addresses and port we are listening on
// 当准备好时运行以下回调，显示我们正在监听的IP地址和端口
udpPort.on("ready", () => {
  let ipAddresses = getIPAddresses();

  console.log("Listening for OSC over UDP.");
  ipAddresses.forEach((address) => {
      console.log(" Host:", address + ", Port:", udpPort.options.localPort);
  });
});

//when we recieve a message send it via websockets to the front-end
udpPort.on("message", (oscMessage) => {

  //send it to the front-end so we can use it with our p5 sketch
  io.emit("message",oscMessage);

  // Print it to the Console
  if (printEveryMessage) {
    console.log(oscMessage);
  }
});

udpPort.on("error", (err) =>{
  console.log(err);
});

udpPort.open();