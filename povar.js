const http = require('http');
const qs = require('querystring');
const MongoClient = require('mongodb').MongoClient;

const server = http.createServer().listen(8000);


var givenTasks=[];

const mongourl='mongodb://localhost:32768'
const client = new MongoClient(mongourl);

client.connect(function(err, client) {
	//описываем подключение к нашим базам
	const db = client.db('purrseer');
	const tasks = db.collection('tasks');
	const treasureBox = db.collection('treasureBox');

	server.on('request', function (req, res) {

		switch (req.method) {
			case 'GET':
				console.log(tasks.findOneAndUpdate(
					{busy: false},
					{$set: {busy: true}},function(err, r) {
						let id = r.value._id;
						let newTask  = r.value;

						givenTasks[id] = newTask;//переносим задание в массив с выданными заданиями
						res.writeHead(200);//говорим, что все ок
						res.write(JSON.stringify(newTask));//отправляем id задания и ссылку, на которой надо искать
						res.end();
					}
				));
				break;
			case 'POST':
				/**
				var body = '';

				req.on('data', function (data) {
					body += data;
				});

				req.on('end', function () {
					var post = qs.parse(body);

					if (givenTasks[post.id]) { //проверяем, не левый ли это запрос

						tasks = tasks.concat(post.postcards); //добавляем найденный ссылки в массив с заданиями

						if (treasureBox[givenTasks[post.id]]) {
						} else {
							treasureBox[givenTasks[post.id]] = ''
						}
						;
						for (item in post.treasures) {
							treasureBox[givenTasks[post.id]] += post.treasures[item]
						}
						; //Кладем найденные по ссылке слова в объект с полем <ссылка>


						givenTasks.delete(post.id);
						res.writeHead(200);
						res.write("OK");
						res.end(); //удаляем задание из ожидаемых и говорим, что все хорошо
					} else {
						tasks.push(givenTasks[post.id]);
						givenTasks.delete(post.id); //Если запрос левый, то возвращаем задание из ожидаемых в массив заданий
						res.writeHead(423);
						res.write("MUDA");
						res.end();
					}
				});
				 **/
				break;
		}
	});
});


function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}