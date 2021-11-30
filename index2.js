"use strict";

const https = require('https');
const fs = require('fs');
const options = {
    key : fs.readFileSync('./private.pem'),
    cert: fs.readFileSync('./public.pem')
};
const os = require('os');
const socketIO = require('socket.io');
const nodeStatic = require('node-static');

let fileServer = new(nodeStatic.Server)();
let app = https.createServer(options, (req,res)=>{
    fileServer.serve(req,res);
}).listen(3000);

let io = socketIO.listen(app);
io.sockets.on('connection',socket=>{
    function log() {
        let array = ['Message from server:'];
        array.push.apply(array,arguments);
        socket.emit('log',array);
    }

    socket.on('message',message=>{
        log('Client said : ' ,message);
        socket.broadcast.emit('message',message);
    });

    socket.on('create or join',room=>{
        let clientsInRoom = io.sockets.adapter.rooms[room];
        let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');
        
        if(numClients === 0){
            console.log('create room!');
            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created',room,socket.id);
        }
        else if(numClients===1){
            console.log('join room!');
            console.log('Client Id' + socket.id + 'joined room' + room);
            io.sockets.in(room).emit('join',room);
            socket.join(room);
            socket.emit('joined',room,socket.id);
            io.sockets.in(room).emit('ready');
        }else{
            socket.emit('full',room);
        }
    });

    socket.on('message', function(message){
        if(message ==='bye' && socket.rooms['foo']){
            io.of('/').in('foo'),clients((error, socketIds) => {
                if(error) throw error;

                socketIds.forEach(socketId =>{
                    io.sockets.sockets[socketId].leave('foo');
                });
            });
        }
    });
    
    socket.on('request_message', ctnt=>{
        console.log('request message22 : ' + ctnt);
        socket.broadcast.emit('resmsg',ctnt);
    })

});

// 여기서부터는 파파고 api 모듈을 위해 선언하는 부분입니다.

