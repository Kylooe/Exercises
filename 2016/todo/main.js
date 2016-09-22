var list = document.getElementById("list"),
    todoList = document.getElementById("todo-list"),
    doneList = document.getElementById("done-list"),
    li = list.getElementsByTagName("li");
var order = 0;
    
function enter() {
    var txt = document.getElementById("txt");
    txt.onkeyup = function(e) {
        var e = e || window.event,
            code = e.keyCode || e.charCode;
        if(code == 13) {
            if(this.value == "") {
                alert("待办事项不能为空！");
            } else {
                var content = this.value;
                addItem(order,content);
                this.value = "";
                order++;
            }
        }
    }
}

function addItem(order, content) {
    var newLi = document.createElement("li");
    var newLiContent = "<input type=\"checkbox\" id=\"item" + order + "\" name=\"items\"><label for=\"item" + order + "\" >" + content + "</label><i class=\"fa fa-times\" aria-hidden=\"true\"></i>";
    newLi.innerHTML = newLiContent;
    todoList.appendChild(newLi);
    saveNew(content);
}

function delItem() {
    list.addEventListener("click", function(e) {
        var e = e || window.event,
            target = e.target || e.srcElement,
            len = li.length,
            i = list.getElementsByTagName("i");
        for(var j=0; j<len; j++) {
            if(i[j] === target) {
                saveDel(li[j].parentNode.id, target.previousSibling.innerHTML);
                li[j].parentNode.removeChild(li[j]);
            }
        }
    }, false);
}

function toggle() {
    list.addEventListener("change", function(e) {
        var e = e || window.event,
            target = e.target || e.srcElement,
            len = li.length,
            checkbox = document.getElementsByName("items");
        for(var i=0; i<len; i++) {
            if(checkbox[i] === target) {
                var content = checkbox[i].nextSibling.innerHTML; // 相应待办事项的内容
                if(checkbox[i].checked) {
                    saveChange(false, content);
                    doneList.appendChild(checkbox[i].parentNode);
                } else {
                    saveChange(true, content);
                    todoList.appendChild(checkbox[i].parentNode);
                }
                break;
            }
        }
    }, false);
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

function loadList(key) {
    var content = "";
    if(localStorage.getItem(key) !== null) {
        var items = loadData(key);
        for(var i=0, len=items.length; i<len; i++) {
            if(key === "done") {
                content +=  "<li><input type=\"checkbox\" id=\"item" + i + "\" name=\"items\" checked><label for=\"item" + i + "\">" + items[i] + "</label><i class=\"fa fa-times\" aria-hidden=\"true\"></i></li>";
            } else {
                content +=  "<li><input type=\"checkbox\" id=\"item" + i + "\" name=\"items\"><label for=\"item" + i + "\">" + items[i] + "</label><i class=\"fa fa-times\" aria-hidden=\"true\"></i></li>";
            }
        }
    }
    return content;
}

window.addEventListener("load", function() {
    todoList.innerHTML = loadList("todo");
    doneList.innerHTML = loadList("done");
    }, false);

enter();
delItem();
toggle();

        