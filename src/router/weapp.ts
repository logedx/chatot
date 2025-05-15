import express from 'express'
import { Types } from 'mongoose'

import * as evidence from '../lib/evidence.js'
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

	async function retrieve_pagination(req, res) {
		type Suspect = {
			closed?: detective.Expired

		}

		let pagin = evidence.pagination<Suspect>()
		let suspect = evidence.suspect<Suspect>(req.query)

		await suspect.infer_signed<'closed'>(
			evidence.Switch.is_expired.signed('closed'),

			{ quiet: true },

		)

		await pagin.linker(suspect)

		let doc = await weapp_model.default
			.find(pagin.find)
			.sort(pagin.sort)
			.skip(pagin.skip)
			.limit(pagin.limit)

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

	function retrieve(req, res) {
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

	async function update(req, res) {
		type Suspect = {
			secret: string
			mchid: string
			v3key: string

		}

		let doc = req.weapp!

		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'secret'>(
			evidence.Text.required.signed('secret'),

		)

		await suspect.infer_signed<'mchid'>(
			evidence.Text.optional.signed('mchid'),


		)

		await suspect.infer_signed<'v3key'>(
			evidence.Text.optional.signed('v3key'),

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

	async function delete_(req, res) {
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

	async function retrieve_user_pagination(req, res) {
		type Suspect = {
			$or?: evidence.Keyword<user_model.TRawDocKeyword>

			weapp: Types.ObjectId

		}

		let weapp = req.weapp!._id

		let pagin = evidence.pagination<Suspect>()
		let suspect = evidence.suspect<Suspect>(req.query)

		await suspect.infer_signed<'$or', 'keyword'>(
			user_router.in_keyword_evidence_chain.signed('keyword'),

			{ rename: '$or', quiet: true },

		)

		await suspect.set('weapp', weapp)

		await pagin.linker(suspect)

		let doc = await user_model.default
			.find(pagin.find)
			.sort(pagin.sort)
			.skip(pagin.skip)
			.limit(pagin.limit)

		res.json(doc)

	},

)