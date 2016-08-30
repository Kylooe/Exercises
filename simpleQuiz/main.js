//题库
var allQuestions = [
	{
		question: "这个demo的作者是？",
		choices: ["Kylooe", "Bill", "Allen", "I don't know."],
		correct: 0
	},
	{
		question: "作者目前是什么水平？",
		choices: ["大师", "精通", "熟悉", "入门", "智障"],
		correct: 4
	},
	{
		question: "为了快速地查看功能，我们就此结束吧？",
		choices: ["好的我知道了（乖巧", "我就不我就不", "哦（冷漠"],
		correct: 0
	}
];

var btn = document.getElementById("btn"),
	title = document.getElementsByTagName("h1")[0],
	ul = document.getElementsByTagName("ul")[0],
	li = document.getElementsByTagName("li");
var score = 0,  //总分
	currentScore = 0,  //单轮得分
	currentAnswer,  //单轮所选选项
	allChoices = [],  //每题所选选项集合
	page = 0,
	questionsLen = allQuestions.length;
	

//下一个问题
function next() {
	btn.onclick =  function() {
		btn.value = "Next";
		document.getElementsByTagName("p")[0].innerHTML = "";
		
		if(page<questionsLen) {
			var currentQ = allQuestions[page],  //获取题库里的当前问题
				choicesLen = currentQ.choices.length,  // 当前问题的选项个数
				currentC = "";  //当前选项列表
			title.innerHTML = currentQ.question;

			for(var i=0; i<choicesLen; i++) {
				currentC += "<li>" + currentQ.choices[i] + "</li>";  //注意这里循环内直接修改DOM会很耗内存
			}
			ul.innerHTML = currentC;
			selected(currentQ.correct);
			score += currentScore;  //总分即为每轮得分总和
			if(typeof currentAnswer === "number") {
				allChoices.push(currentAnswer);
			}
			page++;

		} else {  //总结页面
			allChoices.push(currentAnswer);
			score += currentScore;
			title.innerHTML = "总得分：" + score;
			var text = "";
			for(var i=0; i<questionsLen; i++) {
				text += "问题：" + allQuestions[i].question + "<br />" + "正确答案：" + allQuestions[i].choices[allQuestions[i].correct] + "<br />" + "你的答案：" + allQuestions[i].choices[allChoices[i]] + "<br />";
			}
			document.getElementsByTagName("p")[0].innerHTML = text;
			ul.innerHTML = "";
			page = 0;
			score = 0;
			btn.value = "ReStart";
		}
		

	};
}

//单选
function selected(answer) {
	var selectedOrder,
		len = li.length;
	ul.onclick = function() {
		var e = e || window.event,
			target = e.target || e.srcElement;
		for(var i=0; i<len; i++) {
			if(li[i] === target) {
				var selectedItem = setSelected(li[i]);
				if(selectedItem) {  //选取了一个选项
					if((typeof selectedOrder == "number") && (i != selectedOrder)) {  //点选当前选项时已存在其他已选选项
						li[selectedOrder].className = "";
					 	selectedOrder = i;
					 } else {
					 	selectedOrder = i;
					}
				}
			}
			if(li[i].className) {
				currentAnswer = i;
				currentScore = (currentAnswer == answer) ? 1 : 0;  //本题选中的选项是否为正确答案
			}
			
		}
	};
}

//设置选取效果
function setSelected(selectedItem) {
	if(selectedItem.className) {
		selectedItem.className = "";
		return false;
	}else {
		selectedItem.className = "act";
		return true;
	}
}

next();


