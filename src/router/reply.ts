import express from 'express'
import * as mongoose from 'mongoose'

import * as reply from '../lib/reply.js'
import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'

import * as mongo_i18n from '../i18n/mongo.js'


const { NODE_ENV } = process.env



declare global
{
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express
	{
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Response
		{
			stdio(e: unknown): void
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			issue(fn: () => any): void

		}

	}

}



export const stdio: express.RequestHandler = function stdio (req, res, next)
{
	let queue: unknown[] = []


	req.headers['x-request-id'] = secret.hex(8)

	res.once(
		'finish',

		async () =>
		{
			let id = req.get('x-request-id')

			if (NODE_ENV === 'test' || detective.is_empty(id) )
			{
				return

			}

			let resolve = await Promise.all(
				queue.map(
					async v =>
					{
						if (detective.is_promise(v) )
						{
							try
							{
								await v

							}

							catch (e)
							{
								return e

							}

						}

						return v

					},

				),

			)

			for (let [i, v] of resolve.entries() )
			{
				let ii = i.toString().padStart(2, '0')

				reply.stdio(`${id}.${ii}`, v)


			}


		},

	)

	// eslint-disable-next-line @typescript-eslint/no-shadow
	res.stdio = function stdio (e)
	{
		if (detective.is_exist(e) )
		{
			queue.push(e)

		}

	}

	next()

}


export const issue: express.RequestHandler = function issue (req, res, next)
{
	function stdio_ (e: NodeJS.ErrnoException): void
	{
		// eslint-disable-next-line @typescript-eslint/unbound-method
		if (detective.is_function(res.stdio) )
		{
			res.stdio(e)

		}

		else
		{
			reply.stdio_(req, e)

		}

	}

	// eslint-disable-next-line @typescript-eslint/no-shadow
	res.issue = function issue (fn)
	{
		try
		{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			let v = fn()

			if (detective.is_promise(v) )
			{
				v.catch(stdio_)


			}


		}

		catch (e)
		{
			stdio_(e as NodeJS.ErrnoException)

		}

	}

	next()

}

/**
 * NotFound
 */
export const not_found: express.RequestHandler = function not_found (req)
{
	let e = new reply.NotFound(req.path)

	e.push('headers', req.headers)

	throw e

}


/**
 * 错误响应
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const finish: express.ErrorRequestHandler = function finish (e: NodeJS.ErrnoException, req, res, _next)
{
	let stack = e.stack ?? ''

	if (e instanceof mongoose.mongo.MongoServerError
		&& detective.is_number(e.code)
		&& detective.is_exist(mongo_i18n.server_error[e.code]) )
	{
		e = new reply.BadRequest(mongo_i18n.server_error[e.code])

		e.stack = stack

	}

	if (e instanceof reply.Exception === false)
	{
		e = new reply.BadRequest(e.message)

		e.stack = stack

	}

	// eslint-disable-next-line @typescript-eslint/unbound-method
	if (detective.is_function(res.stdio) )
	{
		res.stdio(e)

	}

	else
	{
		reply.stdio_(req, e)

	}

	res.status(e.errno ?? 500)
		.json(
			{
				name   : e.name,
				message: e.message,
				stack  : (e as reply.Exception).mute(NODE_ENV === 'production').collect(),

			},

		)


}
