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

		async function (req, res, next) {
			let method = req.method
			let original = req.originalUrl

			let { weapp, user, scope } = req.survive_token!

			let any = point.length === 0 && scope > 0
			let has = scope_model.some(scope, ...point)

			if (any || has) {
				await checkpoint_model.default.create(
					{ weapp, user, method, original },

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
		let { expire, scope } = req.survive_token!

		res.json(
			{ expire, scope },

		)

	},

)

router.put(
	'/token',

	async function update(req, res) {
		let authorization = req.get('Authorization') ?? ''

		let [, refresh] = authorization.split(' ')

		let doc = await token_model.default
			.findOne(
				{ refresh },

			)


		reply.NotFound.asserts(doc, 'token')

		await doc.replenish()

		res.json(
			structure.pick(doc, 'value', 'refresh', 'expire'),

		)


	},

)