import stream from 'node:stream'

import ali_oss from 'ali-oss'
import express from 'express'
import { Types } from 'mongoose'
import mime_types from 'mime-types'

import * as reply from '../lib/reply.js'
import * as storage from '../lib/storage.js'
import * as evidence from '../lib/evidence.js'
import * as detective from '../lib/detective.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'
import * as weapp_model from '../model/weapp.js'

import * as token_router from './token.js'




export async function push_to_ali_oss(
	bucket: string,
	pathname: string,

	body: stream.Readable,

): Promise<string> {
	try {
		const oss = storage.ali_oss()

		oss.useBucket(bucket)

		let uri = pathname.replace(/\\/g, '/')

		let rssult = await oss.putStream(uri, body) as ali_oss.PutObjectResult

		return rssult.url

	}

	catch (e) {
		if (detective.is_error(e)

		) {
			throw new reply.Forbidden(e.message)

		}

		if (detective.is_string(e)

		) {
			throw new reply.Forbidden(e)

		}

		throw new reply.Forbidden('unknown error')

	}

}

export async function delete_by_ali_oss(
	bucket: string,
	pathname: string,

): Promise<ali_oss.DeleteResult> {
	try {
		const oss = storage.ali_oss()

		oss.useBucket(bucket)

		let uri = pathname.replace(/\\/g, '/')

		return await oss.delete(uri)

	}

	catch (e) {
		if (detective.is_error(e)

		) {
			throw new reply.Forbidden(e.message)

		}

		if (detective.is_string(e)

		) {
			throw new reply.Forbidden(e)

		}

		throw new reply.Forbidden('unknown error')

	}

}



export async function create(
	weapp: weapp_model.THydratedDocumentType,

	folder: string,
	mime: string,

	body: stream.Readable,

): Promise<media_model.THydratedDocumentType> {
	let size = 0

	body.on(
		'data',

		v => {
			if (detective.is_buffer(v)
				|| detective.is_array_buffer(v)

			) {
				size = size + v.byteLength

			}

		},

	)

	let pathname = media_model.resolve(folder, mime)

	let src = await push_to_ali_oss(
		weapp.bucket,

		pathname,

		body,


	)

	return media_model.default.create(
		{ weapp, size, mime, folder, pathname, src },

	)

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
			weapp, suspect.get('folder'), suspect.get('mime'), req,

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
		await delete_by_ali_oss(weapp.bucket, doc.pathname)

		res.json()

	},


)