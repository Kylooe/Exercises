var $ = function(str) {
    return document.getElementById(str);
}

var list = $("list"),
    todoList = $("todo-list"),
    doneList = $("done-list"),
    li = list.getElementsByTagName("li");

window.onload = function() {
    todoList.innerHTML = loadList("todo");
    doneList.innerHTML = loadList("done");
    var order = li.length;
    enter(order);
    list.addEventListener("click", toggle, false);
    list.addEventListener("click", delItem, false);
    list.addEventListener("click", tomato, false);
}

var createLi = function(num, str, list) {
    if(list==="todo") {
        return "<li><input type=\"checkbox\" id=\"item" + num + "\" name=\"items\"><label for=\"item" + num + "\">" + str + "</label><i class=\"fa fa-times\" aria-hidden=\"true\"></i><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i></li>";
    } else {
        return "<li><input type=\"checkbox\" id=\"item" + num + "\" name=\"items\" checked><label for=\"item" + num + "\">" + str + "</label></i><i class=\"fa fa-times\" aria-hidden=\"true\"></i></li>";
    }
}

function loadList(key) {
    var content = "";
    if(localStorage.getItem(key) !== null) {
        var items = loadData(key);
        for(var i=0, len=items.length; i<len; i++) {
            if(key === "done") {
                var j = loadData("todo").length + i;
                content +=  createLi(j, items[i], "done");
            } else {
                content +=  createLi(i, items[i], "todo");
            }
        }
    }
    return content;
}

function enter(order) {
    var txt = $("txt");
    txt.onkeyup = function(e) {
        var e = e || window.event,
            code = e.keyCode || e.charCode;
        if(code == 13) {
            if(this.value == "") {
                alert("待办事项不能为空！");
            } else {
                var content = this.value;
                addItem(order, content);
                this.value = "";
                order++;
            }
        }
    }
}

function addItem(order, content) {
    var newLi = document.createElement("li");
    var newLiContent = createLi(order, content, "todo").slice(4,-5);
    newLi.innerHTML = newLiContent;
    todoList.appendChild(newLi);
    saveNew(content);
}

function delItem(e) {
    var e = e || window.event,
        target = e.target || e.srcElement,
        len = li.length,
        del = list.getElementsByClassName("fa-times");
    for(var i=0; i<len; i++) {
        if(del[i] === target) {
            saveDel(li[i].parentNode.id, target.previousSibling.innerHTML);
            li[i].parentNode.removeChild(li[i]);
        }
    }
}

function toggle(e) {
    var e = e || window.event,
        target = e.target || e.srcElement,
        len = li.length,
        checkbox = list.querySelectorAll('input[type="checkbox"]');
    for(var i=0; i<len; i++) {
        if(checkbox[i] === target) {
            var content = checkbox[i].nextSibling.innerHTML; // 相应待办事项的内容
            var currentLi = checkbox[i].parentNode;
            if(checkbox[i].checked) {
                saveChange(false, content);
                doneList.appendChild(currentLi);
                currentLi.removeChild(currentLi.lastChild);
            } else {
                saveChange(true, content);
                todoList.appendChild(currentLi);
                var clock = document.createElement("i");
                clock.className = "fa fa-clock-o";
                currentLi.insertBefore(clock, null);
            }
        }
    }
}

function loadData(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveNew(content) {
    if(!localStorage.getItem("todo")) {
        var todo = [];
    } else {
        var todo = loadData("todo");
    }
    todo.push(content);
    localStorage.setItem("todo", JSON.stringify(todo));
}

function saveChange(isTodoItem, content) {
    var item, order,
        done,
        todo = loadData("todo");
    if(isTodoItem) {
        // done -> todo
        done = loadData("done");
        order = done.indexOf(content);
        item = done.splice(order, 1)[0];
        todo.push(item);
    } else {
        order = todo.indexOf(content);
        item = todo.splice(order, 1)[0];
        // todo -> done
        if(!localStorage.getItem("done")) {
            done = [];
        } else {
            done = loadData("done");
        }
        done.push(item);
    }
    localStorage.setItem("todo", JSON.stringify(todo));
    localStorage.setItem("done", JSON.stringify(done));
}

function saveDel(list, content) {
    var todo = loadData("todo"),
        done = loadData("done"),
        order;
    if(list === "todo-list") {
        order = todo.indexOf(content);
        todo.splice(order, 1);
    } else {
        order = done.indexOf(content);
        done.splice(order, 1);        
    }
    localStorage.setItem("todo", JSON.stringify(todo));
    localStorage.setItem("done", JSON.stringify(done));
}

function tomato(e) {
    var e = e || window.event,
        target = e.target || e.srcElement,
        len = li.length,
        clock = list.getElementsByClassName("fa-clock-o"),
        current = $("current"),
        task = $("task"),
        pomodoro = $("pomodoro");
    for(var i=0; i<len; i++) {
        if(clock[i] === target) {
            task.className = "off";
            pomodoro.className = "on";
            current.innerHTML = clock[i].previousSibling.previousSibling.innerHTML;
        }
    }
}

// 番茄钟
var work = $("work"),
    back = $("back"),
    planTime = $("plan-time"),
    countDown = $("count-down"),
    circle = document.querySelector("circle");
var timer = null,
    isTiming = false,
    seconds = planTime.value*60;

var numFormat = function(str) {
    return str.toString().replace(/^(\d)$/, "0$1");
}

var timeFormat = function(t) {
    var m = parseInt(t/60);
    var s = t%60;
    var time = numFormat(m) + ":" + numFormat(s);
    return time;
}

var animation = function(t, value) {
    circle.setAttribute("stroke-dasharray", value);
    circle.style.transition = "stroke-dasharray " + t + "s linear";
}

// 倒计时过程
var process = function() {
    var remainTime = seconds;
    if(isTiming) {
        clearInterval(timer);
        countDown.innerHTML = timeFormat(seconds);
        animation(1, "943 0");
    } else {
        timer = setInterval(function(){
            remainTime--;
            countDown.innerHTML = timeFormat(remainTime);
            if(remainTime==0) {
                clearInterval(timer);
                var audio = $("bell");
                audio.play();
                alert("你已经保持专注学习了一段时间啦，休息一下吧~");
                animation(1, "943 0");
                countDown.innerHTML = timeFormat(seconds);
                work.value = "START";
                isTiming = false;
            }
        },1000);
        animation(seconds, "0 943");
    }
}

// 设置专注时间
planTime.addEventListener("change", function() {
    if(isNaN(this.value) || this.value<=0) {
        alert("请输入正确的时间");
    } else {
        seconds = this.value*60;
        countDown.innerHTML = timeFormat(seconds);
    }
}, false);

work.addEventListener("click", function() {
    if(isNaN(planTime.value) || planTime.value<=0) {
        alert("时间未正确设置");
    } else {
        process();
        if(isTiming) {
            this.value = "START";
            isTiming = false;
        } else {
            this.value = "STOP";
            isTiming = true;
        }
    }
}, false);

back.addEventListener("click", function() {
    if(isTiming) {
        alert("保持专注中，请先停止番茄钟。");
    } else {
        task.className = "on";
        pomodoro.className = "off";
    }
},false);