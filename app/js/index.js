var tools = Object.create(null);

tools.pencil = function(event, cx, onEnd) {
	cx.lineCap = "round";

	var pos = relativePos(event, cx.canvas);
	trackDrag(function(event) {
		cx.beginPath();
		cx.moveTo(pos.x, pos.y);
		pos = relativePos(event, cx.canvas);
		cx.lineTo(pos.x, pos.y);
		cx.stroke();
	}, onEnd);
};

tools.line = function(event, cx) {
	var dcv = document.getElementById("dcv");
	dcv.style["z-index"] = 0;

	var dcx = dcv.getContext("2d");
	dcx.lineWidth = document.getElementById("size").value;
	dcx.fillStyle = document.getElementById("picker").value;
	dcx.strokeStyle = document.getElementById("picker").value;
	cx.lineWidth = dcx.lineWidth;
	cx.fillStyle = dcx.fillStyle;
	cx.strokeStyle = dcx.strokeStyle;

	var relativeStart = relativePos(event, cx.canvas);

	trackDrag(function(event) {
		dcx.clearRect(0, 0, dcv.width, dcv.height);
		dcx.beginPath();
		dcx.moveTo(relativeStart.x, relativeStart.y);
		dcx.lineTo(relativePos(event, dcv).x, relativePos(event, dcv).y);
		dcx.stroke();
		dcx.closePath();
	}, function(event) {
		cx.beginPath();
		cx.moveTo(relativeStart.x, relativeStart.y);
		cx.lineTo(relativePos(event, dcv).x, relativePos(event, dcv).y);
		cx.stroke();
		cx.closePath();
		dcx.clearRect(0, 0, dcv.width, dcv.height);
		dcv.style["z-index"] = -1;
	});
};

tools.erase = function(event, cx) {
	cx.globalCompositeOperation = "destination-out";
	tools.pencil(event, cx, function() {
		cx.globalCompositeOperation = "source-over";
	});
};

tools.text = function(event, cx) {
	var text = prompt("Text:", "");
	if (text) {
		var pos = relativePos(event, cx.canvas);
		cx.font = Math.max(12, cx.lineWidth) + "px sans-serif";
		cx.fillText(text, pos.x, pos.y);
	}
};

tools.spray = function(event, cx) {
	var radius = cx.lineWidth / 2;
	var area = radius * radius * Math.PI;
	var dotsPerTick = Math.ceil(area / 30);

	var currentPos = relativePos(event, cx.canvas);
	var spray = setInterval(function() {
		for (var i = 0; i < dotsPerTick; ++i) {
			var offset = randomPointInRadius(radius);
			cx.fillRect(currentPos.x + offset.x,
						currentPos.y + offset.y, 1, 1);
		}
	}, 25);
	trackDrag(function(event) {
		currentPos = relativePos(event, cx.canvas);
	}, function() {
		clearInterval(spray);
	});
};

tools.fill = function(event, cx) {
	var startPos = relativePos(event, cx.canvas);
	var data = cx.getImageData(0, 0, cx.canvas.width, cx.canvas.height);
	var alreadyFilled = new Array(data.width * data.height);

	var workList = [startPos];
	while (workList.length) {
		var pos = workList.pop();
		var offset = pos.x + data.width * pos.y;
		if (alreadyFilled[offset]) continue;

		cx.fillRect(pos.x, pos.y, 1, 1);
		alreadyFilled[offset] = true;

		forAllNeighbors(pos, function(neighbor) {
			if (neighbor.x >= 0 && neighbor.x < data.width &&
				neighbor.y >= 0 && neighbor.y < data.height &&
				isSameColor(data, startPos, neighbor))
					workList.push(neighbor);
		});
	}
};

tools.rectangle = function(event, cx) {
	var relativeStart = relativePos(event, cx.canvas);
	var pageStart = {x : event.pageX, y : event.pageY};

	var trackingNode = document.createElement("div");
	trackingNode.style.position = "absolute";
	trackingNode.style.background = cx.fillStyle;
	document.body.appendChild(trackingNode);

	trackDrag(function(event) {
		var rect = rectangleFrom(pageStart, {x : event.pageX, y : event.pageY});
		trackingNode.style.left = rect.left + "px";
		trackingNode.style.top = rect.top + "px";
		trackingNode.style.width = rect.width + "px";
		trackingNode.style.height = rect.height + "px";
	}, function(event) {
		var rect = rectangleFrom(relativeStart, relativePos(event, cx.canvas));
		cx.fillRect(rect.left, rect.top, rect.width, rect.height);
		document.body.removeChild(trackingNode);
	});
};

tools.circle = function(event, cx) {
	var dcv = document.getElementById("dcv");
	dcv.style["z-index"] = 0;

	var dcx = dcv.getContext("2d");
	dcx.lineWidth = document.getElementById("size").value;
	dcx.fillStyle = document.getElementById("picker").value;
	dcx.strokeStyle = document.getElementById("picker").value;
	cx.lineWidth = dcx.lineWidth;
	cx.fillStyle = dcx.fillStyle;
	cx.strokeStyle = dcx.strokeStyle;

	var relativeStart = relativePos(event, cx.canvas);

	trackDrag(function(event) {
		dcx.clearRect(0, 0, dcv.width, dcv.height);
		var radiusX = (relativePos(event, dcv).x - relativeStart.x) * 0.5;
		var radiusY = (relativePos(event, dcv).y - relativeStart.y) * 0.5;
		var centerX = relativeStart.x + radiusX;
		var centerY = relativeStart.y + radiusY;
		var step = 0.01;
		var a = step;
		var pi2 = Math.PI * 2 - step;

		dcx.beginPath();
		dcx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
		for (; a < pi2; a += step) {
			dcx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
		}
		dcx.stroke();
		dcx.closePath();
	}, function(event) {
		var radiusX = (relativePos(event, dcv).x - relativeStart.x) * 0.5;
		var radiusY = (relativePos(event, dcv).y - relativeStart.y) * 0.5;
		var centerX = relativeStart.x + radiusX;
		var centerY = relativeStart.y + radiusY;
		var step = 0.01;
		var a = step;
		var pi2 = Math.PI * 2 - step;

		cx.beginPath();
		cx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
		for (; a < pi2; a += step) {
			cx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
		}
		cx.stroke();
		cx.closePath();
		dcx.clearRect(0, 0, dcv.width, dcv.height);
		dcv.style["z-index"] = -1;
	});
};

tools.picker = function(cx) {
	var color = document.getElementById("picker");
	color.addEventListener("change", function() {
		cx.fillStyle = color.value;
		cx.strokeStyle = color.value;
	});
}

tools.size = function(cx) {
	var size = document.getElementById("size");
	size.addEventListener("change", function() {
		cx.lineWidth = size.value;
	});
}

tools.open_file = function(cx) {
	var open = document.getElementById("open_file");
	open.addEventListener("change", function() {
		if (open.files.length == 0) return;
		var reader = new FileReader();
		reader.addEventListener("load", function() {
			loadImageURL(cx, reader.result);
		});
		reader.readAsDataURL(open.files[0]);
	});
};

tools.save_file = function(cx) {
	var link = document.getElementById("save_file");
	function update() {
		try {
			link.href = cx.canvas.toDataURL();
			var tab = window.open("about:blank", "name");
			tab.open(link.href, "name");
		} catch (e) {
			if (e instanceof SecurityError)
				link.href = "javascript:alert(" + JSON.stringify("Can't save: " + e.toString()) + ")";
			else
				throw e;
		}
	}
	link.addEventListener("mousedown", update);
};

function relativePos(event, element) {
	var rect = element.getBoundingClientRect();
	return {x : Math.floor(event.clientX - rect.left),
			y : Math.floor(event.clientY - rect.top)};
}

function trackDrag(onMove, onEnd) {
	function end(event) {
		removeEventListener("mousemove", onMove);
		removeEventListener("mouseup", end);
		if (onEnd)
			onEnd(event);
	}
	addEventListener("mousemove", onMove);
	addEventListener("mouseup", end);
}

function randomPointInRadius(radius) {
	for (;;) {
		var x = Math.random() * 2 - 1;
		var y = Math.random() * 2 - 1;
		if (x * x + y * y <= 1)
			return {x : x * radius, y : y * radius};
	}
}

function forAllNeighbors(point, fn) {
	fn({x : point.x, y : point.y + 1});
	fn({x : point.x, y : point.y - 1});
	fn({x : point.x + 1, y : point.y});
	fn({x : point.x - 1, y : point.y});
}

function isSameColor(data, pos1, pos2) {
	var offset1 = (pos1.x + pos1.y * data.width) * 4;
	var offset2 = (pos2.x + pos2.y * data.width) * 4;
	for (var i = 0; i < 4; ++i) {
		if (data.data[offset1 + i] != data.data[offset2 + i])
			return false;
	}
	return true;
}

function rectangleFrom(a, b) {
	return {
		left : Math.min(a.x, b.x),
		top : Math.min(a.y,	b.y),
		width : Math.abs(a.x - b.x),
		height : Math.abs(a.y - b.y)
	};
}

function loadImageURL(cx, url) {
	var image = document.createElement("img");
	image.addEventListener("load", function() {
		var color = cx.fillStyle, size = cx.lineWidth;
		image.width = cx.canvas.width;
		image.height = cx.canvas.height;
		cx.drawImage(image, 0, 0);
		cx.fillStyle = color;
		cx.strokeStyle = color;
		cx.lineWidth = size;
	});
	image.src = url;
}

function scribble() {
	var cx = document.getElementById("cv").getContext("2d");
	cx.canvas.addEventListener("mousedown", function(event) {
		for (var tool in tools) {
			var input = document.getElementById(tool);

			if (input) {
				if (input.type != "radio")
					tools[tool](cx);

				else if (input.checked) {
					tools[tool](event, cx);
					event.preventDefault();
				}
			}
		}
	});
	tools["open_file"](cx);
	tools["size"](cx);
	tools["save_file"](cx);
}

scribble();

