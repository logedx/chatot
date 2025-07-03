import express from 'express'
import { Types } from 'mongoose'

import * as surmise from '../lib/surmise.js'
import * as detective from '../lib/detective.js'

import * as user_model from '../model/user.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as user_router from './user.js'
import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.get(
	'/weapp',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.运营,

			scope_model.Mode.系统,

		),

	),

	async function retrieves (req, res)
	{
		type Suspect = {
			closed?: detective.Expired

		}

		let segment = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)

		await suspect.infer_signed<'closed'>(
			surmise.Switch.is_expired.signed('closed'),

			{ quiet: true },

		)

		await segment.fit(suspect)

		let doc = await weapp_model.default
			.find(segment.find)
			.sort(segment.sort)
			.skip(segment.skip)
			.limit(segment.limit)

		res.json(doc)

	},

)

router.get(
	'/weapp/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.运营,

			scope_model.Mode.系统,

		),

	),

	retrieve_router.weapp,

	function retrieve (req, res)
	{
		res.json(req.weapp)

	},

)

router.put(
	'/weapp/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.运营,

			scope_model.Mode.系统,

		),

	),

	retrieve_router.weapp,

	async function update (req, res)
	{
		type Suspect = {
			secret: string
			mchid : string
			v3key : string

		}

		let doc = req.weapp!

		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer_signed<'secret'>(
			surmise.Text.required.signed('secret'),

		)

		await suspect.infer_signed<'mchid'>(
			surmise.Text.optional.signed('mchid'),


		)

		await suspect.infer_signed<'v3key'>(
			surmise.Text.optional.signed('v3key'),

		)


		await doc.updateOne(
			suspect.get(),

		)

		res.json()

	},

)

router.delete(
	'/weapp/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.运营,

			scope_model.Mode.系统,

		),

	),

	retrieve_router.weapp,

	async function delete_ (req, res)
	{
		let doc = req.weapp!
		let ctx = req.checkpoint!

		await ctx.hold(doc)
		await doc.deleteOne()

		res.json()

	},

)

router.get(
	'/weapp/:_id/user',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.运营,

			scope_model.Mode.系统,

		),

	),

	retrieve_router.weapp,

	async function retrieve_users (req, res)
	{
		type Suspect = {
			weapp: Types.ObjectId

			$or?: surmise.Keyword<user_model.TRawDocKeyword>

		}

		let weapp = req.weapp!._id

		let segment = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)

		await suspect.set('weapp', weapp)

		await suspect.infer_signed<'$or', 'keyword'>(
			user_router.in_keyword_surmise_chain.signed('keyword'),

			{ rename: '$or', quiet: true },

		)

		await segment.fit(suspect)

		let doc = await user_model.default
			.find(segment.find)
			.sort(segment.sort)
			.skip(segment.skip)
			.limit(segment.limit)

		res.json(doc)

	},

)
