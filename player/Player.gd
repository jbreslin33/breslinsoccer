extends KinematicBody

#state machine
var PlayerChaseState = load("res://player/states/PlayerChaseState.gd")
var StateMachine = load("res://fsm/StateMachine.gd")

var SteeringBehaviors = load("res://steering/SteeringBehaviors.gd")

var speed = 400
var direction = Vector3()
var gravity = -9.8
var velocity = Vector3()
var mStateMachine = 0
var mPlayerChaseState = 0

var mSteeringBehaviors = 0

var mBall = 0



func _init():
	pass

func _ready():
	
	#steering
	mSteeringBehaviors = SteeringBehaviors.new(self)
	
	#state machine
	mStateMachine = StateMachine.new(self)
	mPlayerChaseState = PlayerChaseState.new()
	mStateMachine.changeState(mPlayerChaseState)
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
	
func setBall(ball):
	print("set yo Ball")
	mBall = ball
	#mBall.getVelocity()
	
func getBall():
	return mBall

func isBallWithingKickingRange():
	if (!mBall):
		return
	
	
	print("isBall")
	#var p3D = Position3D;
	#var ballP3D = $Ball.Position3D
	#var ball = get_node("/root/ball/Ball")
	#var ballP3D = ball.Position3D
	var a = get_translation()
	#var b = mBall.get_translation()
	print("my x:",a.x)
	print("ball velocity",mBall.getVelocity().x)
	print("about to deal with ball")
	#mBall.callThisFunction()
	#var b = mBall.get_translation()
	
	#var distanceFromBall = distance_squared_to(get_translation(),mBall.get_translation())
	#print("distanceFromBall:",distanceFromBall)
