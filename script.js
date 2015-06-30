var gridSize = 9;
$(document).ready(function() {
	var x, y;
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
			matchWon = false,
			isGridActive = true;

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
				setTimeout(function() {
					chainReaction(boxIndex, currentplayer);
				}, 500);
			}
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
			setTimeout(checkForWinner, 500);
			
		}

		function checkForWinner() {
			isGridActive = true;
			if (!firstTurn && !matchWon) {
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
		}

		return function() {
			if (isGridActive) {
				var $box = $(this),
					boxIndex = $boxes.index($box),
					x, y, oldValue, newValue;

				updateCell(boxIndex, currentplayer);

				if (validTurn && !matchWon) {
					currentplayer = (currentplayer + 1) % 2;
					$(".current-player .player-color").attr("player", currentplayer);
					$(".current-player .player-name").html("Player " + (currentplayer + 1) + "'s Turn");
					validTurn = false;
					firstTurn = false;
				}
			}
		}
	}()));
});