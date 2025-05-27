import express from 'express'
import { Types } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as evidence from '../lib/evidence.js'
import * as detective from '../lib/detective.js'
import * as structure from '../lib/structure.js'

import * as user_model from '../model/user.js'
import * as token_model from '../model/token.js'
import * as stamp_model from '../model/stamp.js'

import * as stamp_router from './stamp.js'
import * as retrieve_router from './retrieve.js'




export const router = express.Router()

router.options(
	'/authorize',

	retrieve_router.survive_token,

	function query (req, res, next)
	{
		let { _id } = req.survive_token!

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

		let { user } = req.survive_token!
		let suspect = evidence.suspect<Suspect>(req.body)

		await suspect.infer_signed<'value'>(
			stamp_router.symbol_evidence_chain('/authorize', 'post')
				.and
				<
					structure.Overwrite<
						stamp_model.THydratedDocumentType, { amber: string }

					>

				// eslint-disable-next-line func-call-spacing
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

		let doc = await user_model.default
			.findById(user)
			.select('+scope')

		reply.NotFound.asserts(doc, 'user')
		reply.NotFound.asserts(doc.scope, 'scope')

		await token_model.default.findByIdAndUpdate(
			suspect.get('value'),

			{ scope: doc.scope.value },

		)

		res.json()


	},

)
