import express from 'express'
import { Types } from 'mongoose'

import * as secret from '../lib/secret.js'
import * as evidence from '../lib/evidence.js'

import * as scope_model from '../model/scope.js'
import * as stamp_model from '../model/stamp.js'

import * as token_router from './token.js'
import * as media_router from './media.js'
import * as retrieve_router from './retrieve.js'




export const cypher_decrypt_evidence_chain = evidence.Text.required.to(stamp_model.decrypt)

export function symbol_evidence_chain(value: string): evidence.Chain<Types.ObjectId> {
	return evidence.Text.required.to(
		v => stamp_model.default.eternal(v, value),

	)


}

export function symbol_encrypt(value: string): express.RequestHandler {
	return function (req, res) {
		let cypher = stamp_model.encrypt(value)

		res.setHeader('Access-Control-Max-Age', 600)
		res.setHeader('Access-Control-Allow-Methods', 'POST')

		res.json(cypher)

	}


}

export const router = express.Router()

router.post(
	'/stamp',

	...token_router.checkpoint(
		scope_model.Role.运营,

	),

	async function create(req, res) {
		type Suspect = {
			value: string

			path: string
			mailer: stamp_model.Mailer

		}

		let weapp = await req.survive_token!.to_weapp()

		let suspect = evidence.suspect<Suspect>(req.body)


		await suspect.infer_signed<'path'>(
			evidence.Text.required.signed('path'),

		)

		await suspect.infer_signed<'mailer', 'cypher'>(
			cypher_decrypt_evidence_chain.signed('cypher'),

			{ rename: 'mailer' },

		)

		await suspect.set('value', secret.hex)


		let unlimited = await weapp.to_unlimited(
			suspect.get('path'), suspect.get('value'),

		)

		let media = await media_router.create(
			weapp, unlimited.body, { name: 'src', model: 'stamp', mime: 'image/png', folder: '/stamp' },

		)


		await stamp_model.default.create(
			{ src: media.src, value: suspect.get('value'), ...suspect.get('mailer') },

		)


		res.json(media.src)


	},

)


router.get(
	'/stamp/:value',

	retrieve_router.survive_token,

	async function retrieve(req, res) {
		let { value } = req.params

		let doc = await stamp_model.default.from(value)

		res.json(doc)

	},

)
