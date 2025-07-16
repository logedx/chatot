import express from 'express'
import { Types } from 'mongoose'

import * as surmise from '../lib/surmise.js'

import * as keyword_model from '../model/keyword.js'

import * as token_router from './token.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.post(
	'/keyword',

	...token_router.checkpoint(),

	async function create (req, res)
	{
		type Suspect = {
			weapp: Types.ObjectId

			name : string
			color: string
			value: string

			letter: string

		}

		let { weapp } = req.survive_token!

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.set('weapp', weapp)

		await suspect.infer<'name'>(
			surmise.Text.required.signed('name'),

		)

		await suspect.infer<'color'>(
			surmise.Text.optional.signed('color'),

		)

		await suspect.infer<'value'>(
			surmise.Text.required.signed('value'),

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

	async function retrieves (req, res)
	{
		type Suspect = {
			weapp: Types.ObjectId

			name? : string
			color?: string
			value?: RegExp

			letter?: string

		}


		let { weapp } = req.survive_token!

		let fritter = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)


		await suspect.set('weapp', weapp)

		await suspect.infer_optional<'name'>(
			surmise.Text.required.signed('name'),

		)

		await suspect.infer_optional<'color'>(
			surmise.Text.required.signed('color'),

		)

		await suspect.infer_optional<'value'>(
			surmise.Text.is_search.signed('value'),

		)

		await suspect.infer_optional<'letter'>(
			surmise.Text.required.signed('letter'),

		)


		await fritter.fit(suspect)

		let doc = await keyword_model.default
			.find(fritter.find)
			.sort(fritter.sort)
			.skip(fritter.skip)
			.limit(fritter.limit)

		res.json(doc)

	},

)

router.delete(
	'/keyword/:_id',

	...token_router.checkpoint(),

	retrieve_router.keyword,

	async function delete_ (req, res)
	{
		let doc = req.keyword!
		let ctx = req.checkpoint!

		await ctx.hold(doc)
		await doc.deleteOne()

		res.json()

	},

)
