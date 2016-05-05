var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id){
	var self = {
		x:250,
		y:250,
		id:id,
		number:"" + Math.floor(10 * Math.random()),
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,	
		maxSpd:10,
	}
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += self.maxSpd;
		if(self.pressingLeft)
			self.x -= self.maxSpd;
		if(self.pressingUp)
			self.y -= self.maxSpd;
		if(self.pressingDown)
			self.y += self.maxSpd;
	}
	return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	});
	
	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
	});
	
	
});

setInterval(function(){
	var pack = [];
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});		
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
	
	
	
	
},1000/25);


//index.html

<canvas id="ctx" width="500" height="500" style="border:1px solid #000000;"></canvas>

<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script>
	var ctx = document.getElementById("ctx").getContext("2d");
	ctx.font = '30px Arial';
	
	var socket = io();
		
	socket.on('newPositions',function(data){
		ctx.clearRect(0,0,500,500);
		for(var i = 0 ; i < data.length; i++)
			ctx.fillText(data[i].number,data[i].x,data[i].y);		
	});

	document.onkeydown = function(event){
		if(event.keyCode === 68)	//d
			socket.emit('keyPress',{inputId:'right',state:true});
		else if(event.keyCode === 83)	//s
			socket.emit('keyPress',{inputId:'down',state:true});
		else if(event.keyCode === 65) //a
			socket.emit('keyPress',{inputId:'left',state:true});
		else if(event.keyCode === 87) // w
			socket.emit('keyPress',{inputId:'up',state:true});
			
	}
	document.onkeyup = function(event){
		if(event.keyCode === 68)	//d
			socket.emit('keyPress',{inputId:'right',state:false});
		else if(event.keyCode === 83)	//s
			socket.emit('keyPress',{inputId:'down',state:false});
		else if(event.keyCode === 65) //a
			socket.emit('keyPress',{inputId:'left',state:false});
		else if(event.keyCode === 87) // w
			socket.emit('keyPress',{inputId:'up',state:false});
	}
	
</script>