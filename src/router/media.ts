import stream from 'node:stream'

import express from 'express'
import { Types } from 'mongoose'
import mime_types from 'mime-types'

import * as reply from '../lib/reply.js'
import * as evidence from '../lib/evidence.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'








export async function create(
	weapp: weapp_model.THydratedDocumentType,

	mime: string,
	folder: string,

	body: stream.Readable,

): Promise<media_model.THydratedDocumentType> {
	let pathname = media_model.resolve(folder, mime)

	let doc = await media_model.default.create(
		{ weapp, mime, pathname, store: 'alioss', bucket: weapp.bucket },

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
			pathname: string

			src: string

			weapp: Types.ObjectId

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
			weapp, suspect.get('mime'), suspect.get('folder'), req,

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

			weapp: Types.ObjectId

		}


		let weapp = await req.survive_token!.to_weapp()

		let suspect = evidence.suspect<Suspect>(req.headers)

		await suspect.infer_signed<'src'>(
			evidence.Text.is_media_uri.signed('src'),

		)

		await suspect.set('weapp', weapp._id)

		let doc = await media_model.default.findOne(
			suspect.get(),

		)

		reply.NotFound.asserts(doc, 'media')

		await doc.safe_delete()

		res.json()

	},


)