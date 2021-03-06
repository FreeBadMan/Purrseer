const http = require('http');
const server = http.createServer(listener).listen(8001);

var tasks=['lol'],
	givenTasks=["lol"],
	treasureBox={};

function listener(req, res){
	//распределяем запросы по типу
	switch (req.method) {
		case 'GET':
			getWorker(req,res);
			break;
		case 'POST':
			postWorker(req, res);
			break;
		default:
			res.writeHead(404);
			res.end();

	}
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getWorker(req, res){
	if(tasks.length == 0) { //Проверяем что есть задачи
		res.writeHead(204)//говорим, что все ок но зайти надо позже
		res.end();
		return;
	}

	res.writeHead(200)//говорим, что все ок

	let newTask=tasks.shift(); //Берем новую ссылку из массива заданий

	let id = ""+Date.now()+randInt(1,1234567); //Создаем заданию id

	givenTasks[id]=newTask;//переносим заданиев массив с выданными заданиями //а вот это точно будет жить в базе

	res.write( JSON.stringify({"id":id, "task":newTask}));
	res.end();
}

function postWorker(req, res){
	/*
	Образец:
		{
			"id": 0,
			"treasures": "",
			"postcards": "",
			"status": "OK"
		}
	 */

	var body = '';

	req.on('data', function (data) {
		body += data;
	});

	req.on('end', function(){
		try {
			//защита от некорректного JSON - тела запроса
			var post = JSON.parse(body);
		} catch (e) {
			console.log(e);
			res.writeHead(415);
			res.end();
			return ;
		}

		if ((post.id === undefined) || (post.treasures === undefined) || (post.postcards === undefined) || (post.status === undefined)) {
			res.writeHead(406);
			res.end();
			return ;
		}

		if (givenTasks[post.id]) { //проверяем, не левый ли это запрос

			tasks=tasks.concat(post.postcards); //добавляем найденный ссылки в массив с заданиями @TODO добавить проверку поля

			if (treasureBox[givenTasks[post.id]]){}
			else{ treasureBox[givenTasks[post.id]]=''};
			for (item in post.treasures){
				treasureBox[givenTasks[post.id]]+=post.treasures[item]
			}; //Кладем найденные по ссылке слова в объект с полем <ссылка>

			delete givenTasks[post.id];
			res.writeHead(200);
			res.write("OK");
			res.end(); //удаляем задание из ожидаемых и говорим, что все хорошо
		} else {
			res.writeHead(423);
			res.write("MUDA");
			res.end();
		}


	});
}
