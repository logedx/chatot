import stream from 'node:stream'

import express from 'express'
import mime_types from 'mime-types'

import * as evidence from '../lib/evidence.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'








export async function create(
	weapp: weapp_model.THydratedDocumentType,

	body: stream.Readable,

	option: {
		mime: string,
		folder: string,

	},

): Promise<media_model.THydratedDocumentType> {
	let pathname = media_model.resolve(option.folder, option.mime)

	let doc = await media_model.default.create(
		{ weapp, mime: option.mime, pathname, store: 'alioss', bucket: weapp.bucket },

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
			mime: string
			folder: string

		}


		let weapp = await req.survive_token!.to_weapp()

		let suspect = evidence.suspect<Suspect>(req.headers)

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

		await suspect.infer_signed<'folder'>(
			evidence.Text.is_dirname.signed('folder'),

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
		type Suspect = {
			src: string

		}


		let { weapp } = req.survive_token!

		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'src'>(
			evidence.Text.is_media_uri.signed('src'),

		)

		await media_model.default.safe_delete(
			weapp, suspect.get('src'),

		)

		res.json()

	},


)