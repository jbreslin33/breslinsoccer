extends Node

var mCurrentState = 0
var mOwner = 0
func _init(owner):
	mOwner = owner

func setCurrentOwner(owner):
	mOwner = owner

func setCurrentState(state):
	mCurrentState = state
	pass

func update():
	if (mCurrentState):
		mCurrentState.Execute(mOwner)
	
	pass
