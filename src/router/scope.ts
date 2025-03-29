import express from 'express'
import { Types } from 'mongoose'

import * as reply from '../lib/reply.js'
import * as evidence from '../lib/evidence.js'
import * as detective from '../lib/detective.js'

import * as user_model from '../model/user.js'
import * as token_model from '../model/token.js'
import * as scope_model from '../model/scope.js'
import * as stamp_model from '../model/stamp.js'

import * as user_router from './user.js'
import * as token_router from './token.js'
import * as stamp_router from './stamp.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.options(
	'/scope',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	stamp_router.symbol_encrypt('/scope#post'),

)

router.post(
	'/scope',

	retrieve_router.survive_token,

	async function create(req, res) {
		type Suspect = {
			value: stamp_model.TRawDocType['amber']

		}

		let { user } = req.survive_token!
		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'value'>(
			stamp_router.symbol_evidence_chain('/scope#post').signed('value'),

		)


		let doc = await user_model.default.findById(user)


		reply.NotFound.asserts(doc, 'user')

		if (doc.scope) {
			doc.scope.value = scope_model.mixed(
				doc.scope.value,

				scope_model.Role.运营,

			)

		}

		else {
			doc.scope = { value: scope_model.Role.运营 } as scope_model.THydratedDocumentType

		}

		await doc.save()

		await token_model.default.findOneAndUpdate(
			{ user },

			{ scope: doc.scope.value },

		)

		res.json()


	},

)

router.post(
	'/scope/:_id/delay',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user_scope,

	async function create_delay(req, res) {
		type Suspect = {
			days: number

		}

		let doc = req.user_scope!

		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'days'>(
			evidence.Digital.is_natural.signed('days'),

		)

		await doc.delay(
			suspect.get('days'),

		)

		res.json()


	},

)


router.get(
	'/scope',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	async function retrieve_pagination(req, res) {
		type Suspect = {
			$or?: evidence.Keyword<user_model.TRawDocKeyword>

			// eslint-disable-next-line @typescript-eslint/naming-convention
			'scope.expired'?: detective.Expired

			weapp: Types.ObjectId

			// eslint-disable-next-line @typescript-eslint/naming-convention
			'scope.lock': false

		}

		let { weapp } = req.survive_token!

		let pagin = evidence.pagination<Suspect>()
		let suspect = evidence.suspect<Suspect>(req.query)


		await suspect.infer_signed<'$or', 'keyword'>(
			user_router.in_keyword_evidence_chain.signed('keyword'),

			{ rename: '$or', quiet: true },

		)

		await suspect.infer_signed<'scope.expired', 'expired'>(
			evidence.Switch.is_expired.signed('expired'),

			{ rename: 'scope.expired', quiet: true },

		)

		await suspect.set('weapp', weapp)
		await suspect.set('scope.lock', false)


		await pagin.linker(suspect)

		let doc = await user_model.default
			.find(pagin.find)
			.select('+scope')
			.sort(pagin.sort)
			.skip(pagin.skip)
			.limit(pagin.limit)

		res.json(doc)


	},

)

router.get(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user_scope,

	function retrieve(req, res) {
		res.json(req.user_scope)

	},

)

router.put(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user_scope,

	async function update(req, res) {
		type Suspect = {
			value?: number

		}

		let { _id } = req.params
		let { weapp } = req.survive_token!

		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'value'>(
			evidence.Digital.is_natural
				.to(
					v => v & scope_model.pick(v, scope_model.Mode.普通),

				)
				.signed('value'),

			{ quiet: true },

		)

		let doc = await user_model.default
			.findOne(
				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ _id, weapp, 'scope.lock': false },

			)
			.select('+scope')


		reply.NotFound.asserts(doc, 'user')
		reply.NotFound.asserts(doc.scope, 'scope')

		Object.assign(
			doc.scope, suspect.get(),

		)

		await doc.save()
		await token_model.default.findOneAndUpdate(
			{ user: _id },

			{ scope: doc.scope.value },

		)

		res.json()


	},

)

router.delete(
	'/scope/:_id',

	...token_router.checkpoint(
		scope_model.Role.管理,

		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	async function delete_(req, res) {
		let { _id } = req.params
		let { weapp } = req.survive_token!

		let doc = await user_model.default.findOneAndUpdate(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ _id, weapp, 'scope.lock': false },

			{ scope: null },

		)


		reply.NotFound.asserts(doc, 'user')

		await token_model.default.findOneAndUpdate(
			{ user: _id },

			{ scope: 0 },

		)


		res.json()

	},

)