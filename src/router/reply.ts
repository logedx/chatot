import express from 'express'
import * as mongoose from 'mongoose'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as mongo_i18n from '../i18n/mongo.js'


const { NODE_ENV } = process.env



declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Response {
			stdio: (e: unknown) => void

		}

	}

}



export const stdio: express.RequestHandler = function stdio(req, res, next) {
	let queue: Array<unknown> = []


	req.headers['x-request-id'] = secret.hex(8)

	res.once(
		'finish',

		async () => {
			let id = req.get('x-request-id')

			if (NODE_ENV === 'test' || detective.is_empty(id)

			) {
				return

			}

			let resolve = await Promise.all(
				queue.map(
					async v => {
						if (detective.is_promise(v)

						) {
							try {
								await v

							}

							catch (e) {
								return e

							}

						}

						return v

					},

				),

			)

			for (let [i, v] of resolve.entries()

			) {
				let ii = i.toString().padStart(2, '0')

				reply.stdio(`${id}.${ii}`, v)


			}


		},

	)

	// eslint-disable-next-line @typescript-eslint/no-shadow
	res.stdio = function stdio(e) {
		if (detective.is_exist(e)

		) {
			queue.push(e)

		}

	}

	next()

}


/**
 * NotFound
 */
export const not_found: express.RequestHandler = function not_found(req) {
	let e = new reply.NotFound(req.path)

	e.push('headers', req.headers)

	throw e

}


/**
 * 错误响应
 */
export const finish: express.ErrorRequestHandler = function finish(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	e: NodeJS.ErrnoException, req, res, _next,

) {
	let stack = e.stack ?? ''

	// set locals, only providing error in develop
	if (NODE_ENV === 'production') {
		stack = ''

	}

	if (e instanceof mongoose.mongo.MongoServerError
		&& detective.is_number(e.code)
		&& detective.is_exist(mongo_i18n.server_error[e.code])

	) {
		e = new reply.BadRequest(mongo_i18n.server_error[e.code])

	}

	if (e instanceof reply.Exception === false

	) {
		e = new reply.BadRequest(e.message)

	}

	if (detective.is_exist(res.stdio)

	) {
		res?.stdio(e)

	}

	else {
		reply.stdio(
			secret.hex(8), e,

		)

	}

	res.status(e.errno ?? 500)
		.json(
			{ name: e.name, message: e.message, stack: stack.split('\n') },

		)

}
