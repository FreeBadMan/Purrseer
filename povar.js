const http = require('http');
const qs = require('querystring');
const MongoClient = require('mongodb').MongoClient;

const mongourl='mongodb://fbm:yellowbee1241@ds135786.mlab.com:35786/purrdb' //Не забываем почистить перед коммитом
const client = new MongoClient(mongourl);
var givenTasks = [];
givenTasks[1]='https://2ch.hk'

function randInt(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}

function Check(tasks){
	tasks.updateMany(
		{busy: true, done: false, started: {$gt: Date.now()-3600000}},
		{$set: {busy: false, started:-1}}, function(err, r) {
			if (r.value!=null){
				for (i in r){
					let id = parseInt(r[i].value._id);
					console.log('Задание с id '+id+' просрочилось. Выбрасываю.')
					delete givenTasks[id];
				}
			} else {

			}
		}
	);
}


client.connect(function(err, client) {
	const db = client.db('purrdb');
	const tasks = db.collection('tasks');
	const treasureBox = db.collection('treasureBox');
	const server = http.createServer(listener)
	server.listen(8000,'195.123.221.3');
	var Timer=setInterval(()=>{Check(tasks)},3600000);

	function listener(req, res) {
		console.log('Опа, запросек '+req.method);
		//распределяем запросы по типу
		switch (req.method) {
			case 'GET':
				getWorker(req, res, tasks);
				break;
			case 'POST':
				postWorker(req, res, tasks, treasureBox);
				break;
			default:
				res.writeHead(404);
				res.end();

		}
	}
});


function getWorker(req, res, tasks){
	tasks.findOneAndUpdate(
		{busy: false, done: false},
		{$set: {busy: true, started:Date.now()}}, function(err, r) {
			if (r.value!=null){

				let id = parseInt(r.value._id);
				let newTask  = {id:r.value._id,url:r.value.url};

				givenTasks[id] = r.value.url;//переносим задание в массив с выданными заданиями
				res.writeHead(200);//говорим, что все ок
				res.write(JSON.stringify(newTask));//отправляем id задания и ссылку, на которой надо искать
				res.end();

			} else {
				res.writeHead(418);
				res.end(); //если доступных заданий(ссылок) нет, то отвечаем, что кофе варить мы не умеем
			}
		}
	);

}

function postWorker(req, res, tasks, treasureBox){
	/*
	Образец:
		{
			"id": 0,
			"treasures": ["",""],
			"postcards": ["",""],
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
			return ; //проверка на корректность полей запроса
		}

		if (givenTasks[parseInt(post.id)]) { //TODO сделать проверку post.status, сделать проверку на то, что найденную ссылку не находили раньше

			postcardsToInsert = [];
			for (i in post.postcards){
				postcardsToInsert.push( {_id:''+randInt(1,1234567)+Date.now(), url:post.postcards[i], busy:false, done:false, started:-1} )
			};
			tasks.insert(postcardsToInsert); //добавляем найденные по ссылке ссылки в коллекцию ссылок
			
			treasureBox.findOneAndUpdate( //Добавляем сокровища(найденные по ссылке слова) в коллекцию сокровищ в БД
				{url:givenTasks[parseInt(post.id)]},
				{$push: {treasures:{$each:post.treasures} }},
				{upsert:true}//если записи о словах по данной ссылке нет, добавляем новую запись, иначе добавляем данные в старую
			)

			delete givenTasks[parseInt(post.id)];
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

