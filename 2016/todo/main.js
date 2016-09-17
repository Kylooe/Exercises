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
            var content = this.value;
            addItem(order,content);
            this.value = "";
            order++;
        }
    }
}

function addItem(order, content) {
    var newLi = document.createElement("li");
    var newLiContent = "<input type=\"checkbox\" id=\"item" + order + "\" name=\"items" + "\"><label for=\"item" + order + "\" >" + content + "</label><i class=\"fa fa-times\" aria-hidden=\"true\"></i>";
    newLi.innerHTML = newLiContent;
    todoList.appendChild(newLi);
}

function delItem() {
    list.addEventListener("click", function(e) {
        var e = e || window.event,
            target = e.target || e.srcElement,
            len = li.length,
            i = list.getElementsByTagName("i");
        for(var j=0; j<len; j++) {
            if(i[j] === target) {
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
                if(checkbox[i].checked) {
                    doneList.appendChild(checkbox[i].parentNode);
                }else {
                    todoList.appendChild(checkbox[i].parentNode);
                }
            }
        }

    }, false);
}

enter();
delItem();
toggle();

        