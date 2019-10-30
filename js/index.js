/*
定义全局变量
*/
var MAX_PATH_LENGTH = 10001; //最大路径长度
var nodeNum = 0; //结点数量
var pathNum = 0; //路径数量
var sights = new Array(); //节点信息数组
var paths = new Array(); //路径信息数组
var G = new Array(); //邻接矩阵存放顶点和边信息
var P = new Array(); //前驱矩阵
var curOperation = 0; //标识当前操作
var START = -1; //起始结点
var END = -1; //终止结点
var can;

//事件处理
window.onload = function () {
	//触发添加景点操作
	$("addnode").onclick = function () {
		//操作标识数为1
		curOperation = 1;
		//设置操作信息：添加景点，不设置起始和结束节点
		setOperationInfo(1, -1, -1);
		//不显示最短距离和最短路径
		$("queryrlt").style.display = "none";
	};
	//触发设置路线操作，基本操作同上
	$("setlines").onclick = function () {
		curOperation = 2;
		setOperationInfo(2, -1, -1);
		$("queryrlt").style.display = "none";
	};
	//触发选择节点操作，基本操作同上
	$("selnode").onclick = function () {
		curOperation = 3;
		setOperationInfo(3, -1, -1);
		$("queryrlt").style.display = "none";
	};
	//触发最短路径查询操作，则进行最短路径查询
	$("querypaths").onclick = queryPaths;

	//定义canvas画布变量
	var draw_area = $("draw_area");
	//将can变量设置为在画布上绘2d图环境
	can = draw_area.getContext("2d");

	//触发绘图事件
	$("draw_area").onclick = function () {
		//操作标识符为1，则执行添加节点操作
		//操作标识符为2，则执行设置路线操作
		//操作标识符为3，则执行选择节点操作
		if (1 == curOperation) {
			addNode();
		} else if (2 == curOperation) {
			setLines();
		} else if (3 == curOperation) {
			selectSights();
		}
	};

	//触发重置节点事件
	$("resetnode").onclick = function () {
		//经提示后确认，将节点数量和路径数量归零
		if (confirm("确定重置结点吗？")) {
			nodeNum = 0;
			pathNum = 0;
			//结点提示数量归零
			setNodePathInfo(true);
			//路径提示数量归零
			setNodePathInfo(false);
			//擦除画布内容
			can.clearRect(0, 0, 770, 500);
		}
	};
};

//节点，包括序号和x,y坐标属性
function SightNode() {
	this.num = 0;
	this.XPos = 0;
	this.YPos = 0;
}

//路径，包括起始节点，终止节点和路径长度属性
function PathNode() {
	this.startNode = 0;
	this.endNode = 0;
	this.pathLength = 0;
	this.pathDirection = " ";
}

//返回id所引的文档内容，类似jQuery方法
function $(id) {
	return document.getElementById(id);
}

//添加结点操作
function addNode() {
	//鼠标指针点击坐标
	var mouse_pos = getMousePos();
	//判断选点距离是否太小
	if (!isNodePosAvailable(mouse_pos.x, mouse_pos.y)) {
		alert("结点之间距离太近，请重新设置！");
		return;
	}
	//创建新的节点
	sights[nodeNum] = new SightNode();
	//设置节点的序号属性
	sights[nodeNum].num = nodeNum + 1;
	//设置节点x坐标为鼠标x坐标
	sights[nodeNum].XPos = mouse_pos.x;
	//设置节点y坐标为鼠标y坐标
	sights[nodeNum].YPos = mouse_pos.y;

	//开始一条路径
	can.beginPath();
	//绘制圆形节点
	can.arc(mouse_pos.x, mouse_pos.y, 15, 0, 360, false);
	//渐变（边框）颜色
	can.strokeStyle = "rgb(255,0,0)";
	//内部颜色
	can.fillStyle = "rgb(255,0,0)";
	//填充颜色
	can.fill();
	//字体
	can.font = "16px Courier New";
	//字颜色
	can.fillStyle = "rgb(255,255,255)";
	//填充字
	var offset = nodeNum < 9 ? 5 : 9;
	can.fillText(nodeNum + 1, mouse_pos.x - offset, mouse_pos.y + 5);
	//绘制
	can.stroke();
	//
	can.closePath();
	//节点数组序号增加
	nodeNum++;
	//节点数量信息增加
	setNodePathInfo(true);
}

//获取鼠标点击坐标
function getMousePos(event) {
	var e = event || window.event;
	var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
	var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
	var x = e.pageX || e.clientX + scrollX;
	var y = e.pageY || e.clientY + scrollY;
	var cont_left = $("cont_left");
	var cont_left_pos = getAbsPoint(cont_left);
	return {
		x: x - cont_left_pos.x,
		y: y - cont_left_pos.y
	};
}

//获取元素在body内右上角绝对坐标
function getAbsPoint(e) {
	var x = e.offsetLeft;
	var y = e.offsetTop;
	while ((e = e.offsetParent)) {
		x += e.offsetLeft;
		y += e.offsetTop;
	}
	return {
		x: x,
		y: y
	};
}

//获取鼠标点击的结点编号
function getClickedNode() {
	mousePos = getMousePos();
	for (var i = 0, j = sights.length; i < j; i++) {
		var range =
			Math.pow(sights[i].XPos - mousePos.x, 2) +
			Math.pow(sights[i].YPos - mousePos.y, 2);
		if (range <= 225) {
			return sights[i].num;
		}
	}
	return -1;
}

//判断两点之间距离是否太近
//接受两个参数为新节点的x和y的坐标
function isNodePosAvailable(newX, newY) {
	//遍历各个已存在的节点
	for (var i = 0; i < nodeNum; i++) {
		//计算距离，距离太小则返回false
		var range =
			Math.pow(newX - sights[i].XPos, 2) + Math.pow(newY - sights[i].YPos, 2);
		if (range < 5000) return false;
	}
	return true;
}

//判断两点间路径是否设置
function isPathExist(node1, node2) {
	for (var i = 0, j = paths.length; i < j; i++) {
		if (
			(node1 == paths[i].startNode && node2 == paths[i].endNode) ||
			(node2 == paths[i].startNode && node1 == paths[i].endNode)
		) {
			return true;
		}
	}
	return false;
}

//设置顶点和边数量提示信息
function setNodePathInfo(setNode) {
	if (setNode) {
		var nodeInfo = $("nodenum");
		nodeInfo.innerHTML = nodeNum;
	} else {
		var pathInfo = $("pathnum");
		pathInfo.innerHTML = pathNum;
	}
}

//设置路线
//起始节点标号
var startSight = -1;
//结束节点标号
var endSight = -1;
//将是否设置初始节点的初始值设置为false
var selFinished = false;

function setLines() {
	//判断节点数
	if (nodeNum < 2) {
		alert("请先添加结点！");
		return;
	}
	//通过点击获取节点
	var selNode = getClickedNode();
	//如果还未完成初始节点选择
	if (!selFinished) {
		//若已经选上节点
		if (-1 != selNode) {
			//创建新的路径
			paths[pathNum] = new PathNode();
			//将初始节点设为选上的节点
			startSight = selNode;
			//将路径的起始点属性设置为选上的节点
			paths[pathNum].startNode = selNode;
			//将是否完成初始节点改为true
			selFinished = true;
			//设置操作信息：设置路线，起始节点序号信息
			setOperationInfo(2, startSight, -1);
		}
	}
	//如果已完成初始节点选择
	else if (selFinished) {
		if (-1 != selNode) {
			/*
			if(startSight == selNode) {
				return false;
			}
			*/
			//判断两点间路径是否已经设置
			if (isPathExist(startSight, selNode)) {
				alert("该路径已经设置！");
				return false;
			}
			//设置结束节点
			endSight = selNode;
			//将路径的结束点属性设置为选上的节点
			paths[pathNum].endNode = selNode;
			//设置操作信息：设置路线，起始节点和终止节点序号信息
			setOperationInfo(2, startSight, endSight);

			//设置路线提示
			$("drawnodeinfo").innerHTML =
				'请设置 <span style="color:blue;font-weight:bold">结点' +
				startSight +
				" - 结点" +
				endSight +
				"</span> 的路径长度";
			//右下方呈块级元素
			$("cont_right_bottom").style.display = "block";
			//文本框获取路径长度值
			$("pathlength").focus();
			$("subbtn").onclick = drawPath;
		}
	}
}

//绘制路线
function drawPath() {
	var pathDirection = $("setdir").value;
	var pathLength = parseInt($("pathlength").value);
	if (pathDirection && pathLength) {
		paths[pathNum].pathDirection = pathDirection;
		paths[pathNum].pathLength = pathLength;
		can.beginPath();
		can.strokeStyle = "rgb(0, 0, 255)"; //设置画笔颜色
		can.fillStyle = "rgb(0, 0, 0)";
		//起始位置为初始节点的x,y坐标
		can.moveTo(sights[startSight - 1].XPos, sights[startSight - 1].YPos);
		//到达位置为结束节点的x,y坐标
		can.lineTo(sights[endSight - 1].XPos, sights[endSight - 1].YPos);
		//画箭头
		if (paths[pathNum].pathDirection == "single"){
			can.moveTo(sights[endSight - 1].XPos, sights[endSight - 1].YPos);
			can.lineTo(sights[endSight - 1].XPos-13, sights[endSight - 1].YPos+7.5);
			can.moveTo(sights[endSight - 1].XPos, sights[endSight - 1].YPos);
			can.lineTo(sights[endSight - 1].XPos-13, sights[endSight - 1].YPos-7.5);
		}
		
		//在路径的中点标记路径长度
		var textXPos =
			(sights[startSight - 1].XPos + sights[endSight - 1].XPos) / 2;
		var textYPos =
			(sights[startSight - 1].YPos + sights[endSight - 1].YPos) / 2;
		can.fillText(pathLength, textXPos, textYPos);
		can.stroke();
		can.closePath();
		//将设置路线的变量初始化
		startSight = -1;
		endSight = -1;
		pathNum++;
		selFinished = false;
		//边数量信息增加
		setNodePathInfo(false);
		//文本框还原为空
		$("pathlength").value = "";
		//右下方不显示
		$("cont_right_bottom").style.display = "none";
		//设置操作信息：设置路线
		setOperationInfo(2, -1, -1);
		//重绘景点
		//redrawNode();
		return true;
	} else {
		alert("请设置完整路径");
		return false;
	}
}

//重绘景点，将路径的线条覆盖，好看一些
/*
function redrawNode() {	
	for(var i = 0; i < nodeNum; i++) {
		can.beginPath();
		can.arc(sights[i].XPos, sights[i].YPos, 15, 0, 360, false);	
		can.strokeStyle="rgb(255,0,0)";
		can.fillStyle = "rgb(255,0,0)";
		can.fill();
		can.font = "16px Courier New";
		can.fillStyle = "rgb(255,255,255)";
		var offset = i < 9 ? 5 : 9;
		can.fillText(i + 1, sights[i].XPos - offset, sights[i].YPos + 5);
		can.stroke();
		can.closePath();
	}	
}
*/

//设置操作信息
//接受三个参数，oper代表操作标识数，node1代表起始节点，node2代表结束节点
function setOperationInfo(oper, node1, node2) {
	//操作信息（当前操作等）元素呈现为块级元素
	$("operinfo").style.display = "block";
	//起始节点显示信息
	$("startnode").innerHTML = "";
	//结束节点显示信息
	$("endnode").innerHTML = "";
	//定义当前操作
	var curOper = $("curoper");
	//当前操作标识数为1，则当前操作显示添加景点
	//当前操作标识数为2，则当前操作显示设置路线
	//当前操作标识数为3，则当前操作显示选择景点
	//当前操作标识数为其他，则当前操作显示操作表示数
	if (1 == oper) {
		curOper.innerHTML = "添加结点";
	} else if (2 == oper) {
		curOper.innerHTML = "设置路线";
	} else if (3 == oper) {
		curOper.innerHTML = "选择结点";
	} else {
		curOper.innerHTML = oper;
	}
	//起始节点存在，则显示起始景点信息
	if (node1 != -1) {
		$("startnode").innerHTML =
			'起始结点：<span style="color:blue">结点' + node1 + "</span>";
	}
	//结束节点存在，则显示结束节点信息
	if (node2 != -1) {
		$("endnode").innerHTML =
			'终止结点：<span style="color:blue">结点' + node2 + "</span>";
	}
}

//选择查询路线的起始点和终点
//是否选择节点变量初始设为false
var isSelected = false;
//选择节点操作
function selectSights() {
	//获取当前节点
	var curSel = getClickedNode();
	if (curSel != -1) {
		if (!isSelected) {
			START = curSel; //将当前节点序号赋给起始节点
			isSelected = true; //是否选择节点变量设为true
			setOperationInfo(3, START, -1); //设置操作信息，包括选择节点操作和初始节点序号
		} else {
			if (curSel == START) {
				alert("起始点和终点不能相同！");
				return false;
			}
			END = curSel; //将当前节点序号赋给结束节点
			isSelected = false; //是否选择节点变量设为false
			setOperationInfo(3, START, END); //设置操作信息，包括选择节点操作，初始和结束节点序号
		}
	}
}

//创建邻接矩阵
function createMatrix() {
	//邻接矩阵
	for (var i = 0; i < nodeNum; i++) {
		G[i] = new Array();
		for (var j = 0; j < nodeNum; j++) {
			G[i][j] = MAX_PATH_LENGTH;
		}
		G[i][i] = 0;
	}


	for (var i = 0; i < pathNum; i++) {
		if (paths[i].pathDirection == "single") {
			G[paths[i].startNode - 1][paths[i].endNode - 1] = paths[i].pathLength;
		} else if (paths[i].pathDirection == "double") {
			G[paths[i].startNode - 1][paths[i].endNode - 1] = paths[i].pathLength;
			G[paths[i].endNode - 1][paths[i].startNode - 1] = paths[i].pathLength;
		}
		/*else {
			G[paths[i].startNode - 1][paths[i].endNode - 1] = paths[i].pathLength;
			G[paths[i].endNode - 1][paths[i].startNode - 1] = paths[i].pathLength;
		}*/
	}
}

//Dijkstra算法求最短路径
var s = new Array(); // 判断是否已存入该点到S集合中
var prev = new Array(); //记录当前结点的前一个结点
var dist = new Array(); //记录到各点的最短路径(起始节点已经确定)
//Dijkstra算法接受三个参数：第一个参数为节点数，第二个参数为起始节点索引，第三个参数为邻接矩阵
function Dijkstra(n, v, G) {
	for (var i = 0; i < n; i++) {
		//起始节点到各个节点的距离
		dist[i] = G[v][i];
		s[i] = false;
		if (dist[i] == MAX_PATH_LENGTH) {
			prev[i] = 0;
		} else {
			prev[i] = v;
		}
	}
	dist[v] = 0;
	s[v] = true;

	// 依次将未放入S集合的结点中，取dist[]最小值的结点，放入结合S中
	// 一旦S包含了所有V中顶点，dist就记录了从源点到所有其他顶点之间的最短路径长度
	for (var i = 1; i < n; i++) {
		var tmp = MAX_PATH_LENGTH;
		var u = v;
		// 找出当前未使用的点j的dist[j]最小值
		for (var j = 0; j < n; j++) {
			if (!s[j] && parseInt(dist[j]) < tmp) {
				u = j; // u保存当前邻接点中距离最小的点的号码
				tmp = dist[j];
			}
		}

		s[u] = true; // 表示u点已存入S集合中
		// 更新dist
		for (var j = 0; j < n; j++) {
			if (!s[j] && parseInt(G[u][j]) < MAX_PATH_LENGTH) {
				var newdist = parseInt(dist[u]) + parseInt(G[u][j]);
				if (newdist < dist[j]) {
					dist[j] = newdist;
					prev[j] = u;
				}
			}
		}
	}
}

function MGraph() {
	this.arc = []; // 邻接矩阵，可看作边表
	this.numVertexes = null; //图中当前的顶点数
	this.numEdges = null; //图中当前的边数
}
var F = new MGraph(); //创建图使用

//创建图
function createMGraph() {
	F.numVertexes = nodeNum; //设置顶点数
	F.numEdges = pathNum; //设置边数
	//邻接矩阵初始化
	for (var i = 0; i < F.numVertexes; i++) {
		F.arc[i] = [];
		for (var j = 0; j < F.numVertexes; j++) {
			F.arc[i][j] = G[i][j]; //INFINITY; 
		}
	}
}

var Pathmatirx = []; //二维数组 表示对应顶点的最小路径的前驱矩阵
var ShortPathTable = []; //二维数组 表示顶点到顶点的最短路径权值和的矩阵
function Floyd() {
	for (var v = 0; v < F.numVertexes; ++v) { //初始化 Pathmatirx ShortPathTable
		Pathmatirx[v] = [];
		ShortPathTable[v] = [];
		for (var w = 0; w < F.numVertexes; ++w) {
			ShortPathTable[v][w] = F.arc[v][w];
			Pathmatirx[v][w] = -1;
		}
	}

	for (var k = 0; k < F.numVertexes; ++k) {
		for (var v = 0; v < F.numVertexes; ++v) {
			if (v != k) {
				for (var w = 0; w < F.numVertexes; ++w) {
					if (v != w && w != k) {
						if (ShortPathTable[v][w] > ShortPathTable[v][k] + ShortPathTable[k][w]) {
							ShortPathTable[v][w] = ShortPathTable[v][k] + ShortPathTable[k][w];
							Pathmatirx[v][w] = k;
						}
					}
				}
			}
		}
	}
}

//Dijkstra查找最短路径
function dij_searchPaths(Prev, v, u) {
	var que = new Array(); //保存最短路线
	var tot = 0;
	que[tot] = u;
	tot++;
	var tmp = Prev[u];
	while (tmp != v) {
		que[tot] = tmp;
		tot++;
		tmp = Prev[tmp];
	}
	que[tot] = v;


	return que;
}
var rlt_2 = new Array();

function flo_searchPaths(i, j) {
	if (Pathmatirx[i][j] == -1) {
		rlt_2.push(j + 1);
	} else {
		flo_searchPaths(i, Pathmatirx[i][j]);
		flo_searchPaths(Pathmatirx[i][j], j);
	}
}

//最短路径查询操作
function queryPaths() {
	//节点数小于2，则提示设置节点
	if (nodeNum < 2) {
		alert("请先设置结点和路径");
		return;
	}
	setOperationInfo("最短路径查询", START, END);
	$("queryrlt").style.display = "block";
	createMatrix();

	if ($("setalgo").value == "dijkstra") {
		Dijkstra(nodeNum, START - 1, G);
		if (dist[END - 1] == MAX_PATH_LENGTH) {
			$("minlength").innerHTML = "两结点之间没有线路";
			$("minpaths").innerHTML = "";
		} else {
			var rlt = dij_searchPaths(prev, START - 1, END - 1);

			$("minlength").innerHTML = dist[END - 1];
			can.beginPath();
			can.lineWidth = "3";
			can.strokeStyle = "rgb(0, 255, 0)";
			for (var i = rlt.length, j = 0; i > j; i--) {
				$("minpaths").innerHTML += parseInt(rlt[i - 1]) + 1 + ", ";
				if (i == rlt.length) {
					can.moveTo(sights[rlt[i - 1]].XPos, sights[rlt[i - 1]].YPos);
				} else {
					can.lineTo(sights[rlt[i - 1]].XPos, sights[rlt[i - 1]].YPos);
					can.moveTo(sights[rlt[i - 1]].XPos, sights[rlt[i - 1]].YPos);
				}
				can.stroke();
				can.closePath();
				//redrawNode();
			}
		}
	} else if ($("setalgo").value == "floyd") {
		createMGraph();
		Floyd();
		if (ShortPathTable[START - 1][END - 1] >= MAX_PATH_LENGTH) {
			$("minlength").innerHTML = "两结点之间没有线路";
			$("minpaths").innerHTML = "";
		} else {
			$("minlength").innerHTML = ShortPathTable[START - 1][END - 1];
			rlt_2.push(START);
			flo_searchPaths(START - 1, END - 1);

			can.beginPath();
			can.lineWidth = "3";
			can.strokeStyle = "rgb(0, 255, 0)";
			for (var i = 0; i < rlt_2.length; i++) {
				$("minpaths").innerHTML += rlt_2[i] + ", ";
				if (i == 0) {
					can.moveTo(sights[rlt_2[i] - 1].XPos, sights[rlt_2[i] - 1].YPos);
				} else {
					can.lineTo(sights[rlt_2[i] - 1].XPos, sights[rlt_2[i] - 1].YPos);
					can.moveTo(sights[rlt_2[i] - 1].XPos, sights[rlt_2[i] - 1].YPos);
				}
				can.stroke();
				can.closePath();
			}
		}
	} else {
		alert('请选择算法');
		return;
	}
}