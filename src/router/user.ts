import moment from 'moment'
import express from 'express'
import { Types } from 'mongoose'

import * as reply from '../lib/reply.js'
import * as surmise from '../lib/surmise.js'
import * as detective from '../lib/detective.js'

import * as user_model from '../model/user.js'
import * as scope_model from '../model/scope.js'
import * as token_model from '../model/token.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




// eslint-disable-next-line func-call-spacing
export const in_keyword_surmise_chain = surmise.Text.search<user_model.TRawDocKeyword>
(
	...user_model.keyword,

)

// eslint-disable-next-line func-call-spacing
export const in_keyword_populate_surmise_chain = surmise.Model.search<user_model.TRawDocKeyword>
(
	user_model.default, ...user_model.keyword,

)

export const router = express.Router()

router.post(
	'/user',

	retrieve_router.usable_token,

	async function create (req, res)
	{
		type Suspect = {
			appid: string
			code : string

		}


		let { _id } = req.usable_token!

		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer_signed<'appid'>(
			surmise.Text.required.signed('appid'),

		)

		await suspect.infer_signed<'code'>(
			surmise.Text.required.signed('code'),

		)


		let weapp = await weapp_model.default
			.findOne(
				{ appid: suspect.get('appid') },

			)
			.select('+secret')


		reply.NotFound.asserts(weapp, 'weapp')

		let wx_session = await weapp.to_wx_session(
			suspect.get('code'),

		)

		let user = await user_model.default
			.findOne(
				{ wxopenid: wx_session.openid },

			)
			.select('+scope')

		if (detective.is_null(user) )
		{
			let scope: user_model.TRawDocType['scope'] = null

			if (await user_model.default.countDocuments({}) < 1)
			{
				let v = {
					lock: true,

					value : scope_model.Role.无限,
					expire: moment().add(99, 'year')
						.toDate(),

				}

				scope = v as scope_model.THydratedDocumentType

			}

			user = await user_model.default.create(
				{ weapp, scope, wxopenid: wx_session.openid, wxsession: wx_session.value },

			)


		}

		else
		{
			user.wxsession = wx_session.value

			await user.save()

		}

		await token_model.default.findByIdAndUpdate(
			_id,

			{ weapp, user, scope: user.scope?.value ?? scope_model.Role.普通 },

		)

		res.json()


	},

)

router.post(
	'/user/:_id/scope',

	...token_router.checkpoint(
		scope_model.chmod(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	retrieve_router.user,

	async function create_scope (req, res)
	{
		let doc = req.user!

		let fields = await doc.select_sensitive_fields('+scope')

		if (detective.is_empty(fields.scope) )
		{
			let v = {
				value: scope_model.Role.运营,

			}

			fields.scope = v as scope_model.THydratedDocumentType

			await fields.save()

		}

		res.json()

	},

)


router.get(
	'/user',

	...token_router.checkpoint(),

	async function retrieves (req, res)
	{
		type Suspect = {
			'weapp' : Types.ObjectId
			'active': true

			'$or'?: surmise.Keyword<user_model.TRawDocKeyword>

			'scope'?     : null | { $ne: null }
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'scope.lock'?: false | { $ne: true }

		}

		let { weapp } = req.survive_token!

		let segment = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)

		await suspect.infer_signed<'$or', 'keyword'>(
			in_keyword_surmise_chain.signed('keyword'),

			{ rename: '$or', quiet: true },

		)

		await suspect.infer_signed<'scope'>(
			surmise.Text.is_boolean
				.to(
					v => v ? { $ne: null } : null,

				)
				.signed('scope'),

			{ quiet: true },

		)

		await suspect.set('weapp', weapp)
		await suspect.set('active', true)

		await suspect.set(
			'scope.lock',

			{ $ne: true },

			suspect.has('scope') === false,

		)

		await suspect.set(
			'scope.lock',

			false,

			suspect.has(
				'scope', { empty: false },

			),

		)


		await segment.fit(suspect)

		let doc = await user_model.default
			.find(segment.find)
			.select('+phone')
			.sort(segment.sort)
			.skip(segment.skip)
			.limit(segment.limit)


		res.json(doc)

	},

)

router.get(
	'/user/:_id',

	...token_router.checkpoint(),

	retrieve_router.user,

	async function retrieve (req, res)
	{
		let doc = req.user!

		let fields = await doc.select_sensitive_fields('+phone')

		res.json(
			{ ...doc.toJSON(), ...fields.toJSON() },

		)

	},

)

router.put(
	'/user/:_id',

	...token_router.checkpoint(),

	retrieve_router.user,

	async function update (req, res)
	{
		type Suspect = {
			nickname?: string
			phone?   : string

		}

		let doc = req.user!

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.infer_signed<'nickname'>(
			surmise.Text.required.signed('nickname'),

			{ quiet: true },

		)

		await suspect.infer_signed<'phone'>(
			surmise.Text.is_phone_number.signed('phone'),

			{ quiet: true },

		)

		await doc.updateOne(
			suspect.get(),

		)

		res.json()

	},

)
