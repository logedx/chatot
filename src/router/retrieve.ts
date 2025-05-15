/* eslint-disable @typescript-eslint/no-shadow */
import express from 'express'

import * as reply from '../lib/reply.js'

import * as user_model from '../model/user.js'
import * as scope_model from '../model/scope.js'
import * as stamp_model from '../model/stamp.js'
import * as token_model from '../model/token.js'
import * as weapp_model from '../model/weapp.js'
import * as keyword_model from '../model/keyword.js'
import * as checkpoint_model from '../model/checkpoint.js'





declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Request {
			weapp?: weapp_model.THydratedDocumentType

			user?: user_model.THydratedDocumentType
			user_scope?: scope_model.THydratedDocumentType

			keyword?: keyword_model.THydratedDocumentType

			stamp?: stamp_model.THydratedDocumentType
			checkpoint?: checkpoint_model.THydratedDocumentType


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


export const user_scope: express.RequestHandler = async function user_scope(req, res, next) {
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await user_model.default
		.findOne(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ _id, weapp, 'scope.lock': false },

		)
		.select<
			Required<Pick<user_model.THydratedDocumentType, 'scope'>>

		>(
			['+scope'],

		)


	reply.NotFound.asserts(doc, 'user')
	reply.NotFound.asserts(doc.scope, 'scope')

	req.user_scope = doc.scope

	next()

}


export const keyword: express.RequestHandler = async function keyword(req, res, next) {
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await keyword_model.default
		.findOne(
			{ _id, weapp },

		)


	reply.NotFound.asserts(doc, 'keyword')

	req.keyword = doc

	next()

}


export const stamp: express.RequestHandler = async function stamp(req, res, next) {
	let { _id } = req.params

	let doc = await stamp_model.default
		.findOne(
			{ _id, expire: { $gte: new Date() } },

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
