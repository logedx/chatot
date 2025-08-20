import chalk from 'chalk'
import express from 'express'

import * as i18n from './i18n.js'
import * as secret from './secret.js'
import * as detective from './detective.js'


export function stdio (id: string, e: unknown): void
{
	console.warn(
		chalk.grey(`▼ [${id}]`),

	)


	if (e instanceof Exception)
	{
		for (let [name, data] of e.data)
		{
			if (detective.is_undefined(data) )
			{
				data = null

			}

			console.group()

			console.warn(
				chalk.yellow(`⁘ ${name}`),

			)


			console.group()

			console.warn(
				chalk.italic(
					JSON.stringify(data, null, '  ').split('\n')
						.map(v => `  ${v}`)
						.join('\n'),

				),

			)

			console.groupEnd()
			console.groupEnd()

			console.warn()

		}

	}

	if (e instanceof Error)
	{
		console.group()

		console.error(
			chalk.red(`◉ ${e.stack}`),

		)

		console.groupEnd()

	}



	console.warn()

	console.warn(
		chalk.grey(`▲ [${id}]`),

	)

	console.warn('\n\n')


}

export function stdio_ (req: express.Request, e: NodeJS.ErrnoException): void
{
	let id = secret.hex(8)

	let date = new Date().toISOString()

	let method = req.method.toUpperCase()


	console.log(
		`${method} ${e.code} 0 ms\n - ${req.originalUrl}\n - ${date} ⊶ ${req.ip} ⊶ ${id}\n`,

	)

	stdio(id, e)

}


export class Exception<L extends i18n.Language = never> extends Error implements NodeJS.ErrnoException
{
	#mute = false

	#data: Array<[string, unknown]> = []

	#speech?: i18n.Speech<L>

	get data (): Array<[string, unknown]>
	{
		return this.#data

	}

	constructor (message: string | i18n.Speech<L> = '')
	{
		if (detective.is_string(message) )
		{
			super(message)

		}
		else
		{
			super(message.local('en') )

			this.#speech = message

		}

		Error.captureStackTrace(this, this.constructor)

	}

	mute (when: boolean): this
	{
		this.#mute = when

		return this

	}

	local (lang: 'en' | L): string
	{
		return this.#speech?.local(lang) ?? this.message

	}

	push (name: string, data: unknown): this
	{
		if (detective.is_undefined(data) )
		{
			data = null

		}

		this.#data.push(
			[name, data],

		)

		return this

	}

	collect (): string[]
	{
		if (this.#mute || detective.is_empty(this.stack) )
		{
			return []

		}

		return this.stack.split('\n')

	}

}


/**
 * 请求参数有误。
 */
export class BadRequest<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'BadRequest'

	readonly errno = 400


}


/**
 * 当前请求需要用户验证。
 */
export class Unauthorized<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'Unauthorized'

	readonly errno = 401

}


/**
 * 服务器已经理解请求，但是拒绝执行它。
 */
export class Forbidden<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'Forbidden'

	readonly errno = 403

}


/**
 * 请求失败，请求所希望得到的资源未被在服务器上发现。
 */
export class NotFound<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'NotFound'

	readonly errno = 404

	static asserts<T>(value: T, message: string | i18n.Speech): asserts value is Exclude<T, null | undefined>

	static asserts<T>(value: T, condition: boolean, message: string | i18n.Speech): asserts value is Exclude<T, null | undefined>

	static asserts<T>(value: T, a: string | i18n.Speech | boolean, b?: string | i18n.Speech): asserts value is Exclude<T, null | undefined>
	{
		if (detective.is_string(a) )
		{
			;[a, b] = [true, a]

		}

		if (a === false || detective.is_empty(value) )
		{
			throw new NotFound(b)

		}

	}

}


/**
 * 请求行中指定的请求方法不能被用于请求相应的资源。
 */
export class MethodNotAllowed<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'MethodNotAllowed'

	readonly errno = 405

}


/**
 * 请求超时。
 */
export class RequestTimeout<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'RequestTimeout'

	readonly errno = 408

}


/**
 * 由于和被请求的资源的当前状态之间存在冲突，请求无法完成。
 */
export class Conflict<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'Conflict'

	readonly errno = 409

}


/**
 * 被请求的资源在服务器上已经不再可用，而且没有任何已知的转发地址。
 */
export class Gone<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'Gone'

	readonly errno = 410

}


/**
 * 服务器拒绝在没有定义 Content-Length 头的情况下接受请求。
 * 在添加了表明请求消息体长度的有效 Content-Length 头之后，客户端可以再次提交该请求。
 */
export class Lengthrequired<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'Lengthrequired'

	readonly errno = 411

}


/**
 * 服务器拒绝处理当前请求，因为该请求提交的实体数据大小超过了服务器愿意或者能够处理的范围。
 */
export class PayloadTooLarge<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'PayloadTooLarge'

	readonly errno = 413

}


/**
 * 对于当前请求的方法和所请求的资源，请求中提交的实体并不是服务器中所支持的格式，因此请求被拒绝。
 */
export class UnsupportedMediaType<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'UnsupportedMediaType'

	readonly errno = 415

}


/**
 * 服务器不愿意冒着风险去处理可能重播的请求。
 */
export class TooEarly<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'TooEarly'

	readonly errno = 425

}


/**
 * 用户在给定的时间内发送了太多请求（“限制请求速率”）。
 */
export class TooManyRequests<L extends i18n.Language> extends Exception<L>
{
	readonly name = 'TooManyRequests'

	readonly errno = 429

}
