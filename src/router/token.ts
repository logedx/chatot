import express from 'express'

import * as reply from '../lib/reply.js'
import * as structure from '../lib/structure.js'

import * as scope_model from '../model/scope.js'
import * as token_model from '../model/token.js'
import * as checkpoint_model from '../model/checkpoint.js'

import * as retrieve_router from './retrieve.js'


/**
 * 检查权限范围
 */
export function checkpoint(...point: Array<number>): Array<express.RequestHandler> {
	return [
		retrieve_router.survive_token,

		function (req, res, next) {
			let method = req.method
			let original = req.originalUrl

			let { scope, weapp, user } = req.survive_token!

			let any = point.length === 0 && scope > 0
			let has = scope_model.some(scope, ...point)

			if (any || has) {
				// eslint-disable-next-line @typescript-eslint/no-floating-promises
				checkpoint_model.default.create(
					{ scope, weapp, user, method, original },

				)


				next()

			}

			else {
				throw new reply.Unauthorized('permission denied')

			}

		},

	]

}


export const router = express.Router()

router.post(
	'/token',

	async function create(req, res) {
		let doc = await token_model.default.create(
			{},

		)

		res.json(
			structure.pick(doc, 'value', 'refresh', 'expire'),

		)

	},

)

router.get(
	'/token',

	retrieve_router.survive_token,

	function retrieve(req, res) {
		let doc = req.survive_token!

		res.json(
			structure.pick(doc, 'expire', 'scope', 'is_super', 'mode'),

		)

	},

)

router.put(
	'/token',

	async function update(req, res) {
		let authorization = req.get('Authorization') ?? ''

		let [, refresh] = authorization.split(' ')

		let doc = await token_model.default.replenish(refresh)

		res.json(
			structure.pick(doc, 'value', 'refresh', 'expire'),

		)


	},

)