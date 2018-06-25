extends Node

var mPlayer = 0
var mBall = 0
var mSteeringForce = 0
var mTarget = 0
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
