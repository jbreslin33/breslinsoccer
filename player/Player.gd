extends KinematicBody

#state machine
var PlayerChaseState = load("res://player/PlayerChaseState.gd")
var StateMachine = load("res://fsm/StateMachine.gd")

var SteeringBehaviors = load("res://player/SteeringBehaviors.gd")

var speed = 400
var direction = Vector3()
var gravity = -9.8
var velocity = Vector3()
var mStateMachine = 0
var mPlayerChaseState = 0

var mSteeringBehaviors = 0


func _init():
	#state machine
	mStateMachine = StateMachine.new(self)
	mPlayerChaseState = PlayerChaseState.new()
	mStateMachine.setCurrentState(mPlayerChaseState)
	

	mSteeringBehaviors = SteeringBehaviors.new(self)
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

	mStateMachine.update()
	mSteeringBehaviors.calculate()
