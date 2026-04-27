import express from 'express'
import mime_types from 'mime-types'

import * as surmise from '../lib/surmise.js'

import * as media_model from '../model/media.js'
import * as scope_model from '../model/scope.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.options(
	'/media',

	retrieve_router.survive_token,

	async function query (req, res)
	{
		type Suspect = {
			folder: string

			mime: string

		}

		let oss = req.oss!

		let suspect = surmise.capture<Suspect>(req.headers)

		await suspect.infer<'folder'>(
			surmise.Text.is_path.signed('folder'),

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


		let seize = oss.seize(suspect.get('folder'), suspect.get('mime') )

		res.expose(
			'X-Access-URI', seize.upload.href,

		)

		res.expose(
			'X-Oss-Process', seize.upload.searchParams.toString(),

		)

		res.json(seize.src.href)

	},

)


router.post(
	'/media',

	retrieve_router.survive_token,

	async function create (req, res)
	{
		type Suspect = {
			folder: string

			mime     : string
			filename?: string

		}

		let oss = req.oss!

		let suspect = surmise.capture<Suspect>(req.headers)

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

		await suspect.infer_optional<'filename'>(
			surmise.Text.required.signed('filename'),

		)


		let doc = await media_model.default
			.insure(
				oss, req, suspect.get(),

			)

		let uri = oss.sign(doc.src)

		res.expose(
			'X-Access-URI', uri.href,

		)

		res.expose(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.json(doc.src)

	},

)


router.put(
	'/media',

	retrieve_router.survive_token,

	retrieve_router.media,

	async function update (req, res)
	{
		type Suspect = {
			src: string

			filename?: string

		}

		let oss = req.oss!

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.infer<'src'>(
			surmise.Text.is_media_uri.signed('src'),

		)

		await suspect.infer_optional<'filename'>(
			surmise.Text.is_filename.signed('filename'),

		)

		let doc = await media_model.default
			.claim(
				oss, suspect.get(),

			)

		let uri = oss.sign(doc.src)

		res.expose(
			'X-Access-URI', uri.href,

		)

		res.expose(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.json(doc.src)

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

		let suspect = await surmise.infer<Suspect>(
			req.body,

			surmise.Every.is_media_uri_string,

		)

		await media_model.default.safe_delete(...suspect)

		res.json()

	},


)
