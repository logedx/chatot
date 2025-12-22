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




// eslint-disable-next-line @stylistic/function-call-spacing
export const in_keyword_clue = surmise.Text.search<user_model.TRawDocKeyword>
(
	...user_model.keyword,

)

// eslint-disable-next-line @stylistic/function-call-spacing
export const in_keyword_populate_clue = surmise.Model.search<user_model.TRawDocKeyword>
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

		await suspect.infer<'appid'>(
			surmise.Text.required.signed('appid'),

		)

		await suspect.infer<'code'>(
			surmise.Text.required.signed('code'),

		)


		let weapp = await weapp_model.default
			.findOne(
				{ appid: suspect.get('appid') },

			)
			.select('+secret')


		reply.NotFound.asserts(weapp, 'weapp is not found')

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
			let scope: user_model.Tm['DocType']['scope'] = null

			if (await user_model.default.countDocuments({}) < 1)
			{
				let v = {
					lock: true,

					value : scope_model.Role.无限,
					expire: moment().add(99, 'year')
						.toDate(),

				}

				scope = v as scope_model.Tm['HydratedDocument']

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

			{ weapp, user, color: user.color, scope: user.scope?.value ?? scope_model.Role.普通 },

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

		await doc.authorize()

		res.json()

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

router.get(
	'/users',

	...token_router.checkpoint(),

	async function retrieves (req, res)
	{
		type Suspect = {
			'$or'?: surmise.Keyword<user_model.TRawDocKeyword>

			'color'?: string

			'scope'?     : null | { $ne: null }
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'scope.lock'?: false | { $ne: true }

			'weapp' : Types.ObjectId
			'active': true

		}

		let { weapp } = req.survive_token!

		let fritter = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)

		await suspect.infer_optional<'$or', 'keyword'>(
			in_keyword_clue.signed('keyword'),

			{ rename: '$or' },

		)

		await suspect.infer_optional<'color'>(
			surmise.Text.optional.signed('color'),

		)

		await suspect.infer_optional<'scope'>(
			surmise.Text.is_boolean
				.to(
					v => v ? { $ne: null } : null,

				)
				.signed('scope'),

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


		await fritter.fit(suspect)

		let doc = await user_model.default
			.find(fritter.find)
			.select('+phone')
			.sort(fritter.sort)
			.skip(fritter.skip)
			.limit(fritter.limit)


		res.json(doc)

	},

)


router.put(
	'/user/:_id',

	...token_router.checkpoint(),

	retrieve_router.user,

	async function update (req, res)
	{
		type Suspect = {
			active?  : boolean
			avatar?  : string
			nickname?: string
			color?   : string
			phone?   : string

		}

		let doc = req.user!

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.infer_optional<'active'>(
			surmise.Switch.is_boolean.signed('active'),

		)

		await suspect.infer_optional<'avatar'>(
			surmise.Text.is_media_uri.signed('avatar'),

		)

		await suspect.infer_optional<'nickname'>(
			surmise.Text.required.signed('nickname'),

		)

		await suspect.infer_optional<'color'>(
			surmise.Text.optional.signed('color'),

		)

		await suspect.infer_optional<'phone'>(
			surmise.Text.is_phone_number.signed('phone'),

		)

		await doc.updateOne(
			suspect.get(),

		)

		res.json()

	},

)
