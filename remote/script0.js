var gridSize = 9;
$(document).ready(function() {
	var x, y,
		isGridActive = true,
		gid, pid, opid,
		opponentMove = false;

	function poll_opponent_move() {
		poll_opponent_move.counter = poll_opponent_move.counter || 0;
		$.ajax({
			"url" : "/labs/chain_reaction/remote/transfers/game_" + gid + "_" + opid + ".json",
			"type" : "GET",
			"dataType" : "json"
		}).done(function(response) {
			if (response && response.time !== poll_opponent_move.old) {
				isGridActive = true;
				$("#grid").attr("isActive", 1);
				poll_opponent_move.counter = 0;
				opponentMove = true;
				poll_opponent_move.old = response.time;
				$boxes.eq(response.move).click();
			} else {
				poll_opponent_move.counter++;
				setTimeout(poll_opponent_move, 1000);
				if (poll_opponent_move.counter > 120) {
					//alert("Your opponent is idle! Please ask him to make his move!");
				}
			}
		}).fail(function() {
			setTimeout(poll_opponent_move, 1000);
		}).always(function(){
			console.log("ajax");
		});
	}

	function record_move(boxIndex){
		$.ajax({
			url: "/labs/chain_reaction/remote/api.php",
			type : "GET",
			data : {
				"gid" : gid,
				"pid" : pid,
				"move" : boxIndex,
				"time" : +new Date()
			}
		}).done(function() {
			poll_opponent_move();
		});
	}

	$(".popup.popup--game-start .popup-link").on("click", function() {
		var action = $(this).data("action");
		if (action == "start") {
			gid = +new Date();
			pid = 1; opid = 2;
			window.location.hash = "gid=" + gid + "&pid=" + pid;
		} else {
			var QS = (function(a) {
		        if (a === "")
		            return {};
		        var b = {};
		        for (var i = 0; i < a.length; ++i) {
		            var p = a[i].split('=');
		            if (p.length != 2)
		                continue;
		            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		        }
		        return b;
		    })(window.location.hash.substr(1).split('&'));
		    gid = QS.gid;
			pid = 2; opid = 1;
			window.location.hash = "gid=" + gid + "&pid=" + pid;
		    poll_opponent_move();
		}
		$(".popup.popup--game-start, .popup-bg").hide();
		return false;
	});

	$boxes = $("#grid").find(".box");

	function index2coords(index) {
		return {
			"x": (index % gridSize),
			"y": Math.floor(index / gridSize)
		};
	}

	function coords2index(x, y) {
		return (y * gridSize) + x;
	}

	(function preprocessGrid() {
		$boxes.each(function(i) {
			var $box = $(this);
			coords = index2coords(i);
			if ((coords.x === 0 || coords.x === (gridSize - 1)) && (coords.y === 0 || coords.y === (gridSize - 1))) {
				$box.data("split", 2);
			} else if (coords.x === 0 || coords.x === (gridSize - 1) || coords.y === 0 || coords.y === (gridSize - 1)) {
				$box.data("split", 3);
			} else {
				$box.data("split", 4);
			}
		});
	}());

	$boxes.on("click", (function() {
		var currentplayer = 0,
			firstTurn = true,
			validTurn = false,
			matchWon = false;

		function updateCell(boxIndex, currentplayer) {
			var $box = $boxes.eq(boxIndex);
			if ($box.attr("player") === undefined || $box.attr("player") === String(currentplayer)) {
				$box.attr("player", currentplayer);
				validTurn = true;
			} else if ($box.attr("player") !== String(currentplayer)) {
				alert("cell occupied by you opponent");
				return;
			}

			oldValue = $box.text();
			newValue = (Number(oldValue) + 1) % $box.data("split") || "";
			$box.text(newValue);
			if (newValue === "") {
				isGridActive = false;
				$("#grid").attr("isActive", 0);
				setTimeout(function() {
					chainReaction(boxIndex, currentplayer);
				}, 500);
			}
			checkForWinner();
		}

		function getAdjCells(index) {
			var adjCells = [],
				coords = index2coords(index);
			if (coords.y > 0) {
				adjCells.push(coords2index(coords.x, coords.y - 1));
			}
			if (coords.x < (gridSize - 1)) {
				adjCells.push(coords2index(coords.x + 1, coords.y));
			}
			if (coords.y < (gridSize - 1)) {
				adjCells.push(coords2index(coords.x, coords.y + 1));
			}
			if (coords.x > 0) {
				adjCells.push(coords2index(coords.x - 1, coords.y));
			}
			return adjCells;
		}

		function chainReaction(boxIndex, currentplayer) {
			var $box = $boxes.eq(boxIndex),
				adjCells = getAdjCells(boxIndex);
			if ($box.text() === "") {
				$box.removeAttr("player");
			}
			$.each(adjCells, function(key, i) {
				var $adjCell = $boxes.eq(i);
				$adjCell.attr("player", currentplayer);
				updateCell(i, currentplayer);
			});
		}

		function checkForWinner() {
			if (!matchWon) {
				if(!firstTurn) {
					$.each([0, 1], function(key, i) {
						if ($boxes.filter("[player='" + i + "']").length === 0) {
							$(".current-player .player-color").attr("player", (i ? 0 : 1));
							$(".current-player .player-name").html("Player " + (i ? 1 : 2) + " Wins!");
							matchWon = true;
							$boxes.off("click");
							alert("Player " + (i ? 1 : 2) + " Wins!");
						}
					});
				}
				if (validTurn) {
					currentplayer = (currentplayer + 1) % 2;
					$(".current-player .player-color").attr("player", currentplayer);
					$(".current-player .player-name").html("Player " + (currentplayer + 1) + "'s Turn");
					validTurn = false;
					firstTurn = false;
				}	
			}
			if (opponentMove) {
				opponentMove = false;
				isGridActive = true;
				$("#grid").attr("isActive", 1);
			} else {
				record_move(boxIndex);
				isGridActive = false;
				$("#grid").attr("isActive", 0);
			}
		}

		return function() {
			if (isGridActive) {
				var $box = $(this),
					boxIndex = $boxes.index($box),
					x, y, oldValue, newValue;
				updateCell(boxIndex, currentplayer);
			} else {
				alert("Please wait! Player " + opid + "'s Turn!");
			}
		}
	}()));
});