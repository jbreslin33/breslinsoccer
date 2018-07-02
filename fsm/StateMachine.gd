extends Node

var mOwner = 0
var mCurrentState = 0
var mPreviousState = 0;
var mGlobalState = 0;

func _init(owner):
	mOwner = owner

func setCurrentState(state):
	mCurrentState = state

func setGlobalState(state):
	mGlobalState = state

func setPreviousState(state):
	mPreviousState = state

func setOwner(owner):
	mOwner = owner

func update():
	if (mGlobalState):
		mGlobalState._execute(mOwner)

	if (mCurrentState):
		mCurrentState._execute(mOwner)
		
func changeState(state):
	if (mCurrentState):
		mCurrentState._exit(mOwner)
	
	mPreviousState = mCurrentState

	mCurrentState = state
	if (mCurrentState):
		mCurrentState._enter(mOwner)

func isInState(state):
	if (state == mCurrentState):
		return true
	else:
		return false

func getCurrentState():
	return mCurrentState


