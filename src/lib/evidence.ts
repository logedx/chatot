import mongoose, { Types } from 'mongoose'

import * as reply from './reply.js'
import * as structure from './structure.js'
import * as detective from './detective.js'


export type Infer<V, T> = (v: V) => T | Promise<T>

export type InferAlias<T extends object, K extends keyof T> = Exclude<keyof T, K>

export type InferOption<T extends object, K extends keyof T> = {
	rename?: K
	alias?: InferAlias<T, K>
	quiet?: true

}

export type InferQuietOption<T extends object, K extends keyof T> = {
	quiet: true
	alias?: InferAlias<T, K>

}

export type InferPartialQuietOption<T extends object, K extends keyof T> = {
	quiet?: true
	alias?: InferAlias<T, K>

}

export type InferRenameOption<T extends object, K extends keyof T> = {
	rename: K

} & (
		K extends keyof structure.GetPartial<T>
		? InferQuietOption<T, K>
		: InferPartialQuietOption<T, K>

	)




// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExhibitKey<T, N extends keyof T> = T extends Array<any> ? number : N


export type ExhibitValue<T, N extends keyof T> = T extends Array<infer A> ? A : T[N]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExhibitExpectValue<T> = T extends Array<any> ? T : Partial<T>



export type PaginSuspect = {
	skip: number
	limit: number
	sort: string

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PaginLinker<T extends object> = T extends Array<any> ? never : T

export type Keyword<
	T extends string,
	L extends string = structure.GetUnionLastElement<T>

> = [T] extends [never]
	? []

	// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
	: [...Keyword<Exclude<T, L>>, { [k in L]: RegExp },]




export class Exhibit<T extends object> {
	#source: unknown

	#value?: unknown

	#so: boolean | Record<PropertyKey, true> = false

	constructor(source: unknown) {
		this.#source = source

	}

	get source(): unknown {
		return structure.clone(this.#source)

	}

	has(
		key: ExhibitKey<T, keyof T>,
		and?: { empty?: boolean },

	): boolean {
		let a = detective.is_array(this.#value)
			&& detective.is_number(key)

		let b = detective.is_object_legitimism(this.#value)
				&& detective.is_required_string(key)

		if (a === false && b === false) {
			return false

		}


		let v = (this.#value as Record<PropertyKey, unknown>)[key]

		if (detective.is_undefined(v)

		) {
			return false

		}

		if (detective.is_exist(and?.empty)

		) {
			return detective.is_empty(v) === and.empty

		}

		return true


	}

	get(): T

	get<N extends keyof T>(key: ExhibitKey<T, N>, _default?: ExhibitValue<T, N>): ExhibitValue<T, N>

	get<N extends keyof T>(key?: ExhibitKey<T, N>, _default?: ExhibitValue<T, N>): T | ExhibitValue<T, N> {
		if (detective.is_undefined(key)

		) {
			if (detective.is_exist(this.#value)

			) {
				return structure.clone(this.#value) as T

			}

			throw new reply.BadRequest('failed to get any data')

		}

		if (detective.is_number(key)
			&& detective.is_array(this.#value)

		) {
			return structure.clone(this.#value[key]) as ExhibitValue<T, N>

		}

		if (detective.is_object(this.#value)

		) {
			return structure.clone(this.#value[key as N]) as ExhibitValue<T, N>

		}

		if (detective.is_undefined(_default)

		) {
			throw new reply.BadRequest(`${key.toString()} is not exist`)

		}

		return _default

	}

	#del(key: PropertyKey): void {
		if (detective.is_array(this.#value)

		) {
			this.#value.splice(key as number, 1)

		}

		else if (detective.is_object(this.#value)

		) {
			delete this.#value[key]

		}

	}

	#set(key: PropertyKey, value?: unknown): void {
		if (detective.is_object(this.#value) === false) {
			this.#value = {}

		}

		(this.#value as Record<PropertyKey, unknown>)[key] = value

	}

	async set<N extends keyof T, P = ExhibitExpectValue<T>>(
		key: ExhibitKey<T, N>,

		value: T[N] | Promise<T[N]> | ((v: P) => T[N]) | ((v: P) => Promise<T[N]>),

		when?: boolean,

	): Promise<void> {
		if (when === false) {
			return

		}

		if (detective.is_any_function(value)

		) {
			value = value(this.#value as P)

		}

		if (detective.is_number(key)

		) {
			if (detective.is_array(this.#value) === false) {
				this.#value = []

			}

			(this.#value as Array<unknown>)[key] = await value

			return

		}

		if (detective.is_required_string(key)

		) {
			this.#set(key, await value)

			return

		}


		throw new reply.BadRequest('key is invalid')

	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	async deplete<K extends keyof T, V = Exclude<ExhibitValue<T, K>, undefined>>(
		key: ExhibitKey<T, K>,

		fn: (v: V) => void | Promise<void>,

	): Promise<void> {
		if (this.has(key) === false

		) {
			return

		}

		await fn(
			this.get(key) as V,

		)

		this.#del(key)

	}

	inject(target: object): void {
		Object.assign(
			target, this.get(),

		)

	}

	async #call(fn: () => Promise<void>): Promise<void> {
		try {
			await fn()

		}

		catch (e) {
			if (e instanceof reply.Exception) {
				throw e

			}

			if (detective.is_error(e)

			) {
				throw new reply.BadRequest(e.message)

			}

			throw new reply.BadRequest('infer fail')

		}

	}

	async #infer(chain: Chain<T>): Promise<void> {
		this.#value = await chain.verify(this.#source)

		this.#confirm()

	}

	async #infer_signed(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chain: Chain<any, any>,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		option: InferOption<any, any>,

	): Promise<void> {
		if (detective.is_object(this.#source) === false) {
			throw new Error('is not a object')

		}

		if (detective.is_object_key(chain.symbol) === false) {
			throw new Error('symbol is not a object key')

		}

		let key = chain.symbol

		if (detective.is_object_key(option.rename)

		) {
			key = option.rename

		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			let value = await chain.verify(this.#source[chain.symbol])

			this.#confirm(key)
			this.#set(key, value)


			if (detective.is_exist(option.alias)

			) {
				this.#confirm(option.alias)
				this.#set(option.alias, value)

			}

		}

		catch (e) {
			if (detective.is_exist(option.quiet)

			) {
				this.#del(key)

				if (detective.is_exist(option.alias)

				) {
					this.#del(option.alias)

				}

			}

			else {
				throw e

			}


		}



	}


	infer(chain: Chain<T>): Promise<void> {
		return this.#call(
			() => this.#infer(chain),

		)


	}


	infer_signed<K extends Exclude<keyof T, keyof structure.GetPartial<T>>>(
		chain: Chain<T[K], K>,

		option?: InferPartialQuietOption<T, K>,

	): Promise<void>

	infer_signed<K extends keyof structure.GetPartial<T>>(
		chain: Chain<T[K], K>,

		option: InferQuietOption<T, K>,

	): Promise<void>

	infer_signed<K extends keyof T, S extends PropertyKey>(
		chain: Chain<T[K], Exclude<S, K>>,

		option: InferRenameOption<T, K>,

	): Promise<void>

	infer_signed<K extends keyof T, S extends PropertyKey>(
		chain: Chain<T[K], K> | Chain<T[K], Exclude<S, K>>,

		option: InferQuietOption<T, K> | InferPartialQuietOption<T, K> | InferRenameOption<T, K> = {},

	): Promise<void> {
		return this.#call(
			() => this.#infer_signed(
				chain,

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				option as InferOption<any, any>,

			),

		)


	}


	#confirm(v?: PropertyKey): void {
		if (detective.is_undefined(v)

		) {
			this.#so = true

			return

		}

		if (detective.is_object(this.#so)

		) {
			this.#so[v] = true

			return

		}

		this.#so = { [v]: true } as Record<PropertyKey, true>

	}

	so<N extends keyof T>(key?: ExhibitKey<T, N>): boolean {
		if (detective.is_undefined(key)

		) {
			return this.#so === true || detective.is_object(this.#so)

		}

		if (detective.is_object(this.#so)

		) {
			return this.#so[key] === true

		}

		return false

	}


}


export class Chain<T = unknown, K extends undefined | PropertyKey = undefined> {
	#message = ''

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#infer: Infer<any, any>


	#signed?: K

	// eslint-disable-next-line no-use-before-define
	#linker?: Chain<unknown, undefined | PropertyKey>


	get symbol(): undefined | K {
		return this.#signed

	}

	get message(): string {
		if (detective.is_exist(this.#signed)

		) {
			return `${this.#signed.toString()} ${this.#message}`

		}

		return this.#message

	}

	constructor(
		message: string,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		infer: Infer<any, any>,

		option?: {
			signed?: K
			linker?: Chain<unknown, undefined | PropertyKey>

		},


	) {
		this.#message = message

		this.#infer = infer

		this.#signed = option?.signed
		this.#linker = option?.linker


	}

	#buckle<R = unknown>(
		message: string,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		infer: Infer<any, any>,

	): Chain<R, K> {
		return new Chain<R, K>(
			message, infer, { signed: this.#signed, linker: this },

		)

	}

	async verify(value: unknown): Promise<T> {
		let chain: Array<reply.Exception> = []

		try {
			if (detective.is_exist(this.#linker)

			) {
				value = await this.#linker.verify(value)

			}

			value = await this.#infer(value)

			return value as T

		}

		catch (e) {
			if (detective.is_error(e)

			) {
				// eslint-disable-next-line no-ex-assign
				e = new reply.BadRequest(e.message)

			}

			if (e instanceof reply.Exception) {
				chain.unshift(e)

			}

		}


		let [e, ...other] = chain

		for (let ee of other) {
			let message = ee.message
			let stack = ee.stack ?? ''

			for (let [k, v] of ee.data) {
				e.push(k, v)

			}

			e.push(
				message, stack.split('\n'),

			)


		}


		throw e


	}

	signed<N extends undefined | PropertyKey>(name: N): Chain<T, N> {
		return new Chain<T, N>(
			this.#message, this.#infer, { signed: name, linker: this.#linker },

		)

	}

	and<R = T>(
		message: string,

		fn: Infer<T, boolean>,

	): Chain<R, K> {
		return this.#buckle<R>(
			message,

			async (v: T): Promise<T> => {
				await Chain.test(v, message, fn)

				return v

			},

		)

	}

	to<R = unknown>(fn: Infer<T, R>): Chain<R, K> {
		return this.#buckle<R>(this.#message, fn)

	}

	static async test(
		value: unknown,
		message: string,

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		fn: Infer<any, boolean>,

	): Promise<void> {
		let vv = await fn(value)

		if (vv === true) {
			return

		}

		throw new Error(message)


	}

	static infer<T = unknown>(
		message: string,

		fn: Infer<unknown, boolean>,

	): Chain<T> {
		return new Chain<T>(
			message,

			async (v: T): Promise<T> => {
				await Chain.test(v, message, fn)

				return v

			},


		)

	}

}



export class Text {
	static optional = Chain.infer<string>(
		'is not a string', detective.is_string,

	)


	static required = Chain.infer<string>(
		'is not a required string', detective.is_required_string,

	)


	static required_else_null = Chain
		.infer<string>(
			'is not a required string', detective.is_string,

		)
		.to(
			v => detective.is_required_string(v) ? v : null,

		)


	static is_boolean = Chain
		.infer<string>(
			'is not a boolean string', detective.is_boolean_string,

		)
		.to(
			v => v.toLowerCase() === 'true',

		)


	static is_time = Chain.infer<string>(
		'is not a time string', detective.is_24_hour_system_string,

	)


	static is_date = Chain
		.infer<string>(
			'is not a date string', detective.is_date_string,

		)
		.to(
			v => new Date(v),

		)


	static is_date_else_null = Chain
		.infer<string>(
			'is not a date string', detective.is_string,

		)
		.to(
			v => detective.is_date_string(v) ? new Date(v) : null,

		)


	static is_search = Chain
		.infer<string>(
			'is not a required string', detective.is_required_string,

		)
		.to(
			v => new RegExp(v),

		)


	static is_path = Chain
		.infer<string>(
			'is not a path string', detective.is_path_string,

		)


	static is_dirname = Chain
		.infer<string>(
			'is not a dirname string', detective.is_dirname_string,

		)


	static is_media_uri = Chain
		.infer<string>(
			'is not a media uri string', detective.is_media_uri_string,

		)


	static is_real_number = Chain
		.infer<string>(
			'is not a real number string', detective.is_real_number_string,

		)
		.to(Number)


	static is_natura_number = Chain
		.infer<string>(
			'is not a natura number string', detective.is_natural_number_string,

		)
		.to(Number)


	static is_phone_number = Chain.infer<string>(
		'is not a phone number string', detective.is_phone_number_string,

	)


	static is_object_id = Chain
		.infer<string>(
			'is not a object id string', detective.is_object_id_string,

		)
		.to(
			v => new mongoose.Types.ObjectId(v),

		)


	static is_object_id_else_null = Chain
		.infer<string>(
			'is not a object id string', detective.is_string,

		)
		.to(
			v => detective.is_object_id_string(v) ? new mongoose.Types.ObjectId(v) : null,

		)


	static search<T extends string>(
		...keyword: structure.UnionToTuple<T>

	): Chain<Keyword<T>> {
		return Chain
			.infer<string>(
				'is not a required string', detective.is_required_string,

			)
			.to<Keyword<T>>(
				v => Pagination.match(v, ...keyword),

			)


	}


	static match<T extends string>(regex: string | RegExp): Chain<T> {
		if (detective.is_string(regex)

		) {
			return Chain.infer<T>(
				`string does not match ${regex}`,

				v => detective.is_string(v) && v === regex,

			)


		}

		return Chain.infer<T>(
			`string does not match ${regex}`,

			v => detective.is_string(v) && regex.test(v),

		)


	}


	static include<T extends string>(value: Array<string>): Chain<T> {
		return Chain.infer<T>(
			`string does not include ${value.toString()}`,

			v => detective.is_required_string(v) && value.includes(v),

		)


	}


	static split(pattern: string): Chain<Array<string>> {
		return Chain
			.infer<string>(
				'is not a string', detective.is_string,

			)
			.to(
				v => v.split(pattern),

			)


	}

}


export class Digital {
	static is_real = Chain.infer<number>(
		'is not a real number', detective.is_real_number,

	)

	static is_natural = Chain.infer<number>(
		'is not a natural number', detective.is_natural_number,

	)

	static is_24_hour_system_number = Chain.infer<number>(
		'is not a 24 hour system number', detective.is_24_hour_system_number,

	)

}


export class Switch {
	static is_boolean = Chain.infer<boolean>(
		'is not a boolean', detective.is_boolean,

	)


	static is_number = Chain
		.infer<number>(
			'not 0 or 1', v => v === 0 || v === 1,

		)
		.to(Boolean)


	static is_string = Chain
		.infer<string>(
			'not \'0\' or \'1\' or \'true\' or \'false\'',

			v => detective.is_switch_string(v) || detective.is_boolean_string(v),

		)
		.to(
			v => v === '1' || v.toLowerCase() === 'true',

		)


	static is_expired = this.is_string
		.to(
			v => ({ [['$gte', '$lte'][~~v]]: new Date() } as detective.Expired),

		)


}


export class Range {
	static is_time = Chain.infer<detective.RangeTime>(
		'is not a time range array', detective.is_time_range,

	)


	static is_date = Chain.infer<detective.RangeDate>(
		'is not a date range array', detective.is_date_range,

	)


	static is_real_number = Chain.infer<detective.RangeRealNumber>(
		'is not a real number range array', detective.is_real_number_range,

	)


	static is_natura_number = Chain.infer<detective.RangeNaturalNumber>(
		'is not a real number range array', detective.is_natural_number_range,

	)


	static is_point_coordinates = Chain
		.infer<detective.RangeRealNumber>(
			'is not a real number range array', detective.is_real_number_range,

		)
		.to<detective.PointCoordinates>(
			v => ({ type: 'Point', coordinates: v }),

		)

}


export class Every {
	static is<T>(
		type: string,

		fn: (value: unknown, index?: number, array?: Array<T>) => boolean,

	): Chain<Array<T>> {
		return Chain.infer<Array<T>>(
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
		.to<Array<Types.ObjectId>>(
			v => v.map(
				vv => new mongoose.Types.ObjectId(vv),

			),

		)


}


export class Model {
	static object_id = Chain.infer<Types.ObjectId>(
		'is not a object id', detective.is_object_id,

	)

	static search<T extends string>(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		model: mongoose.Model<any>,
		...keyword: structure.UnionToTuple<T>

	): Chain<Array<Types.ObjectId>> {
		return Text.search<T>(...keyword).to(
			$or => Pagination.search(model, $or),

		)


	}

}


export class Pagination<T extends object = Record<PropertyKey, never>> {
	#skip = 0

	#limit = 10

	#sort = '-created'

	#find?: T

	get skip(): number {
		return this.#skip

	}

	get limit(): number {
		return this.#limit

	}

	get sort(): string {
		return this.#sort

	}

	get find(): PaginLinker<T> {
		if (detective.is_exist(this.#find)

		) {
			return structure.clone(this.#find) as PaginLinker<T>

		}

		throw new reply.BadRequest('value has been exist')

	}

	async linker(exhibit: Exhibit<PaginLinker<T>>): Promise<void> {
		let e = new Exhibit<PaginSuspect>(exhibit.source)

		await e.infer_signed<'skip'>(
			Text.is_natura_number.signed('skip'),

			{ quiet: true },

		)

		await e.infer_signed<'limit'>(
			Text.is_natura_number.signed('limit'),

			{ quiet: true },

		)

		await e.infer_signed<'sort'>(
			Text.required.signed('sort'),

			{ quiet: true },

		)

		await e.infer_signed<'sort'>(
			Text.match(/^-?[a-z]+(,-?[a-z]+)*$/)
				.to<string>(
					v => v.replace(',', ' '),

				)
				.signed('sort'),

			{ quiet: true },

		)



		this.#skip = e.get('skip', 0)
		this.#limit = e.get('limit', 10)

		this.#sort = e.get('sort', '-created')

		this.#find = exhibit.get()

	}

	static match<T extends string>(
		value: string,
		...keyword: structure.UnionToTuple<T>

	): Keyword<T> {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		let map = (k: unknown) => ({ [k as string]: new RegExp(value) })

		return keyword.map(map) as Keyword<T>

	}

	static async search<T extends string>(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		model: mongoose.Model<any>,
		keyword: Keyword<T>,

	): Promise<Array<Types.ObjectId>> {
		let doc = await model.find(
			{ $or: keyword as Array<Record<string, RegExp>> },

		)

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return doc.map(v => v._id as Types.ObjectId)


	}

	static postpone<T extends object>(
		value: Array<T>,

		key: keyof structure.GetProperty<T, number>,

	): number {
		if (value.length < 1) {
			return 0

		}


		let vv = 0

		for (let v of value) {
			let v_ = v[key]

			if (detective.is_number(v_) && v_ > vv

			) {
				vv = v_

			}

		}

		return vv + 1

	}


}




export function suspect<T extends object>(source: unknown): Exhibit<T> {
	return new Exhibit<T>(source)

}

export function pagination<T extends object>(): Pagination<T> {
	return new Pagination<T>()

}
