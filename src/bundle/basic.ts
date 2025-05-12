import express from 'express'

import * as app from '../app.js'

import * as user from '../router/user.js'
import * as media from '../router/media.js'
import * as scope from '../router/scope.js'
import * as stamp from '../router/stamp.js'
import * as token from '../router/token.js'
import * as weapp from '../router/weapp.js'
import * as keyword from '../router/keyword.js'


const bundle: app.HandlerBundle = [
	user.router,
	media.router,
	scope.router,
	stamp.router,
	token.router,
	weapp.router,
	keyword.router,

]


export default bundle

export function create_app(...handler: app.HandlerBundle): express.Application {
	return app.create(...handler, ...bundle)

}