import express from 'express'

import * as reply from '../lib/reply.js'
import * as surmise from '../lib/surmise.js'
import * as structure from '../lib/structure.js'

import * as scope_model from '../model/scope.js'
import * as token_model from '../model/token.js'
import * as checkpoint_model from '../model/checkpoint.js'

import * as retrieve_router from './retrieve.js'


/**
 * 检查权限范围
 */
export function checkpoint (...point: number[]): express.RequestHandler[]
{
	return [
		retrieve_router.survive_token,

		async function (req, res, next)
		{
			let method = req.method
			let original = req.originalUrl

			let data = req.survive_token!.toObject()

			let { scope, weapp, user } = req.survive_token!

			let any = point.length === 0 && scope > 0
			let has = scope_model.some(scope, ...point)

			if (any || has)
			{
				let doc = await checkpoint_model.default.create(
					{ scope, weapp, user, method, original },

				)

				req.checkpoint = doc

				next()

			}

			else
			{
				let e = new reply.Unauthorized('permission denied')

				e.push('data', data)

				throw e

			}

		},

	]

}


export const router = express.Router()

router.post(
	'/token',

	retrieve_router.xapp,

	async function create (req, res)
	{
		let doc = await token_model.default
			.create(
				{ weapp: req.xapp },

			)

		res.json(
			structure.pick(doc, 'value', 'refresh', 'expire'),

		)

	},

)

router.get(
	'/token',

	retrieve_router.survive_token,

	function retrieve (req, res)
	{
		let doc = req.survive_token!

		res.json(
			structure.pick(doc, 'expire', 'scope', 'is_super', 'mode'),

		)

	},

)

router.put(
	'/token',

	retrieve_router.token,

	async function update (req, res)
	{
		type Suspect = {
			refresh: string

		}

		let doc = req.token!

		let suspect = surmise.capture<Suspect>(req.body)

		await suspect.infer<'refresh'>(
			surmise.Text.required.signed('refresh'),

		)

		await doc.replenish(suspect.get('refresh') )

		res.json(
			structure.pick(doc, 'value', 'refresh', 'expire'),

		)


	},

)
