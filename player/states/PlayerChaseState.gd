extends "res://fsm/State.gd"
var SteeringBehaviors = load("res://steering/SteeringBehaviors.gd")


func _ready():
	pass

func _enter(player):
	player.mSteeringBehaviors.setSeek(true)
	player.isBallWithingKickingRange()
	
func _execute(player):
	pass
	
func _exit(player):
	
	pass
