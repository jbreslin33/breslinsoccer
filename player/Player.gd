extends KinematicBody

# class member variables go here, for example:
# var a = 2
# var b = "textvar"
var speed = 200;
var direction = Vector3()
var gravity = -9.8
var velocity = Vector3()

var mBall = 0

func _ready():
	# Called when the node is added to the scene for the first time.
	# Initialization here.
	
	
	pass

#func _process(delta):
#	# Called every frame. Delta is time since last frame.
#	# Update game logic here.
#	pass

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
	
func setBall(b):
	mBall = b
	
func getBall():
	return mBall
	
		
