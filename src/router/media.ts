import express from 'express'
import mime_types from 'mime-types'

import * as surmise from '../lib/surmise.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




type TOption = Parameters<typeof media_model.default.safe_create>[1]

export async function capture (option: unknown): Promise<TOption>
{
	let suspect = surmise.capture<TOption>(option)

	await suspect.infer<'name'>(
		surmise.Text.required.signed('name'),

	)

	await suspect.infer<'model'>(
		surmise.Text.required.signed('model'),

	)

	await suspect.infer<'mime', 'accept'>(
		surmise.Text.required
			.to(
				v =>
				{
					let vv = mime_types.contentType(v)

					if (vv === false)
					{
						throw new Error('accept error, it not in type list')

					}

					return vv

				},

			)
			.signed('accept'),

		{ rename: 'mime' },

	)

	await suspect.infer<'folder'>(
		surmise.Text.is_path.signed('folder'),

	)

	await suspect.infer_optional<'hash'>(
		surmise.Text.is_hex.signed('hash'),

	)

	return suspect.get()

}



export const router = express.Router()

router.options(
	'/media',

	retrieve_router.survive_token,

	async function query (req, res)
	{
		let weapp = await req.survive_token!
			.to_weapp()

		let uri = await capture(req.headers)
			.then(
				v => media_model.default.safe_create(weapp, v),

			)
			.then(
				v => v.goal(),

			)


		res.expose(
			'X-Access-URI', uri.href,

		)

		res.expose(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		uri.search = ''

		res.json(uri.href)

	},

)


router.post(
	'/media',

	retrieve_router.survive_token,

	async function create_ (req, res)
	{
		let weapp = await req.survive_token!
			.to_weapp()

		let uri = await capture(req.headers)
			.then(
				v => media_model.default.safe_create(weapp, v),

			)
			.then(
				v => v.safe_push(req),

			)
			.then(
				v => v.safe_access(),

			)


		res.expose(
			'X-Access-URI', uri.href,

		)

		res.expose(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		uri.search = ''

		res.json(uri.href)

	},

)


router.put(
	'/media',

	retrieve_router.survive_token,

	retrieve_router.media,

	async function update (req, res)
	{
		await req.media!.safe_push(req)

		res.json()

	},

)


router.delete(
	'/media',

	...token_router.checkpoint(
		scope_model.derive(
			scope_model.Role.运营,

			scope_model.Mode.管理,

		),

		scope_model.derive(
			scope_model.Role.管理,

			scope_model.Mode.管理,

		),

	),

	async function delete_ (req, res)
	{
		type Suspect = string[]


		let { weapp } = req.survive_token!

		let suspect = await surmise.infer<Suspect>(
			req.body,

			surmise.Every.is_media_uri_string,

		)

		await media_model.default.safe_delete(
			weapp, ...suspect,

		)

		res.json()

	},


)
