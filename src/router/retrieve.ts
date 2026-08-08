/* eslint-disable @typescript-eslint/no-shadow */
import express from 'express'
import mongoose from 'mongoose'


import * as reply from '../lib/reply.js'

import * as oss_store from '../store/oss.js'
import * as database_store from '../store/database.js'

import * as user_model from '../model/user.js'
import * as scope_model from '../model/scope.js'
import * as stamp_model from '../model/stamp.js'
import * as token_model from '../model/token.js'
import * as weapp_model from '../model/weapp.js'
import * as keyword_model from '../model/keyword.js'
import * as checkpoint_model from '../model/checkpoint.js'





declare global
{
	namespace Express
	{
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Request
		{
			xapp? : null | mongoose.Types.ObjectId
			weapp?: weapp_model.Default.Document

			user?      : user_model.Default.Document
			user_scope?: scope_model.Default.Document

			keyword?: keyword_model.Default.Document

			stamp?     : stamp_model.Default.Document
			checkpoint?: checkpoint_model.Default.Document


			token?        : token_model.Default.Document
			usable_token? : token_model.Default.Document
			deposit_token?: token_model.Deposit.Document
			survive_token?: token_model.Survive.Document

			oss?: oss_store.OSS

		}


	}


}


export const xapp: express.RequestHandler = async function xapp (req, res, next)
{
	let appid = req.get('X-App') ?? ''

	let doc = await weapp_model.default
		.findOne(
			{ appid },

		)

	req.xapp = doc?._id ?? null

	next()

}

export const weapp: express.RequestHandler = async function weapp (req, res, next)
{
	let { _id } = req.params

	let appid = req.get('X-App') ?? ''

	let doc = await weapp_model.default
		.findOne(
			{ _id, appid },

		)

	reply.NotFound.asserts(doc, 'weapp is not found')

	req.weapp = doc

	next()

}


export const user: express.RequestHandler = async function user (req, res, next)
{
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await user_model.default
		.findOne(
			{ _id, weapp },

		)


	reply.NotFound.asserts(doc, 'user is not found')

	req.user = doc

	next()

}


export const user_scope: express.RequestHandler = async function user_scope (req, res, next)
{
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await user_model.default
		.findOne(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ _id, weapp, 'scope.lock': false },

		)

	reply.NotFound.asserts(doc, 'user is not found')
	reply.NotFound.asserts(doc.scope, 'scope is not found')

	req.user_scope = doc.scope.value as unknown as scope_model.Default.Document

	next()

}


export const keyword: express.RequestHandler = async function keyword (req, res, next)
{
	let { _id } = req.params
	let { weapp } = req.survive_token!

	let doc = await keyword_model.default
		.findOne(
			{ _id, weapp },

		)


	reply.NotFound.asserts(doc, 'keyword is not found')

	req.keyword = doc

	next()

}


export const stamp: express.RequestHandler = async function stamp (req, res, next)
{
	let { _id } = req.params

	let doc = await stamp_model.default
		.findOne(
			{ _id, expire: { $gte: new Date() } },

		)


	reply.NotFound.asserts(doc, 'stamp is not found')

	req.stamp = doc

	next()

}


export const token: express.RequestHandler = async function token (req, res, next)
{
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default
		.findOne(
			{ value: new database_store.Sensitive(value) },

		)


	reply.NotFound.asserts(doc, 'token is not found')

	req.token = doc

	next()

}


export const usable_token: express.RequestHandler = async function usable_token (req, res, next)
{
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default
		.findOne(
			{ value: new database_store.Sensitive(value) },

		)

	if (doc?.is_usable !== true)
	{
		throw new reply.NotFound('authentication failed')

	}


	req.usable_token = doc

	next()

}


export const deposit_token: express.RequestHandler = async function deposit_token (req, res, next)
{
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default
		.findOne<token_model.Deposit.Document>(
			{ value: new database_store.Sensitive(value) },

		)

	if (doc?.is_deposit !== true)
	{
		throw new reply.NotFound('authentication failed')

	}

	req.deposit_token = doc


	next()

}


export const survive_token: express.RequestHandler = async function survive_token (req, res, next)
{
	let authorization = req.get('Authorization') ?? ''

	let [, value] = authorization.split(' ')


	let doc = await token_model.default
		.findOne<token_model.Survive.Document>(
			{ value: value as unknown as database_store.Sensitive<string> },

		)

	if (doc?.is_survive !== true)
	{
		throw new reply.NotFound('authentication failed')

	}


	req.deposit_token = doc
	req.survive_token = doc


	next()

}


export const oss: express.RequestHandler = async function oss (req, res, next)
{
	let doc = await req.deposit_token!.to_weapp()

	req.oss = doc.to_oss()

	next()

}
