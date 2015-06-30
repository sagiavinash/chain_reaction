<?php 
	$gid = $_GET["gid"];
	$pid = $_GET["pid"];
	$move = $_GET["move"];
	$time = $_GET["time"];
	$file = fopen("transfers/game_".$gid."_".$pid.".json", "w") or die("0");
	fwrite($file, "{\"move\":".$move.",\"time\":".$time."}");
	fclose($file);
?>
