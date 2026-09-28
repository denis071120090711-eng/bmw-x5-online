const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const app=express(), server=http.createServer(app), io=new Server(server,{cors:{origin:true}});
app.use(express.static(__dirname));
const rooms=new Map();
function makeCode(){let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase();}while(rooms.has(c));return c;}
function leave(socket){const code=socket.data.room;if(!code)return;const room=rooms.get(code);if(room){room.delete(socket.id);socket.to(code).emit('player-left',{id:socket.id,players:room.size});if(!room.size)rooms.delete(code);}socket.leave(code);socket.data.room=null;}
function join(socket,code){const room=rooms.get(code);if(!room){socket.emit('room-error','Комната не найдена. Проверь код.');return;}if(room.size>=4){socket.emit('room-error','В комнате уже 4 игрока.');return;}leave(socket);room.add(socket.id);socket.join(code);socket.data.room=code;socket.emit('room-joined',{code,players:room.size});socket.to(code).emit('player-joined',{players:room.size});}
io.on('connection',socket=>{
 socket.on('create-room',()=>{leave(socket);const code=makeCode();rooms.set(code,new Set([socket.id]));socket.join(code);socket.data.room=code;socket.emit('room-joined',{code,players:1});});
 socket.on('join-room',d=>{const code=String(d?.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);join(socket,code);});
 socket.on('drive-state',d=>{if(!socket.data.room||!d)return;const safe={id:socket.id,x:Number(d.x)||0,y:Number(d.y)||0,z:Number(d.z)||0,heading:Number(d.heading)||0};socket.to(socket.data.room).emit('state',safe);});
 socket.on('disconnect',()=>leave(socket));
});
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log('BMW X5 Online server on '+port));
