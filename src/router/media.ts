import stream from 'node:stream'

import express from 'express'
import mime_types from 'mime-types'

import * as surmise from '../lib/surmise.js'
import * as detective from '../lib/detective.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'








export async function create
(
	weapp: weapp_model.Tm['HydratedDocument'],

	body: stream.Readable,

	option: {
		name : string
		model: string

		mime  : string
		folder: string

		hash?: string

	},

)
: Promise<media_model.Tm['HydratedDocument']>
{
	if (detective.is_hex_string(option.hash) )
	{
		let doc = await media_model.default
			.safe_to_link(
				option.name, option.model, { hash: option.hash },

			)

		if (detective.is_exist(doc) )
		{
			return doc

		}

	}


	let doc = await media_model.default
		.create(
			{
				weapp,

				mime  : option.mime,
				bucket: weapp.bucket, folder: option.folder,

				linker: [
					{ name: option.name, model: option.model },

				],

			},

		)

	return doc.safe_push(body)

}

export const router = express.Router()

router.post(
	'/media',

	retrieve_router.survive_token,

	async function create_ (req, res)
	{
		type Suspect = {
			name : string
			model: string

			mime  : string
			folder: string

			hash?: string

		}


		let weapp = await req.survive_token!.to_weapp()

		let suspect = surmise.capture<Suspect>(req.headers)

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
			surmise.Text.required.signed('hash'),

		)

		let doc = await create(
			weapp, req, suspect.get(),

		)

		let uri = await doc.safe_access()

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
