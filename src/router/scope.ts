import express from 'express'

import * as reply from '../lib/reply.js'
import * as surmise from '../lib/surmise.js'

import * as user_model from '../model/user.js'
import * as token_model from '../model/token.js'
import * as scope_model from '../model/scope.js'
import * as stamp_model from '../model/stamp.js'

import * as token_router from './token.js'
import * as stamp_router from './stamp.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.options(
	'/scope',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	stamp_router.symbol_encrypt('/scope', 'post'),

)

router.post(
	'/scope',

	retrieve_router.survive_token,

	async function create (req, res)
	{
		type Suspect = {
			value: stamp_model.THydratedDocumentType

		}

		let { user } = req.survive_token!
		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer<'value'>(
			stamp_router.symbol_clue('/scope', 'post').signed('value'),

		)


		let doc = await user_model.default
			.findById(user)
			.select('+scope')


		reply.NotFound.asserts(doc, 'user is not found')

		await doc.authorize()

		res.json()


	},

)


router.get(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user_scope,

	function retrieve (req, res)
	{
		res.json(req.user_scope)

	},

)

router.put(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user_scope,

	async function update (req, res)
	{
		type Suspect = {
			value? : number
			expire?: Date

		}


		let doc = req.user_scope!

		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer_optional<'value'>(
			surmise.Digital.is_natural
				.to(
					v => v & scope_model.pick(v, scope_model.Mode.普通, scope_model.Mode.管理),

				)
				.signed('value'),

		)

		await suspect.infer_optional<'expire'>(
			surmise.Text.is_date.signed('expire'),

		)


		suspect.inject(doc)

		await doc.$parent()!.save()

		await token_model.default.findOneAndUpdate(
			{ user: doc._id },

			{ scope: doc.value },

		)

		res.json()


	},

)

router.delete(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	async function delete_ (req, res)
	{
		let { _id } = req.params
		let { weapp } = req.survive_token!

		let ctx = req.checkpoint!

		let doc = await user_model.default.findOneAndUpdate(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ _id, weapp, 'scope.lock': false },

			{ scope: null },

		)


		reply.NotFound.asserts(doc, 'user is not found')

		await ctx.hold(doc.scope)
		await token_model.default.findOneAndUpdate(
			{ user: _id },

			{ scope: 0 },

		)


		res.json()

	},

)
