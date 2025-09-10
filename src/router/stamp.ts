import express from 'express'

import * as axios from 'axios'

import * as secret from '../lib/secret.js'
import * as surmise from '../lib/surmise.js'
import * as structure from '../lib/structure.js'

import * as media_model from '../model/media.js'
import * as stamp_model from '../model/stamp.js'

import * as token_router from './token.js'
import * as media_router from './media.js'
import * as retrieve_router from './retrieve.js'




export const cypher_decrypt_clue = surmise.Text.required.to(stamp_model.decrypt)

export function symbol_clue
(
	pathname: `/${string}`,
	method: Lowercase<axios.Method>,

)
: surmise.Clue<stamp_model.THydratedDocumentType>
{
	return surmise.Text.required
		.to(
			v => stamp_model.default.from(v),

		)
		.and(
			'invalid symbol',

			v => v.touch(pathname, method),

		)


}

export function symbol_encrypt
(
	pathname: `/${string}`,
	method: Lowercase<axios.Method>,

	option?: {
		expire?: number
		amber? : stamp_model.TRawDocType['amber']

	},

)
: express.RequestHandler
{
	// eslint-disable-next-line @typescript-eslint/no-shadow
	return function symbol_encrypt (req, res)
	{
		let expire = option?.expire ?? 600

		let cypher = stamp_model.encrypt(
			stamp_model.sign(pathname, method), secret.delay(expire), option?.amber ?? null,

		)

		res.set(
			'Access-Control-Max-Age', `${expire}`,

		)

		res.set(
			'Access-Control-Allow-Methods', method.toUpperCase(),

		)

		res.json(cypher)

	}


}

export const router = express.Router()

router.post(
	'/stamp',

	...token_router.checkpoint(),

	async function create (req, res)
	{
		type Suspect = {
			value: string

			path  : string
			mailer: stamp_model.Mailer

		}

		let weapp = await req.survive_token!.to_weapp()

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.set('value', secret.hex() )

		await suspect.infer<'path'>(
			surmise.Text.required.signed('path'),

		)

		await suspect.infer<'mailer', 'cypher'>(
			cypher_decrypt_clue.signed('cypher'),

			{ rename: 'mailer' },

		)


		let unlimited = await weapp.to_unlimited(
			suspect.get('path'), suspect.get('value'),

		)

		let media = await media_router
			.create(
				weapp, { name: 'src', model: 'stamp', mime: 'image/png', folder: '/stamp' },

			)
			.then(
				v => v.safe_push(unlimited.body),
			)

		let doc = await stamp_model.default.create(
			{ src: media.src, value: suspect.get('value'), ...suspect.get('mailer') },

		)


		let uri = await media.safe_access()

		res.set(
			'X-Access-URI', uri.href,

		)

		res.set(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.json(
			structure.omit(doc.toObject(), 'symbol'),

		)


	},

)


router.options(
	'/stamp/:value',

	retrieve_router.survive_token,

	async function query (req, res)
	{
		let { value } = req.params
		let { weapp } = req.survive_token!

		let doc = await stamp_model.default.from(value)

		let uri = await media_model.default.safe_access(weapp, doc.src)


		res.set(
			'X-Access-URI', uri.href,

		)

		res.set(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.set(
			'Access-Control-Max-Age', `${doc.lave}`,

		)

		res.set(
			'Access-Control-Allow-Methods', doc.method,

		)

		res.json(
			structure.omit(doc.toObject(), 'symbol'),

		)

	},

)


router.get(
	'/stamp/:_id',

	retrieve_router.survive_token,

	retrieve_router.stamp,

	async function retrieve (req, res)
	{
		let doc = req.stamp!
		let { weapp } = req.survive_token!

		let uri = await media_model.default.safe_access(weapp, doc.src)


		res.set(
			'X-Access-URI', uri.href,

		)

		res.set(
			'X-Oss-Process', uri.searchParams.toString(),

		)

		res.set(
			'Access-Control-Max-Age', `${doc.lave}`,

		)

		res.set(
			'Access-Control-Allow-Methods', doc.method,

		)

		res.json(
			structure.omit(doc.toObject(), 'symbol'),

		)

	},

)
