import stream from 'node:stream'

import express from 'express'
import mime_types from 'mime-types'

import * as evidence from '../lib/evidence.js'
import * as detective from '../lib/detective.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'








export async function create(
	weapp: weapp_model.THydratedDocumentType,

	body: stream.Readable,

	option: {
		name: string,
		model: string,

		mime: string,
		folder: string,

		hash?: string

	},

): Promise<media_model.THydratedDocumentType> {
	if (detective.is_hex_string(option.hash)

	) {
		let doc = await media_model.default
			.safe_to_link(
				option.name, option.model, { hash: option.hash },

			)

		if (detective.is_exist(doc)

		) {
			return doc

		}

	}


	let doc = await media_model.default.create(
		{
			weapp,
			mime: option.mime, folder: option.folder,
			bucket: weapp.bucket,

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

	...token_router.checkpoint(
		scope_model.Role.运营,

	),

	async function create_(req, res) {
		type Suspect = {
			name: string
			model: string
			folder: string

			mime: string

			hash?: string

		}


		let weapp = await req.survive_token!.to_weapp()

		let suspect = evidence.suspect<Suspect>(req.headers)

		await suspect.infer_signed<'name'>(
			evidence.Text.required.signed('name'),

		)

		await suspect.infer_signed<'model'>(
			evidence.Text.required.signed('model'),

		)

		await suspect.infer_signed<'folder'>(
			evidence.Text.is_dirname.signed('folder'),

		)

		await suspect.infer_signed<'mime', 'accept'>(
			evidence.Text.required
				.to(
					v => {
						let vv = mime_types.contentType(v)

						if (vv === false) {
							throw new Error('accept error, it not in type list')

						}

						return vv

					},

				)
				.signed('accept'),

			{ rename: 'mime' },

		)

		await suspect.infer_signed<'hash'>(
			evidence.Text.required.signed('hash'),

			{ quiet: true },

		)

		let doc = await create(
			weapp, req, suspect.get(),

		)

		let uri = await doc.safe_access()

		res.set(
			'X-Access-URI', uri.href,

		)

		res.set(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.json(doc.src)

	},

)


router.delete(
	'/media',

	...token_router.checkpoint(
		scope_model.Role.运营,

	),

	async function delete_(req, res) {
		type Suspect = Array<string>


		let { weapp } = req.survive_token!

		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer(
			evidence.Every.is_media_uri_string,

		)

		await media_model.default.safe_delete(
			weapp, ...suspect.get(),

		)

		res.json()

	},


)