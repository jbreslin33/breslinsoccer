extends KinematicBody

#state machine
var PlayerChaseState = load("res://player/PlayerChaseState.gd")
var StateMachine = load("res://fsm/StateMachine.gd")

var speed = 200
var direction = Vector3()
var gravity = -9.8
var velocity = Vector3()
var mStateMachine = 0
var mPlayerChaseState = 0


func _init():
	#state machine
	mStateMachine = StateMachine.new(self)
	mPlayerChaseState = PlayerChaseState.new()
	mStateMachine.setCurrentState(mPlayerChaseState)
	pass

func _ready():
	pass

func _physics_process(delta):
	direction = Vector3(0,0,0)
	if Input.is_action_pressed("ui_left"):
		direction.x -= 1
	if Input.is_action_pressed("ui_right"):
		direction.x += 1
	if Input.is_action_pressed("ui_up"):
		direction.z -= 1
	if Input.is_action_pressed("ui_down"):
		direction.z += 1

	direction = direction.normalized()
	direction = direction * speed * delta

	velocity.y += gravity * delta
	velocity.x = direction.x
	velocity.z = direction.z

	velocity = move_and_slide(velocity, Vector3(0,1,0))

#	# Called every frame. Delta is time since last frame.
#	# Update game logic here.
#	pass
	mStateMachine.update()
	#print("_physics_process)")


