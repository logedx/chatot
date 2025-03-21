/* eslint-disable @typescript-eslint/no-shadow */
import express from 'express'

import * as reply from '../lib/reply.js'

import * as user_model from '../model/user.js'
import * as stamp_model from '../model/stamp.js'
import * as token_model from '../model/token.js'
import * as weapp_model from '../model/weapp.js'





declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Request {
			weapp?: weapp_model.THydratedDocumentType

			user?: user_model.THydratedDocumentType

			stamp?: stamp_model.THydratedDocumentType


			usable_token?: token_model.THydratedDocumentType
			survive_token?: token_model.TSurviveHydratedDocumentType

		}


	}


}



export const weapp: express.RequestHandler = async function weapp(req, res, next) {
	let { _id } = req.params

	let doc = await weapp_model.default.findById(_id)


	reply.NotFound.asserts(doc, 'weapp')

	req.weapp = doc

	next()

}


export const user: express.RequestHandler = async function user(req, res, next) {
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await user_model.default
		.findOne(
			{ _id, weapp },

		)


	reply.NotFound.asserts(doc, 'user')

	req.user = doc

	next()

}


export const user_unsafe: express.RequestHandler = async function user(req, res, next) {
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await user_model.default
		.findOne(
			{ _id, weapp },

		)
		.select(
			['+wxopenid', '+wxsession', '+phone'],

		)


	reply.NotFound.asserts(doc, 'user')

	req.user = doc

	next()

}


export const stamp: express.RequestHandler = async function stamp(req, res, next) {
	let { value } = req.params

	let doc = await stamp_model.default
		.findOne(
			{ value },

		)


	reply.NotFound.asserts(doc, 'stamp')

	req.stamp = doc

	next()

}


export const usable_token: express.RequestHandler = async function usable_token(req, res, next) {
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default.findOne(
		{ value },

	)


	reply.NotFound.asserts(doc, 'token')

	req.usable_token = doc.to_usable()

	next()

}


export const survive_token: express.RequestHandler = async function survive_token(req, res, next) {
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default.findOne(
		{ value },

	)


	reply.NotFound.asserts(doc, 'token')

	req.survive_token = doc.to_survive()

	next()

}
