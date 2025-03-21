import express from 'express'
import { Types } from 'mongoose'

import * as evidence from '../lib/evidence.js'

import * as keyword_model from '../model/keyword.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.post(
	'/keyword',

	...token_router.checkpoint(),

	async function create(req, res) {
		type Suspect = {
			weapp: Types.ObjectId

			model: string
			name: string
			value: string

			letter: string

		}

		let { weapp } = req.survive_token!

		let suspect = evidence.suspect<Suspect>(req.body)


		await suspect.set('weapp', weapp)

		await suspect.infer_signed<'model'>(
			evidence.Text.required.signed('model'),

		)

		await suspect.infer_signed<'name'>(
			evidence.Text.required.signed('name'),

		)

		await suspect.infer_signed<'value'>(
			evidence.Text.required.signed('value'),

			{ alias: 'letter' },

		)


		await keyword_model.default.create(
			suspect.get(),

		)

		res.json()

	},

)

router.get(
	'/keyword',

	...token_router.checkpoint(),

	async function retrieve_pagination(req, res) {
		type Suspect = {
			model?: string
			name?: string
			value?: RegExp

			letter?: string

		}


		let pagin = evidence.pagination<Suspect>()
		let suspect = evidence.suspect<Suspect>(req.query)

		await suspect.infer_signed<'model'>(
			evidence.Text.required.signed('model'),

			{ quiet: true },

		)

		await suspect.infer_signed<'name'>(
			evidence.Text.required.signed('name'),

			{ quiet: true },

		)

		await suspect.infer_signed<'value'>(
			evidence.Text.is_search.signed('value'),

			{ quiet: true },

		)

		await suspect.infer_signed<'letter'>(
			evidence.Text.required.signed('letter'),

			{ quiet: true },

		)


		await pagin.linker(suspect)

		let doc = await keyword_model.default
			.find(pagin.find)
			.sort(pagin.sort)
			.skip(pagin.skip)
			.limit(pagin.limit)

		res.json(doc)

	},

)

router.delete(
	'/keyword/:_id',

	...token_router.checkpoint(),

	retrieve_router.keyword,

	async function delete_(req, res) {
		let doc = req.keyword!

		await doc.deleteOne()

		res.json()

	},

)
