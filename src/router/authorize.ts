import express from 'express'
import { Types } from 'mongoose'


import * as surmise from '../lib/surmise.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'

import * as token_model from '../model/token.js'
import * as stamp_model from '../model/stamp.js'

import * as stamp_router from './stamp.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.options(
	'/authorize',

	retrieve_router.deposit_token,

	function query (req, res, next)
	{
		let { _id } = req.deposit_token!

		let handler = stamp_router.symbol_encrypt(
			'/authorize', 'post', { amber: _id },

		)

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		handler(req, res, next)

	},


)

router.post(
	'/authorize',

	retrieve_router.survive_token,

	async function create (req, res)
	{
		type Suspect = {
			value: Types.ObjectId

		}

		let doc = req.survive_token!

		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer<'value'>(
			stamp_router.symbol_clue('/authorize', 'post')
				.and
				<
					structure.Overwrite<
						stamp_model.Tm['HydratedDocument'], { amber: string }

					>

				// eslint-disable-next-line @stylistic/function-call-spacing
				>
				(
					'amber is not a object id',

					v => detective.is_object_id_string(v.amber),

				)
				.to(
					v => new Types.ObjectId(v.amber),

				)
				.signed(
					'value',

				),

		)

		await token_model.default
			.findByIdAndUpdate(
				suspect.get('value'),

				structure.pick(doc, 'weapp', 'user', 'color', 'scope'),

			)

		res.json()


	},

)
