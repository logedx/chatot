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
			label: string
			value: string

			letter: string

		}

		let { weapp } = req.survive_token!

		let suspect = surmise.capture<Suspect>(req.body)


		await suspect.set('weapp', weapp)

		await suspect.infer_signed<'name'>(
			surmise.Text.required.signed('name'),

		)

		await suspect.infer_signed<'label'>(
			surmise.Text.optional.signed('label'),

		)

		await suspect.infer_signed<'value'>(
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
			label?: string
			value?: RegExp

			letter?: string

		}


		let { weapp } = req.survive_token!

		let segment = surmise.fritter<Suspect>()
		let suspect = surmise.capture<Suspect>(req.query)


		await suspect.set('weapp', weapp)

		await suspect.infer_signed<'name'>(
			surmise.Text.required.signed('name'),

			{ quiet: true },

		)

		await suspect.infer_signed<'label'>(
			surmise.Text.required.signed('label'),

			{ quiet: true },

		)

		await suspect.infer_signed<'value'>(
			surmise.Text.is_search.signed('value'),

			{ quiet: true },

		)

		await suspect.infer_signed<'letter'>(
			surmise.Text.required.signed('letter'),

			{ quiet: true },

		)


		await segment.fit(suspect)

		let doc = await keyword_model.default
			.find(segment.find)
			.sort(segment.sort)
			.skip(segment.skip)
			.limit(segment.limit)

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
