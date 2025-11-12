import mongoose, { Types } from 'mongoose'

import * as i18n from './i18n.js'
import * as reply from './reply.js'
import * as structure from './structure.js'
import * as detective from './detective.js'




export type InferReagent<V, T> = (v: V) => T | Promise<T>

export type InferAlias
<T extends object, V extends keyof T>
// eslint-disable-next-line @stylistic/operator-linebreak
=
Exclude<
	keyof {
		[k in keyof T as T[k] extends T[V] ? k : never]: T[k]

	},

	V

>

export type InferOption
<T extends object = object, K extends keyof T = keyof T>
// eslint-disable-next-line @stylistic/operator-linebreak
=
{
	rename?: K
	alias? : InferAlias<T, K>

	cover?   : true
	optional?: true

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	when?    : boolean | Promise<boolean> | ( (...args: any[]) => Promise<boolean>)

}

export type InferOptiond
<
	C,
	T extends object = object,
	K extends keyof T = keyof T,
	P extends PropertyKey = K,

	O = Pick<InferOption<T, K>, 'alias' | 'cover' | 'when'>,

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
K extends P
	? [chain: C, option?: O]
	// eslint-disable-next-line @stylistic/type-named-tuple-spacing
	: [chain: C, option : O & { rename: K } ]


export type PagerSuspect = {
	skip? : number
	limit?: number
	sort? : string

}



export type Keyword
<
	T extends string,
	L = structure.GetUnionLastElement<T>,

>
// eslint-disable-next-line @stylistic/operator-linebreak
=
[T] extends [never]
	? []
	// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
	: [...Keyword<Exclude<T, L> >, { [k in L as string]: RegExp }]

export type BetweenQuery<T extends number | Date> = null | { $gte?: T, $lte?: T }

export type PointCoordinates = {
	type       : 'Point'
	coordinates: detective.Range<number>

}


export class Dossier<T extends Record<PropertyKey, unknown> >
{
	#target: unknown

	#value: Record<PropertyKey, unknown> = {}

	get target () : unknown
	{
		return structure.clone(this.#target)

	}


	constructor (target: unknown)
	{
		this.#target = target

	}

	#del <K extends keyof T> (key: K): T[K]
	{
		let v = this.#value[key]

		delete this.#value[key]

		return v as T[K]

	}

	#set (key: PropertyKey, value: unknown): void
	{
		this.#value[key] = value

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async #infer (chain: Clue<unknown, PropertyKey>, option?: InferOption<any, any>): Promise<void>
	{
		if (detective.is_object(this.#target) === false)
		{
			throw new reply.BadRequest('is not a object')

		}

		let key = chain.symbol


		let alias = option?.alias
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		let rename = option?.rename

		let cover = option?.cover
		let optional = option?.optional

		let when = option?.when

		if (detective.is_any_function(when) )
		{
			when = when()

		}

		if (detective.is_promise(when) )
		{
			when = await when

		}

		if (when === false)
		{
			return

		}


		try
		{
			let value = await chain.verify(this.#target[key])

			if (detective.is_object_key(alias) )
			{
				this.#set(alias, value)

			}

			if (detective.is_object_key(rename) )
			{
				this.#set(rename, value)

			}

			else
			{
				this.#set(key, value)

			}


		}

		catch (e)
		{
			if (cover)
			{
				this.#del(key)

				if (detective.is_object_key(alias) )
				{
					this.#del(alias)

				}

				if (detective.is_object_key(rename) )
				{
					this.#del(rename)

				}


			}

			if (detective.is_empty(optional) )
			{
				throw e

			}


		}



	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async #call (fn: (...args: any[]) => Promise<any>): Promise<void>
	{
		try
		{
			await fn()

		}

		catch (e)
		{
			if (e instanceof reply.Exception)
			{
				throw e

			}

			if (detective.is_error(e) )
			{
				throw new reply.BadRequest(e.message)

			}

			throw new reply.BadRequest('infer fail')

		}

	}


	has (key: keyof T, and?: { empty?: boolean }): boolean
	{
		let value = this.#value[key]

		if (detective.is_undefined(value) )
		{
			return false

		}

		if (detective.is_exist(and?.empty) )
		{
			return detective.is_empty(value) === and.empty

		}

		return true


	}

	get (): T

	get <K extends keyof T> (key: K): T[K]

	get <K extends keyof T> (key: K, _default: T[K]): Exclude<T[K], undefined>

	get (arg1?: unknown, arg2?: unknown): unknown
	{
		if (detective.is_undefined(arg1) )
		{
			return structure.clone(this.#value) as T

		}

		if (detective.is_object_key(arg1) === false
			|| detective.is_object_keyof(this.#value, arg1) === false

		)
		{
			if (detective.is_undefined(arg2) )
			{
				throw new reply.BadRequest('invalid key')

			}

			return arg2

		}

		let v = this.#value[arg1 as keyof T]

		if (detective.is_undefined(v) === false)
		{
			return structure.clone(v)

		}

		if (detective.is_undefined(arg2) )
		{
			throw new reply.BadRequest(`${String(arg1)} is not exist`)

		}

		return arg2

	}

	async set
	<K extends keyof T> (
		key: K,

		value: T[K] | Promise<T[K]> | ( (v: Partial<T>) => T[K] | Promise<T[K]>),

		when?: InferOption['when'],

	)
	: Promise<void>
	{
		if (detective.is_any_function(when) )
		{
			when = when()

		}

		if (detective.is_promise(when) )
		{
			when = await when

		}

		if (when === false)
		{
			return

		}

		if (detective.is_any_function(value) )
		{
			value = value(this.#value as Partial<T>)

		}

		this.#set(key, await value)

	}


	async deplete
	<K extends keyof T, V = Exclude<T[K], undefined> > (
		key: K,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		fn?: (v: V) => any,

	)
	: Promise<void>
	{
		if (this.has(key) === false)
		{
			return

		}

		await fn?.(this.#del(key) as V)

	}

	inject (target: object): void
	{
		Object.assign(target, this.get() )

	}

	infer
	<K extends keyof structure.GetRequired<T>, P extends PropertyKey = K> (
		...[chain, option]: InferOptiond<Clue<Exclude<T[K], undefined>, P>, T, K, P>

	)
	: Promise<void>
	{
		return this.#call(
			() => this.#infer(chain, option as InferOption),

		)


	}

	infer_optional
	<K extends keyof structure.GetPartial<T>, P extends PropertyKey = K> (
		...[chain, option]: InferOptiond<Clue<Exclude<T[K], undefined>, P>, T, K, P>

	)
	: Promise<void>
	{
		return this.#call(
			() => this.#infer(chain, { ...option, optional: true } as InferOption),

		)


	}

	so (key: keyof T): boolean
	{
		return detective.is_object_keyof(this.#value, key)

	}


}


export class Clue
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
<T = unknown, K extends void | PropertyKey = void>
{
	#message: string | i18n.Speech = ''

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#reagent: InferReagent<any, any>


	#signed?: PropertyKey

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#linker?: Clue<any, any>


	get symbol (): K
	{
		return this.#signed as K

	}

	constructor
	(
		message: string | i18n.Speech,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		handle: InferReagent<any, any>,

		option?: {
			signed?: K
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			linker?: Clue<any, any>

		},

	)
	{
		this.#message = message

		this.#reagent = handle

		this.#signed = option?.signed as PropertyKey
		this.#linker = option?.linker


	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#buckle <R> (message: string | i18n.Speech, reagent: InferReagent<any, any>): Clue<R, K>
	{
		return new Clue<R, K>(
			message, reagent, { signed: this.#signed as K, linker: this },

		)

	}

	async verify (value: unknown): Promise<T>
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let x: reply.Exception<any> = new reply.BadRequest(this.#message)

		try
		{
			if (detective.is_exist(this.#linker) )
			{
				value = await this.#linker.verify(value)

			}

			value = await this.#reagent(value)

			return value as T

		}

		catch (e)
		{
			if (detective.is_error(e) )
			{
				x = new reply.BadRequest(e.message)

			}

			if (e instanceof reply.Exception)
			{
				x = e

			}

		}

		x.push('symbol', String(this.#signed) )

		throw x


	}

	signed
	<N extends PropertyKey>(name: N): Clue<T, N>
	{
		return new Clue<T, N>(
			this.#message, this.#reagent, { signed: name, linker: this.#linker },

		)

	}

	and <R = T> (message: string, fn: InferReagent<T, boolean>): Clue<R, K>
	{
		return this.#buckle<R>(
			message,

			async (v: T): Promise<T> =>
			{
				await Clue.test(v, message, fn)

				return v

			},

		)

	}

	to <R> (fn: InferReagent<T, R>): Clue<R, K>
	{
		return this.#buckle(this.#message, fn)

	}

	static async test
	(
		value: unknown,
		message: string | i18n.Speech,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		fn: InferReagent<any, boolean>,

	)
	: Promise<void>
	{
		let vv = await fn(value)

		if (vv === true)
		{
			return

		}

		throw new reply.BadRequest(message)


	}

	static infer
	<T = unknown> (message: string | i18n.Speech, fn: InferReagent<unknown, boolean>): Clue<T>
	{
		return new Clue<T>(
			message,

			async (v: T): Promise<T> =>
			{
				await Clue.test(v, message, fn)

				return v

			},


		)

	}

}



export class Text
{
	static optional = Clue.infer<string>(
		'is not a string',

		detective.is_string,

	)


	static required = Clue.infer<string>(
		'is not a required string',

		detective.is_required_string,

	)


	static required_else_null = Clue
		.infer<string>(
			'is not a required string',

			detective.is_string,

		)
		.to(
			v => detective.is_required_string(v) ? v : null,

		)


	static is_boolean = Clue
		.infer<string>(
			'is not a boolean string',

			detective.is_boolean_string,

		)
		.to(
			v => v.toLowerCase() === 'true',

		)


	static is_time = Clue.infer<string>(
		'is not a time string',

		detective.is_24_hour_system_string,

	)


	static is_date = Clue
		.infer<string>(
			'is not a date string',

			detective.is_date_string,

		)
		.to(
			v => new Date(v),

		)


	static is_date_else_null = Clue
		.infer<string>(
			'is not a date string',

			detective.is_string,

		)
		.to(
			v => detective.is_date_string(v) ? new Date(v) : null,

		)


	static is_search = Clue
		.infer<string>(
			'is not a required string',

			detective.is_required_string,

		)
		.to(
			v => new RegExp(v),

		)


	static is_path = Clue
		.infer<string>(
			'is not a path string',

			detective.is_path_string,

		)


	static is_dirname = Clue
		.infer<string>(
			'is not a dirname string',

			detective.is_dirname_string,

		)


	static is_media_uri = Clue
		.infer<string>(
			'is not a media uri string',

			detective.is_media_uri_string,

		)


	static is_real_number = Clue
		.infer<string>(
			'is not a real number string',

			detective.is_real_number_string,

		)
		.to(Number)


	static is_natura_number = Clue
		.infer<string>(
			'is not a natura number string',

			detective.is_natural_number_string,

		)
		.to(Number)


	static is_phone_number = Clue.infer<string>(
		'is not a phone number string',

		detective.is_phone_number_string,

	)


	static is_object_id = Clue
		.infer<string>(
			'is not a object id string',

			detective.is_object_id_string,

		)
		.to(
			v => new mongoose.Types.ObjectId(v),

		)


	static is_object_id_else_null = Clue
		.infer<string>(
			'is not a object id string',

			detective.is_string,

		)
		.to(
			v => detective.is_object_id_string(v) ? new mongoose.Types.ObjectId(v) : null,

		)


	static search
	<T extends string> (...keyword: structure.UnionToTuple<T>): Clue<Keyword<T> >
	{
		return Clue
			.infer<string>(
				'is not a required string',

				detective.is_required_string,

			)
			.to<Keyword<T> >(
				v => Pager.match(v, ...keyword),

			)


	}


	static match
	<T extends string>(regex: string | RegExp): Clue<T>
	{
		if (detective.is_string(regex) )
		{
			return Clue.infer<T>(
				`string does not match ${regex}`,

				v => detective.is_string(v) && v === regex,

			)


		}

		return Clue.infer<T>(
			`string does not match ${regex}`,

			v => detective.is_string(v) && regex.test(v),

		)


	}


	static include<T extends string>(value: string[]): Clue<T>
	{
		return Clue.infer<T>(
			`string does not include ${value.toString()}`,

			v => detective.is_required_string(v) && value.includes(v),

		)


	}


	static split (pattern: string): Clue<string[]>
	{
		return Clue
			.infer<string>(
				'is not a string',

				detective.is_string,

			)
			.to(
				v => v.split(pattern),

			)


	}


	static between (type: 'date', pattern?: string): Clue<BetweenQuery<Date> >

	static between (type: 'number', pattern?: string): Clue<BetweenQuery<number> >

	static between (type: unknown, pattern = ','): unknown
	{
		return this.split(pattern)
			.to(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
				v => Pager.between(type as any, ...v),

			)

	}

}


export class Digital
{
	static is_real = Clue.infer<number>(
		'is not a real number',

		detective.is_real_number,

	)

	static is_natural = Clue.infer<number>(
		'is not a natural number',

		detective.is_natural_number,

	)

	static is_month_number = Clue.infer<number>(
		'is not a month number',

		detective.is_month_number,

	)

	static is_24_hour_system_number = Clue.infer<number>(
		'is not a 24 hour system number',

		detective.is_24_hour_system_number,

	)

}


export class Switch
{
	static is_boolean = Clue.infer<boolean>(
		'is not a boolean',

		detective.is_boolean,

	)


	static is_number = Clue
		.infer<number>(
			'not 0 or 1', v => v === 0 || v === 1,

		)
		.to(Boolean)


	static is_string = Clue
		.infer<string>(
			'not \'0\' or \'1\' or \'true\' or \'false\'',

			v => detective.is_switch_string(v) || detective.is_boolean_string(v),

		)
		.to(
			v => v === '1' || v.toLowerCase() === 'true',

		)


}


export class Range
{
	static is <T>
	(message: string, predicate: detective.Predicate<T>): Clue<detective.Range<T> >
	{
		return Clue.infer<detective.Range<T> >(
			message,

			v => detective.is_range(v, predicate),

		)

	}


	static is_24_hour_system_string = this.is<string>(
		'is not a 24 hour system range array',

		detective.is_24_hour_system_string,

	)


	static is_24_hour_system_number = this.is<number>(
		'is not a 24 hour system range array',

		detective.is_24_hour_system_number,

	)


	static is_date = this.is<Date>(
		'is not a date range array',

		detective.is_date,

	)


	static is_date_string = this.is<string>(
		'is not a date string range array',

		detective.is_date_string,

	)
		.to(
			v => v.map(vv => new Date(vv) ),

		)


	static is_real_number = this.is<number>(
		'is not a real number range array',

		detective.is_real_number,

	)


	static is_natural_number = this.is<number>(
		'is not a natural number range array',

		detective.is_natural_number,

	)


	static is_point_coordinates = this.is<number>(
		'is not a point coordinates range array',

		detective.is_real_number,

	)
		.to<PointCoordinates>(
			v => ({ type: 'Point', coordinates: v }),

		)

}


export class Between
{
	static is <T>
	(message: string, predicate: detective.Predicate<T>): Clue<detective.Range<T> >
	{
		return Clue.infer<detective.Range<T> >(
			message,

			v => detective.is_between(v, predicate),

		)

	}


	static is_24_hour_system_string = this.is<string>(
		'is not a 24 hour system between array',

		detective.is_24_hour_system_string,

	)


	static is_24_hour_system_number = this.is<number>(
		'is not a 24 hour system between array',

		detective.is_24_hour_system_number,

	)


	static is_date = this.is<Date>(
		'is not a date between array',

		detective.is_date,

	)


	static is_date_string = this.is<string>(
		'is not a date string between array',

		detective.is_date_string,

	)
		.to(
			v => v.map(vv => new Date(vv) ),

		)


	static is_real_number = this.is<number>(
		'is not a real number between array',

		detective.is_real_number,

	)


	static is_natural_number = this.is<number>(
		'is not a natural number between array',

		detective.is_natural_number,

	)


}


export class Every
{
	static is
	<T>
	(
		type: string,

		fn: (value: unknown, index?: number, array?: T[]) => boolean,

	)
	: Clue<T[]>
	{
		return Clue.infer<T[]>(
			`one of the elements is not a ${type}`,

			v => detective.is_array_every(v, fn),

		)

	}

	static is_number = this.is<number>(
		'number',

		detective.is_number,

	)

	static is_real_number = this.is<number>(
		'real number',

		detective.is_real_number,

	)

	static is_natural_number = this.is<number>(
		'natural number',

		detective.is_natural_number,

	)

	static is_string = this.is<string>(
		'string',

		detective.is_string,

	)

	static is_required_string = this.is<string>(
		'required string',

		detective.is_required_string,

	)

	static is_media_uri_string = this.is<string>(
		'media uri string',

		detective.is_media_uri_string,

	)

	static is_object_id = this.is<Types.ObjectId>(
		'object id',

		detective.is_object_id,

	)

	static is_object_id_string = this
		.is<string>(
			'object id string',

			detective.is_object_id_string,

		)
		.to<Types.ObjectId[]>(
			v => v.map(
				vv => new mongoose.Types.ObjectId(vv),

			),

		)


}


export class Model
{
	static object_id = Clue.infer<Types.ObjectId>(
		'is not a object id',

		detective.is_object_id,

	)

	static search
	<T extends string> (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		model: mongoose.Model<any>,

		...keyword: structure.UnionToTuple<T>

	)
	: Clue<Types.ObjectId[]>
	{
		return Text.search<T>(...keyword).to(
			$or => Pager.search(model, $or),

		)


	}

}


export class Pager
<T extends Record<PropertyKey, unknown> = Record<PropertyKey, never> >
{
	#skip = 0

	#limit = 10

	#sort = '-created'

	#find: Record<PropertyKey, unknown> = {}

	get skip (): number
	{
		return this.#skip

	}

	get limit (): number
	{
		return this.#limit

	}

	get sort (): string
	{
		return this.#sort

	}

	get find (): T
	{
		return structure.clone(this.#find) as T

	}

	async fit (dossier: Dossier<T>): Promise<void>
	{
		let e = new Dossier<PagerSuspect>(dossier.target)

		await e.infer_optional<'skip'>(
			Text.is_natura_number.signed('skip'),

		)

		await e.infer_optional<'limit'>(
			Text.is_natura_number.signed('limit'),

		)

		await e.infer_optional<'sort'>(
			Text.required.signed('sort'),

		)

		await e.infer_optional<'sort'>(
			Text.match(/^-?[a-z]+(,-?[a-z]+)*$/)
				.to<string>(
					v => v.replace(',', ' '),

				)
				.signed('sort'),

		)


		this.#skip = e.get('skip', 0)
		this.#limit = e.get('limit', 10)

		this.#sort = e.get('sort', '-created')

		this.#find = dossier.get()

	}

	static match
	<T extends string>(value: string, ...keyword: structure.UnionToTuple<T>): Keyword<T>
	{
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		let map = (k: unknown) => ({ [k as string]: new RegExp(value) })

		return keyword.map(map) as Keyword<T>

	}


	static between (type: 'date', early?: unknown, lastly?: unknown): BetweenQuery<Date>

	static between (type: 'number', early?: unknown, lastly?: unknown): BetweenQuery<number>

	static between (type: unknown, early?: unknown, lastly?: unknown): unknown
	{
		if (detective.is_empty(early) && detective.is_empty(lastly) )
		{
			return null

		}

		let map: BetweenQuery<number | Date> = {}

		if (type === 'number')
		{
			let early_ = Number(early)
			let lastly_ = Number(lastly)

			if (Number.isNaN(early_) === false)
			{
				map.$gte = early_

			}

			if (Number.isNaN(lastly_) === false)
			{
				map.$lte = lastly_

			}

		}

		if (type === 'date')
		{
			let early_ = new Date(early as string | number | Date)
			let lastly_ = new Date(lastly as string | number | Date)

			if (detective.is_date(early_) )
			{
				map.$gte = early_

			}

			if (detective.is_date(lastly_) )
			{
				map.$lte = lastly_

			}

		}

		return map


	}

	static async search
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	<T extends string>(model: mongoose.Model<any>, keyword: Keyword<T>): Promise<Types.ObjectId[]>
	{
		let doc = await model.find(
			{ $or: keyword as Array<Record<string, RegExp> > },

		)

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return doc.map(v => v._id as Types.ObjectId)


	}

	static increase
	<T extends object>(value: T[], key: keyof structure.GetProperty<T, number>): number
	{
		if (value.length < 1)
		{
			return 0

		}


		let vv = 0

		for (let v of value)
		{
			let v_ = v[key]

			if (detective.is_number(v_) && v_ > vv)
			{
				vv = v_

			}

		}

		return vv + 1

	}


}




export async function infer<T> (target: unknown, chain: Clue<T>, default_?: T): Promise<T>
{
	try
	{
		return await chain.verify(target)

	}

	catch (e)
	{
		if (detective.is_exist(default_) )
		{
			return default_

		}

		throw e

	}


}

export function capture<T extends Record<PropertyKey, unknown> > (target: unknown): Dossier<T>
{
	return new Dossier<T>(target)

}

export function fritter<T extends Record<PropertyKey, unknown> > (): Pager<T>
{
	return new Pager<T>()

}
