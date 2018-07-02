extends Node

var mPlayer = 0
var mBall = 0
var mSteeringForce = Vector3(0,0,0) 
var mTarget = Vector3(0,0,0)

var mInterposeDistance = 0
var mMultSeparation = 0

var mSeek = false 
var mArrive = false 
var mSeparation = false 
var mPursuit = false
var mInterpose = false

var mTagged = false

var mDeceleration = 1

func _init(player):
        mPlayer = player

func seek(target):
        mTarget = target

func zeroSteeringForce():
	mSteeringForce.x = 0;
	mSteeringForce.y = 0;
	mSteeringForce.z = 0;

func calculate():
	zeroSteeringForce()

#set gets
func setSeek(b):
	print("setSeek true")
	mSeek = b

func setArrive(b):
	mArrive = b

func setSeparation(b):
	mSeparation = b

func setPursuit(b):
	mPursuit = b

func setInterpose(b):
	mInterpose = b

func getSeek():
	return mSeek

func getArrive():
	return mArrive

func getSeparation():
	return mSeparation

func getPursuit():
	return mPursuit

func getInterpose():
	return mInterpose


